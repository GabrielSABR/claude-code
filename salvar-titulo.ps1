# salvar-titulo.ps1
# Le o session_id do stdin e busca "Salva o titulo como:" na conversa

try {
    $stdin = $input | Out-String
    $json = $stdin | ConvertFrom-Json
    $sessionId = $json.session_id
} catch {
    exit 0
}

if (-not $sessionId) { exit 0 }

# Busca o arquivo .jsonl em todos os projetos do .claude
$claudeProjects = "C:\Users\alves\.claude\projects"
$jsonlFile = Get-ChildItem -Path $claudeProjects -Recurse -Filter "$sessionId.jsonl" -ErrorAction SilentlyContinue | Select-Object -First 1

if (-not $jsonlFile) { exit 0 }

# Le as mensagens e busca "Salva o titulo como:"
$titulo = $null
Get-Content $jsonlFile.FullName -Encoding UTF8 | ForEach-Object {
    try {
        $obj = $_ | ConvertFrom-Json
        $content = ""
        if ($obj.message.role -eq "user") {
            if ($obj.message.content -is [string]) {
                $content = $obj.message.content
            } elseif ($obj.message.content -is [array]) {
                $content = ($obj.message.content | Where-Object { $_.type -eq "text" } | Select-Object -ExpandProperty text) -join " "
            }
            if ($content -match "Salva o t[iíI]tulo como:\s*(.+)") {
                $titulo = $Matches[1].Trim()
            }
        }
    } catch {}
}

if (-not $titulo) { exit 0 }

# Normaliza o titulo removendo caracteres especiais
$tituloNorm = $titulo -replace '[àáâãäå]','a' -replace '[èéêë]','e' -replace '[ìíîï]','i' -replace '[òóôõö]','o' -replace '[ùúûü]','u' -replace '[ç]','c' -replace '[ñ]','n' -replace '[ÀÁÂÃÄÅ]','A' -replace '[ÈÉÊË]','E' -replace '[ÌÍÎÏ]','I' -replace '[ÒÓÔÕÖ]','O' -replace '[ÙÚÛÜ]','U' -replace '[Ç]','C'

# Atualiza o titulos.json
$titulosPath = "C:\Users\alves\OneDrive\Documentos\Claude Code\titulos.json"

if (Test-Path $titulosPath) {
    $titulos = Get-Content $titulosPath -Encoding UTF8 | ConvertFrom-Json
} else {
    $titulos = [PSCustomObject]@{}
}

# Adiciona ou atualiza o titulo para esse session_id
$titulos | Add-Member -MemberType NoteProperty -Name $sessionId -Value $tituloNorm -Force

$titulos | ConvertTo-Json | Set-Content $titulosPath -Encoding UTF8

Write-Host "Titulo salvo: $tituloNorm"
exit 0
