# Converte arquivos .jsonl de conversas do Claude para .md legivel
# Salva apenas conversas novas ou que foram atualizadas
# Nome do arquivo baseado no tema geral da conversa

$projectPaths = @(
    "C:\Users\alves\.claude\projects\C--Users-alves-OneDrive-Documentos",
    "C:\Users\alves\.claude\projects\C--Users-alves-OneDrive-Documentos-Claude-Code"
)

$today = Get-Date -Format "yyyy-MM-dd"
$baseDir = "C:\Users\alves\OneDrive\Documentos\Claude Code\conversas"
$outputDir = $baseDir + "\" + $today
if (-not (Test-Path $outputDir)) { New-Item -ItemType Directory -Path $outputDir | Out-Null }

# Palavras irrelevantes para ignorar no nome
$stopWords = @("o","a","os","as","um","uma","que","de","da","do","dos","das","em","para","com",
               "por","nao","eu","me","voce","como","isso","esse","esta","este","ser","ter","mas",
               "se","na","no","nas","nos","foi","vai","ao","as","e","ou","ja","ate","mais","meu",
               "minha","seus","suas","tem","sao","esta","aqui","la","isso","aquilo","quando",
               "onde","quem","qual","quais","fazer","feito","faz","pode","quero","preciso",
               "sempre","nunca","tudo","nada","muito","pouco","agora","depois","antes","ainda")

function Get-TopicName($messages) {
    # Pega texto das primeiras 5 mensagens do usuario
    $userMessages = $messages | Where-Object { $_.Role -eq "user" } | Select-Object -First 5
    $combined = ($userMessages | ForEach-Object { $_.Text }) -join " "

    # Remove acentos
    $normalized = $combined.Normalize([System.Text.NormalizationForm]::FormD)
    $clean = -join ($normalized.ToCharArray() | Where-Object {
        [System.Globalization.CharUnicodeInfo]::GetUnicodeCategory($_) -ne [System.Globalization.UnicodeCategory]::NonSpacingMark
    })

    # Limpa caracteres especiais e converte para minusculo
    $clean = $clean.ToLower() -replace "[^\w\s]", " " -replace "\s+", " "

    # Filtra palavras relevantes
    $words = $clean.Split(" ") | Where-Object {
        $_.Length -gt 3 -and $stopWords -notcontains $_
    }

    # Pega as 5 palavras mais relevantes (sem repeticao)
    $unique = $words | Select-Object -Unique | Select-Object -First 5

    $slug = $unique -join "-"
    if ($slug.Length -gt 60) { $slug = $slug.Substring(0, 60).TrimEnd("-") }

    return $slug
}

$novos = 0
$ignorados = 0

foreach ($projectPath in $projectPaths) {
    if (-not (Test-Path $projectPath)) { continue }
    $jsonlFiles = Get-ChildItem -Path $projectPath -Filter "*.jsonl"

    foreach ($file in $jsonlFiles) {
        $lines = Get-Content $file.FullName -Encoding UTF8
        $messages = @()
        $firstUserMessage = ""

        foreach ($line in $lines) {
            try {
                $obj = $line | ConvertFrom-Json
                if ($obj.type -ne "user" -and $obj.message.role -ne "assistant") { continue }
                $role = $obj.message.role
                $content = $obj.message.content
                $timestamp = $obj.timestamp
                $text = ""
                if ($content -is [string]) { $text = $content }
                elseif ($content -is [array]) {
                    foreach ($block in $content) {
                        if ($block.type -eq "text") { $text += $block.text }
                    }
                }
                if ([string]::IsNullOrWhiteSpace($text)) { continue }
                if ($role -eq "user" -and $firstUserMessage -eq "") { $firstUserMessage = $text }
                $messages += [PSCustomObject]@{ Role = $role; Text = $text; Timestamp = $timestamp }
            } catch { continue }
        }

        if ($messages.Count -eq 0) { continue }

        # Gera nome baseado no tema da conversa
        $topic = Get-TopicName $messages
        if ([string]::IsNullOrWhiteSpace($topic)) {
            $topic = "conversa-" + $file.BaseName.Substring(0, 8)
        }
        $outputFile = $outputDir + "\" + $topic + ".md"

        if (Test-Path $outputFile) {
            if ($file.LastWriteTime -le (Get-Item $outputFile).LastWriteTime) {
                $ignorados++
                continue
            }
        }

        $date = ""
        if ($messages[0].Timestamp) { $date = ([DateTime]$messages[0].Timestamp).ToString("dd/MM/yyyy") }

        $md = [System.Text.StringBuilder]::new()
        [void]$md.AppendLine("# Conversa - " + $firstUserMessage)
        [void]$md.AppendLine("> Data: " + $date)
        [void]$md.AppendLine("---")

        foreach ($msg in $messages) {
            if ($msg.Role -eq "user") {
                [void]$md.AppendLine("")
                [void]$md.AppendLine("## Gabriel")
                [void]$md.AppendLine("""" + $msg.Text + """")
            } else {
                [void]$md.AppendLine("")
                [void]$md.AppendLine("## Claude")
                [void]$md.AppendLine($msg.Text)
            }
            [void]$md.AppendLine("---")
        }

        [System.IO.File]::WriteAllText($outputFile, $md.ToString(), [System.Text.Encoding]::UTF8)
        Write-Host ("Salvo: " + (Split-Path $outputFile -Leaf))
        $novos++
    }
}

Write-Host ""
if ($novos -eq 0) { Write-Host "Nenhuma conversa nova ou atualizada." }
else { Write-Host ($novos.ToString() + " conversa(s) salva(s). " + $ignorados.ToString() + " ignorada(s).") }
