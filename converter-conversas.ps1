param()
$projectPaths = @(
    "C:\Users\alves\.claude\projects\C--Users-alves-OneDrive-Documentos",
    "C:\Users\alves\.claude\projects\C--Users-alves-OneDrive-Documentos-Claude-Code"
)

$today = Get-Date -Format "yyyy-MM-dd"
$baseDir = "C:\Users\alves\OneDrive\Documentos\Claude Code\conversas"
$outputDir = $baseDir + "\" + $today
if (-not (Test-Path $outputDir)) { New-Item -ItemType Directory -Path $outputDir | Out-Null }

# Carrega mapeamento permanente de titulos
$titulosFile = "C:\Users\alves\OneDrive\Documentos\Claude Code\titulos.json"
$titulos = @{}
if (Test-Path $titulosFile) {
    $titulos = Get-Content $titulosFile -Encoding UTF8 | ConvertFrom-Json
}

# Carrega titulo avulso (.titulo) para adicionar ao mapeamento
$tituloAvulsoFile = "C:\Users\alves\OneDrive\Documentos\Claude Code\.titulo"
if (Test-Path $tituloAvulsoFile) {
    try {
        $t = Get-Content $tituloAvulsoFile -Encoding UTF8 | ConvertFrom-Json
        if ($t.sessionId -and $t.titulo) {
            $titulos | Add-Member -NotePropertyName $t.sessionId -NotePropertyValue $t.titulo -Force
            $titulos | ConvertTo-Json | Out-File -FilePath $titulosFile -Encoding UTF8
        }
    } catch {}
    Remove-Item $tituloAvulsoFile -Force
}

$stopWords = @("o","a","os","as","um","uma","que","de","da","do","dos","das","em","para","com","por",
    "nao","eu","me","voce","como","isso","esse","esta","este","ser","ter","mas","se","na",
    "no","nas","nos","foi","vai","ao","e","ou","ja","ate","mais","meu","minha","seus","suas",
    "tem","sao","aqui","la","aquilo","quando","onde","quem","qual","quais","fazer","feito",
    "faz","pode","quero","preciso","sempre","nunca","tudo","nada","muito","pouco","agora",
    "depois","antes","ainda","sim","bem","entao","tambem","so","cada","outro","outra",
    "mesmo","mesma","todo","toda","todos","todas","sobre","esse","essa","esses","essas",
    "the","and","for","with","from","that","this","have","will","are","were","been",
    "has","had","not","but","what","which","when","where","who","all","would","could",
    "should","their","there","they","them","than","then","into","also","just","any",
    "your","our","get","got","can","use","new","one","two","way","may","out","up",
    "do","did","so","if","he","she","we","it","is","in","on","at","to","of","an","be","by","as","or","no","my")

function Get-TopicName {
    param($messages)
    $allText = ($messages | ForEach-Object { $_.Text }) -join " "
    $normalized = $allText.Normalize([System.Text.NormalizationForm]::FormD)
    $clean = -join ($normalized.ToCharArray() | Where-Object {
        [System.Globalization.CharUnicodeInfo]::GetUnicodeCategory($_) -ne [System.Globalization.UnicodeCategory]::NonSpacingMark
    })
    $clean = $clean -replace "https?://\S+", " "
    $clean = $clean.ToLower() -replace "[^a-z0-9\s]", " " -replace "[0-9]+", " " -replace "\s+", " "
    $wordCount = @{}
    foreach ($word in $clean.Trim().Split(" ")) {
        if ($word.Length -gt 3 -and $stopWords -notcontains $word) {
            if ($wordCount.ContainsKey($word)) { $wordCount[$word]++ }
            else { $wordCount[$word] = 1 }
        }
    }
    $topWords = $wordCount.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 5 | ForEach-Object { $_.Key }
    $slug = $topWords -join "-"
    if ($slug.Length -gt 60) { $slug = $slug.Substring(0, 60).TrimEnd("-") }
    return $slug
}

$novos = 0
$ignorados = 0

foreach ($projectPath in $projectPaths) {
    if (-not (Test-Path $projectPath)) { continue }
    $jsonlFiles = Get-ChildItem -Path $projectPath -Filter "*.jsonl" | Sort-Object LastWriteTime -Descending
    foreach ($file in $jsonlFiles) {
        $sessionId = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
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
                    foreach ($block in $content) { if ($block.type -eq "text") { $text += $block.text } }
                }
                if ([string]::IsNullOrWhiteSpace($text)) { continue }
                if ($role -eq "user" -and $firstUserMessage -eq "") { $firstUserMessage = $text }
                $messages += [PSCustomObject]@{ Role = $role; Text = $text; Timestamp = $timestamp }
            } catch { continue }
        }
        if ($messages.Count -eq 0) { continue }

        # Usa titulo do mapeamento se existir, senao gera automatico
        if ($titulos.$sessionId) {
            $slug = $titulos.$sessionId.ToLower() -replace "[^a-z0-9\s]", "" -replace "\s+", "-"
        } else {
            $slug = Get-TopicName $messages
        }
        if ([string]::IsNullOrWhiteSpace($slug)) { $slug = "conversa-" + $sessionId.Substring(0,8) }

        $existingFile = Get-ChildItem -Path $baseDir -Recurse -Filter ($slug + ".md") -File -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($existingFile) {
            if ($file.LastWriteTime -le $existingFile.LastWriteTime) { $ignorados++; continue }
            Remove-Item -Path $existingFile.FullName -Force
        }

        $outputFile = $outputDir + "\" + $slug + ".md"
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
        Write-Host ("Salvo: " + $slug + ".md")
        $novos++
    }
}

Write-Host ""
if ($novos -eq 0) { Write-Host "Nenhuma conversa nova ou atualizada." }
else { Write-Host ($novos.ToString() + " conversa(s) salva(s). " + $ignorados.ToString() + " ignorada(s).") }
