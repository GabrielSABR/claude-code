# ============================================================
# APLICAR DIRECIONAMENTO DETALHADO — META ADS
# ============================================================
# Como usar:
#   1. Abra o arquivo interesses.txt e cole os interesses (um por linha)
#   2. Execute este script no PowerShell
#   3. O script busca cada interesse na API do Meta e aplica no conjunto
# ============================================================

param(
    [string]$AdSetId    = "120239286911670701",
    [string]$Token      = "EAANLTeYyickBQ90sQhLa0vvISln9o2aZAYZBNQDyzoNqRqSe8v6iD5Q2ZCQBvpeDaNmdZCUdbg7FxRMZByTpnrSGQDVdRIVg4NyscAmjdAuQZBNyGDvsrBIHbCOB2cE5q3JUhqyMFRDAlEu7QayQZBTgnQI7ZCxdEjJJpaFrIo1oNZAEoSfZBLZCjYUU9nBHp5UVi6WcT21tcHlHaLVLJtzvZBhjrWLWpBkeyYGXcVg3CWX00HL6zQrMQjZBqPA24ECGpGr3u46dt3TUZAfd4jhezdupHQ",
    [string]$ApiVersion = "v22.0",
    [string]$ArquivoInteresses = "$PSScriptRoot\interesses.txt"
)

# ---- Configurações ----
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   DIRECIONAMENTO DETALHADO — META ADS" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ---- Ler arquivo de interesses ----
if (-not (Test-Path $ArquivoInteresses)) {
    Write-Host "ERRO: Arquivo interesses.txt nao encontrado em: $ArquivoInteresses" -ForegroundColor Red
    exit 1
}

$linhas = Get-Content $ArquivoInteresses -Encoding UTF8
$interesses = $linhas | Where-Object { $_ -notmatch '^\s*#' -and $_.Trim() -ne '' }

if ($interesses.Count -eq 0) {
    Write-Host "ERRO: Nenhum interesse encontrado no arquivo interesses.txt" -ForegroundColor Red
    Write-Host "Adicione os interesses no arquivo (um por linha) e execute novamente." -ForegroundColor Yellow
    exit 1
}

Write-Host "Interesses encontrados no arquivo: $($interesses.Count)" -ForegroundColor White
$interesses | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
Write-Host ""

# ---- Buscar cada interesse na API ----
$interessesEncontrados = @()
$interessesNaoEncontrados = @()

foreach ($nome in $interesses) {
    $nomeTrimado = $nome.Trim()
    Write-Host "Buscando: '$nomeTrimado'" -ForegroundColor Yellow -NoNewline

    try {
        $nomeCodificado = [System.Uri]::EscapeDataString($nomeTrimado)
        $url = "https://graph.facebook.com/$ApiVersion/search?type=adinterest&q=$nomeCodificado&limit=10&locale=pt_BR&access_token=$Token"
        $resposta = Invoke-RestMethod -Uri $url -Method Get

        if ($resposta.data -and $resposta.data.Count -gt 0) {
            # Tenta encontrar correspondência exata primeiro
            $exato = $resposta.data | Where-Object { $_.name -eq $nomeTrimado } | Select-Object -First 1

            if ($exato) {
                $melhor = $exato
                Write-Host " ✓ Exato encontrado" -ForegroundColor Green
            } else {
                # Pega o de maior audience_size
                $melhor = $resposta.data | Sort-Object { [long]($_.audience_size) } -Descending | Select-Object -First 1
                Write-Host " ~ Aproximado: '$($melhor.name)'" -ForegroundColor Magenta
            }

            $audiencia = if ($melhor.audience_size) {
                "{0:N0}" -f [long]$melhor.audience_size
            } else { "N/A" }

            Write-Host "   ID: $($melhor.id) | Audiencia: $audiencia | Path: $($melhor.path -join ' > ')" -ForegroundColor Gray

            $interessesEncontrados += @{
                id   = $melhor.id
                name = $melhor.name
            }
        } else {
            Write-Host " ✗ Nao encontrado" -ForegroundColor Red
            $interessesNaoEncontrados += $nomeTrimado
        }
    } catch {
        Write-Host " ✗ Erro: $($_.Exception.Message)" -ForegroundColor Red
        $interessesNaoEncontrados += $nomeTrimado
    }
}

