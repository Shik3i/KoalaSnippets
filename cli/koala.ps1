<#
.SYNOPSIS
  KoalaSnippets CLI - Manage snippets from PowerShell
.DESCRIPTION
  Push, pull, search, list, and export snippets from your KoalaSnippets server.
  Requires an API key generated in Settings > API Keys.
.PARAMETER Server
  Your KoalaSnippets server URL (default: $env:KOALA_SERVER or http://localhost:3000)
.PARAMETER Token
  Your API key (default: $env:KOALA_TOKEN)
.EXAMPLE
  .\koala.ps1 list
  .\koala.ps1 push .\script.ps1
  .\koala.ps1 pull abc123
  .\koala.ps1 search "database"
  .\koala.ps1 list --tags python
  .\koala.ps1 new "My Snippet" --file .\code.py
  .\koala.ps1 export abc123
#>

param(
  [ValidateSet("list", "push", "pull", "search", "new", "export")]
  [string]$Command,

  [string]$Arg1,

  [string]$Tags,
  [string]$File,

  [string]$Server = $env:KOALA_SERVER,
  [string]$Token = $env:KOALA_TOKEN
)

if (-not $Server) { $Server = "http://localhost:3000" }
if (-not $Token) { Write-Error "KOALA_TOKEN not set. Generate an API key in Settings > API Keys."; exit 1 }

$Server = $Server.TrimEnd('/')
$Headers = @{ "Authorization" = "Bearer $Token"; "Content-Type" = "application/json" }

function Invoke-Api {
  param([string]$Path, [string]$Method = "GET", $Body)
  $uri = "$Server$Path"
  $params = @{ Uri = $uri; Method = $Method; Headers = $Headers }
  if ($Body) { $params.Body = ($Body | ConvertTo-Json -Depth 10) }
  try {
    $response = Invoke-RestMethod @params
    return $response
  } catch {
    Write-Error "API Error: $_"
    exit 1
  }
}

switch ($Command) {
  "list" {
    $path = "/api/snippets"
    if ($Tags) { $path += "?tags=$([uri]::EscapeDataString($Tags))" }
    $result = Invoke-Api $path
    $result.snippets | ForEach-Object {
      "$($_.id.Substring(0,8))..  $($_.title.PadRight(30)) $($_.language.PadRight(12)) $($_.visibility)"
    }
    if ($result.hasMore) { Write-Host "... more results available" }
  }
  "push" {
    if (-not $Arg1) { Write-Error "Usage: push <file>"; exit 1 }
    $filePath = Resolve-Path $Arg1
    $content = Get-Content -Raw $filePath
    $name = Split-Path $filePath -Leaf
    $ext = $name.Split('.')[-1].ToLower()
    $langMap = @{ ts="typescript"; tsx="typescript"; js="javascript"; jsx="javascript"; py="python"; rb="ruby"; rs="rust"; go="go"; java="java"; php="php"; sql="sql"; html="html"; css="css"; json="json"; yaml="yaml"; yml="yaml"; xml="xml"; md="markdown"; sh="shell"; ps1="powershell"; txt="plaintext" }
    $lang = if ($langMap.ContainsKey($ext)) { $langMap[$ext] } else { "plaintext" }
    $body = @{
      title = $name
      visibility = "PRIVATE"
      files = @(@{ filename = $name; code = $content; language = $lang })
    }
    $result = Invoke-Api "/api/snippets" -Method "POST" -Body $body
    Write-Host "Snippet pushed: $($result.id)"
    Write-Host "URL: $Server/snippets/$($result.id)"
  }
  "pull" {
    if (-not $Arg1) { Write-Error "Usage: pull <snippet-id>"; exit 1 }
    $result = Invoke-Api "/api/snippets/$Arg1"
    foreach ($file in $result.files) {
      Write-Host "--- $($file.filename) ($($file.language)) ---"
      Write-Host $file.code
    }
  }
  "search" {
    if (-not $Arg1) { Write-Error "Usage: search <query>"; exit 1 }
    $result = Invoke-Api "/api/snippets?q=$([uri]::EscapeDataString($Arg1))&includeCode=true"
    Write-Host "Found $($result.snippets.Count) results for '$Arg1':"
    $result.snippets | ForEach-Object {
      "$($_.id.Substring(0,8))..  $($_.title.PadRight(30)) $($_.language.PadRight(12))"
    }
  }
  "new" {
    if (-not $Arg1) { Write-Error "Usage: new <title> --file <path>"; exit 1 }
    if (-not $File) { Write-Error "Usage: new <title> --file <path>"; exit 1 }
    $filePath = Resolve-Path $File
    $content = Get-Content -Raw $filePath
    $name = Split-Path $filePath -Leaf
    $ext = $name.Split('.')[-1].ToLower()
    $langMap = @{ ts="typescript"; tsx="typescript"; js="javascript"; jsx="javascript"; py="python"; rb="ruby"; rs="rust"; go="go"; java="java"; php="php"; sql="sql"; html="html"; css="css"; json="json"; yaml="yaml"; yml="yaml"; xml="xml"; md="markdown"; sh="shell"; ps1="powershell"; txt="plaintext" }
    $lang = if ($langMap.ContainsKey($ext)) { $langMap[$ext] } else { "plaintext" }
    $body = @{
      title = $Arg1
      visibility = "PRIVATE"
      files = @(@{ filename = $name; code = $content; language = $lang })
    }
    $result = Invoke-Api "/api/snippets" -Method "POST" -Body $body
    Write-Host "Snippet created: $($result.id)"
    Write-Host "URL: $Server/snippets/$($result.id)"
  }
  "export" {
    if (-not $Arg1) { Write-Error "Usage: export <snippet-id>"; exit 1 }
    $result = Invoke-Api "/api/snippets/$Arg1"
    foreach ($file in $result.files) {
      $sanitizedTitle = ($result.title -replace '[^a-zA-Z0-9_-]', '_').ToLower()
      $extMap = @{ typescript="ts"; javascript="js"; python="py"; ruby="rb"; rust="rs"; go="go"; java="java"; php="php"; sql="sql"; html="html"; css="css"; json="json"; yaml="yaml"; xml="xml"; markdown="md"; shell="sh"; powershell="ps1"; plaintext="txt" }
      $ext = if ($extMap.ContainsKey($file.language)) { $extMap[$file.language] } else { $file.language }
      $outFile = "${sanitizedTitle}.${ext}"
      $file.code | Out-File -FilePath $outFile -Encoding utf8
      Write-Host "Exported: $outFile"
    }
  }
  default {
    Write-Host "KoalaSnippets CLI"
    Write-Host "  Usage: .\koala.ps1 <command> [arg]"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  list [--tags X]   List your snippets (optionally filter by tags)"
    Write-Host "  push <file>       Push a file as a new snippet"
    Write-Host "  pull <id>         Pull a snippet by ID"
    Write-Host "  search <query>    Search snippets"
    Write-Host "  new <title>       Create snippet with --file <path>"
    Write-Host "  export <id>       Export snippet code to file(s)"
    Write-Host ""
    Write-Host "Environment:"
    Write-Host "  KOALA_SERVER      Server URL (default: http://localhost:3000)"
    Write-Host "  KOALA_TOKEN       API key from Settings > API Keys"
  }
}
