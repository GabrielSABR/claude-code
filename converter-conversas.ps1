# Converte arquivos .jsonl de conversas do Claude para .md legivel
# Salva apenas conversas novas ou que foram atualizadas

$projectPaths = @(
    "C:\Users\alves\.claude\projects\C--Users-alves-OneDrive-Documentos",
    "C:\Users\alves\.claude\projects\C--Users-alves-OneDrive-Documentos-Claude-Code"
)

$today = Get-Date -Format "yyyy-MM-dd"
$baseDir = "C:\Users\alves\OneDrive\Documentos\Claude Code\conversas"
$outputDir = $baseDir + "\" + $today
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

        # Remove acentos para o nome do arquivo
        $normalized = $firstUserMessage.Normalize([System.Text.NormalizationForm]::FormD)
        $topicClean = -join ($normalized.ToCharArray() | Where-Object { [System.Globalization.CharUnicodeInfo]::GetUnicodeCategory($_) -ne [System.Globalization.UnicodeCategory]::NonSpacingMark })
        $topicRaw = $topicClean -replace "[^\w\s]", "" -replace "\s+", "-"
        $topic = $topicRaw.ToLower().Substring(0, [Math]::Min(50, $topicRaw.Length)).TrimEnd("-")
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