Write-Host ""

# ---- Resumo do que foi encontrado ----
Write-Host "------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "RESUMO:" -ForegroundColor Cyan
Write-Host "  Encontrados : $($interessesEncontrados.Count)" -ForegroundColor Green
Write-Host "  Nao encontrados: $($interessesNaoEncontrados.Count)" -ForegroundColor Red

if ($interessesNaoEncontrados.Count -gt 0) {
    Write-Host ""
    Write-Host "Nao encontrados:" -ForegroundColor Red
    $interessesNaoEncontrados | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
}

if ($interessesEncontrados.Count -eq 0) {
    Write-Host ""
    Write-Host "Nenhum interesse valido encontrado. Verifique os nomes e tente novamente." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Pressione ENTER para aplicar no conjunto de anuncios ou CTRL+C para cancelar..."
Read-Host

# ---- Montar flexible_spec ----
$flexItems = $interessesEncontrados | ForEach-Object {
    '{"id":"' + $_.id + '","name":"' + ($_.name -replace '"', '\"') + '"}'
}
$flexSpec = '[{"interests":[' + ($flexItems -join ',') + ']}]'

# Targeting completo mantendo as configurações existentes
$targetingJson = @"
{
  "geo_locations": {
    "regions": [{"key": "459"}],
    "location_types": ["home", "recent"]
  },
  "age_min": 45,
  "age_max": 65,
  "genders": [0],
  "targeting_automation": {"advantage_audience": 0},
  "flexible_spec": $flexSpec
}
"@

# ---- Aplicar no Ad Set ----
Write-Host "Aplicando direcionamento no conjunto '$AdSetId'..." -ForegroundColor Yellow

try {
    $body = @{
        targeting    = $targetingJson
        access_token = $Token
    }

    $urlUpdate = "https://graph.facebook.com/$ApiVersion/$AdSetId"
    $resultado = Invoke-RestMethod -Uri $urlUpdate -Method Post -Body $body

    if ($resultado.success) {
        Write-Host ""
        Write-Host "============================================================" -ForegroundColor Green
        Write-Host "   DIRECIONAMENTO APLICADO COM SUCESSO!" -ForegroundColor Green
        Write-Host "============================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Interesses aplicados:" -ForegroundColor White
        $interessesEncontrados | ForEach-Object {
            Write-Host "  ✓ $($_.name) (ID: $($_.id))" -ForegroundColor Green
        }
        Write-Host ""
        Write-Host "Conjunto de anuncios: $AdSetId" -ForegroundColor Gray
        Write-Host "Advantage+: DESLIGADO" -ForegroundColor Gray
        Write-Host "Idade: 45 a 65+" -ForegroundColor Gray
        Write-Host "Genero: Todos" -ForegroundColor Gray
        Write-Host "Localizacao: Santa Catarina" -ForegroundColor Gray
    } else {
        Write-Host "Resposta inesperada: $($resultado | ConvertTo-Json)" -ForegroundColor Red
    }
} catch {
    Write-Host ""
    Write-Host "ERRO ao aplicar: $($_.Exception.Message)" -ForegroundColor Red

    # Tenta exibir detalhes do erro da API
    try {
        $erroDetalhado = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Codigo: $($erroDetalhado.error.code)" -ForegroundColor Red
        Write-Host "Mensagem: $($erroDetalhado.error.message)" -ForegroundColor Red
    } catch {}
}

Write-Host ""
Write-Host "Pressione ENTER para fechar..."
Read-Host
