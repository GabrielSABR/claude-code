# Converte arquivos .jsonl de conversas do Claude para .md legivel

$projectPaths = @(
    "C:\Users\alves\.claude\projects\C--Users-alves-OneDrive-Documentos",
    "C:\Users\alves\.claude\projects\C--Users-alves-OneDrive-Documentos-Claude-Code"
)

$outputDir = "C:\Users\alves\OneDrive\Documentos\Claude Code\conversas"
if (-not (Test-Path $outputDir)) { New-Item -ItemType Directory -Path $outputDir | Out-Null }

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

                # Extrai texto do conteudo (pode ser string ou array)
                $text = ""
                if ($content -is [string]) {
                    $text = $content
                } elseif ($content -is [array]) {
                    foreach ($block in $content) {
                        if ($block.type -eq "text") {
                            $text += $block.text
                        }
                    }
                }

                if ([string]::IsNullOrWhiteSpace($text)) { continue }

                if ($role -eq "user" -and $firstUserMessage -eq "") {
                    $firstUserMessage = $text
                }

                $messages += [PSCustomObject]@{ Role = $role; Text = $text; Timestamp = $timestamp }
            } catch { continue }
        }

        if ($messages.Count -eq 0) { continue }

        # Gera nome do arquivo baseado na primeira mensagem do usuario
        $topicRaw = $firstUserMessage -replace '[^\w\s]', '' -replace '\s+', '-'
        $topic = $topicRaw.ToLower().Substring(0, [Math]::Min(50, $topicRaw.Length)).TrimEnd('-')
        $outputFile = Join-Path $outputDir "$topic.md"

        # Pega data da primeira mensagem
        $date = ""
        if ($messages[0].Timestamp) {
            $date = ([DateTime]$messages[0].Timestamp).ToString("dd/MM/yyyy")
        }

        # Monta o markdown
        $md = "# Conversa — $firstUserMessage`n"
        $md += "> Data: $date`n"
        $md += "---`n"

        foreach ($msg in $messages) {
            if ($msg.Role -eq "user") {
                $md += "`n## 👤 Gabriel`n"
                $md += """$($msg.Text)""`n"
            } else {
                $md += "`n## 🤖 Claude`n"
                $md += "$($msg.Text)`n"
            }
            $md += "---`n"
        }

        $md | Out-File -FilePath $outputFile -Encoding UTF8
        Write-Host "Salvo: $outputFile"
    }
}

Write-Host ""
Write-Host "Conversas convertidas com sucesso!"
