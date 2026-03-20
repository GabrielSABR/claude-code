# salvar-titulo.ps1
try {
    $stdin = $input | Out-String
    $json = $stdin | ConvertFrom-Json
    $sessionId = $json.session_id
} catch {
    exit 0
}

if (-not $sessionId) { exit 0 }

$claudeProjects = "C:\Users\alves\.claude\projects"
$jsonlFile = Get-ChildItem -Path $claudeProjects -Recurse -Filter "$sessionId.jsonl" -ErrorAction SilentlyContinue | Select-Object -First 1

if (-not $jsonlFile) { exit 0 }

$titulo = $null
Get-Content $jsonlFile.FullName -Encoding UTF8 | ForEach-Object {
    try {
        $obj = $_ | ConvertFrom-Json
        $content = ""
        if ($obj.message.role -eq "user") {
            if ($obj.message.content -is [string]) {
                $content = $obj.message.content.Trim()
            } elseif ($obj.message.content -is [array]) {
                $content = ($obj.message.content | Where-Object { $_.type -eq "text" } | Select-Object -ExpandProperty text) -join " "
                $content = $content.Trim()
            }
            if ($content -match "^Salva o t.tulo como:\s*(.+)") {
                $titulo = $Matches[1].Trim()
            }
        }
    } catch {}
}

if (-not $titulo) { exit 0 }

$titulosPath = "C:\Users\alves\OneDrive\Documentos\Claude Code\titulos.json"

if (Test-Path $titulosPath) {
    $titulos = Get-Content $titulosPath -Encoding UTF8 | ConvertFrom-Json
} else {
    $titulos = [PSCustomObject]@{}
}

$titulos | Add-Member -MemberType NoteProperty -Name $sessionId -Value $titulo -Force
$titulos | ConvertTo-Json | Set-Content $titulosPath -Encoding UTF8
Write-Host "Titulo salvo: $titulo"
exit 0