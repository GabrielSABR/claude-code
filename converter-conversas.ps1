# Converte arquivos .jsonl de conversas do Claude para .md legivel
# Salva apenas conversas novas ou que foram atualizadas

$projectPaths = @(
    "C:\Users\alves\.claude\projects\C--Users-alves-OneDrive-Documentos",
    "C:\Users\alves\.claude\projects\C--Users-alves-OneDrive-Documentos-Claude-Code"
)

$today = Get-Date -Format "yyyy-MM-dd"
$outputDir = "C:\Users\alves\OneDrive\Documentos\Claude Code\conversas\$today"
if (-not (Test-Path $outputDir)) { New-Item -ItemType Directory -Path $outputDir | Out-Null }

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
                if ($content -is [string]) {
                    $text = $content
                } elseif ($content -is [array]) {
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

        # Gera nome do arquivo
        $topicRaw = $firstUserMessage -replace '[^\w\s]', '' -replace '\s+', '-'
        $topic = $topicRaw.ToLower().Substring(0, [Math]::Min(50, $topicRaw.Length)).TrimEnd('-')
        $outputFile = Join-Path $outputDir "$topic.md"

        # Verifica se ja existe e se o .jsonl foi modificado depois do .md
        if (Test-Path $outputFile) {
            $jsonlModified = $file.LastWriteTime
            $mdModified = (Get-Item $outputFile).LastWriteTime

            if ($jsonlModified -le $mdModified) {
                $ignorados++
                continue
            }
        }

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
        Write-Host "Salvo: $(Split-Path $outputFile -Leaf)"
        $novos++
    }
}

Write-Host ""
if ($novos -eq 0) {
    Write-Host "Nenhuma conversa nova ou atualizada."
} else {
    Write-Host "$novos conversa(s) salva(s). $ignorados ignorada(s) por nao terem mudancas."
}
