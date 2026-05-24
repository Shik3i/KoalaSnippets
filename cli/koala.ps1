<#
.SYNOPSIS
  KoalaSnippets CLI - Manage snippets from PowerShell
.DESCRIPTION
  Push, pull, search, and list snippets from your KoalaSnippets server.
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
#>

param(
  [ValidateSet("list", "push", "pull", "search")]
  [string]$Command,

  [string]$Arg1,

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
    $result = Invoke-Api "/api/snippets"
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
  default {
    Write-Host "KoalaSnippets CLI"
    Write-Host "  Usage: .\koala.ps1 <command> [arg]"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  list              List your snippets"
    Write-Host "  push <file>       Push a file as a new snippet"
    Write-Host "  pull <id>         Pull a snippet by ID"
    Write-Host "  search <query>    Search snippets"
    Write-Host ""
    Write-Host "Environment:"
    Write-Host "  KOALA_SERVER      Server URL (default: http://localhost:3000)"
    Write-Host "  KOALA_TOKEN       API key from Settings > API Keys"
  }
}
