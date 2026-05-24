#!/usr/bin/env bash
# KoalaSnippets CLI - Manage snippets from the terminal
# Usage: ./koala.sh <command> [arg]
# Requires KOALA_TOKEN (API key) and optionally KOALA_SERVER

set -euo pipefail

SERVER="${KOALA_SERVER:-http://localhost:3000}"
SERVER="${SERVER%/}"

if [ -z "${KOALA_TOKEN:-}" ]; then
  echo "Error: KOALA_TOKEN not set. Generate an API key in Settings > API Keys." >&2
  exit 1
fi

api_call() {
  local method="$1" path="$2" body="$3"
  local curl_args=(-s -X "$method" "$SERVER$path" -H "Authorization: Bearer $KOALA_TOKEN" -H "Content-Type: application/json")
  if [ -n "$body" ]; then
    curl_args+=(-d "$body")
  fi
  curl "${curl_args[@]}"
}

detect_lang() {
  local ext="${1##*.}"
  case "${ext,,}" in
    ts|tsx) echo "typescript" ;; js|jsx) echo "javascript" ;; py) echo "python" ;;
    rb) echo "ruby" ;; rs) echo "rust" ;; go) echo "go" ;; java) echo "java" ;;
    php) echo "php" ;; sql) echo "sql" ;; html) echo "html" ;; css) echo "css" ;;
    json) echo "json" ;; yaml|yml) echo "yaml" ;; xml) echo "xml" ;;
    md) echo "markdown" ;; sh|bash|zsh) echo "shell" ;; ps1) echo "powershell" ;;
    *) echo "plaintext" ;;
  esac
}

cmd_list() {
  local path="/api/snippets"
  if [ -n "${TAGS:-}" ]; then
    local encoded_tags
    encoded_tags=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$TAGS'))")
    path="$path?tags=$encoded_tags"
  fi
  api_call GET "$path" "" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for s in data.get('snippets', []):
    print(f\"{s['id'][:8]}..  {s['title']:<30} {s.get('language',''):<12} {s['visibility']}\")
if data.get('hasMore'):
    print('... more results available')
"
}

cmd_push() {
  local file="$1"
  [ -f "$file" ] || { echo "Error: File not found: $file" >&2; exit 1; }
  local name="$(basename "$file")"
  local content="$(cat "$file")"
  local lang="$(detect_lang "$name")"
  local body
  body=$(python3 -c "
import json, sys
print(json.dumps({
    'title': '$name',
    'visibility': 'PRIVATE',
    'files': [{'filename': '$name', 'code': sys.stdin.read(), 'language': '$lang'}]
}))
" <<< "$content")
  result=$(api_call POST "/api/snippets" "$body")
  local id=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))")
  echo "Snippet pushed: $id"
  echo "URL: $SERVER/snippets/$id"
}

cmd_pull() {
  local id="$1"
  api_call GET "/api/snippets/$id" "" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for f in data.get('files', []):
    print(f'--- {f[\"filename\"]} ({f[\"language\"]}) ---')
    print(f['code'])
"
}

cmd_search() {
  local query="$1"
  local encoded_query
  encoded_query=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$query'))")
  api_call GET "/api/snippets?q=$encoded_query&includeCode=true" "" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f\"Found {len(data.get('snippets',[]))} results for '$query':\")
for s in data.get('snippets', []):
    print(f\"{s['id'][:8]}..  {s['title']:<30} {s.get('language',''):<12}\")
"
}

cmd_new() {
  local title="$1" file="$2"
  [ -n "$title" ] || { echo "Error: Usage: new <title> --file <path>" >&2; exit 1; }
  [ -n "$file" ] || { echo "Error: Usage: new <title> --file <path>" >&2; exit 1; }
  [ -f "$file" ] || { echo "Error: File not found: $file" >&2; exit 1; }
  local name="$(basename "$file")"
  local content="$(cat "$file")"
  local lang="$(detect_lang "$name")"
  local body
  body=$(python3 -c "
import json, sys
print(json.dumps({
    'title': sys.argv[1],
    'visibility': 'PRIVATE',
    'files': [{'filename': sys.argv[2], 'code': sys.stdin.read(), 'language': sys.argv[3]}]
}))
" "$title" "$name" "$lang" <<< "$content")
  result=$(api_call POST "/api/snippets" "$body")
  local id=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))")
  echo "Snippet created: $id"
  echo "URL: $SERVER/snippets/$id"
}

cmd_export() {
  local id="$1"
  [ -n "$id" ] || { echo "Error: Usage: export <snippet-id>" >&2; exit 1; }
  api_call GET "/api/snippets/$id" "" | python3 -c "
import sys, json, re, os
data = json.load(sys.stdin)
ext_map = {'typescript':'ts','javascript':'js','python':'py','ruby':'rb','rust':'rs','go':'go','java':'java','php':'php','sql':'sql','html':'html','css':'css','json':'json','yaml':'yaml','xml':'xml','markdown':'md','shell':'sh','powershell':'ps1','plaintext':'txt'}
title = re.sub(r'[^a-zA-Z0-9_-]', '_', data['title']).lower()
for f in data.get('files', []):
    ext = ext_map.get(f['language'], f['language'])
    fname = f['filename'] if len(data.get('files',[])) > 1 else f'{title}.{ext}'
    with open(fname, 'w', encoding='utf-8') as out:
        out.write(f['code'])
    print(f'Exported: {fname}')
"
}

case "${1:-}" in
  list) cmd_list "${2:-}" ;;
  push) cmd_push "${2:-}" ;;
  pull) cmd_pull "${2:-}" ;;
  search) cmd_search "${2:-}" ;;
  new) cmd_new "${2:-}" "${4:-}" ;;
  export) cmd_export "${2:-}" ;;
  *)
    echo "KoalaSnippets CLI"
    echo "  Usage: ./koala.sh <command> [arg]"
    echo ""
    echo "Commands:"
    echo "  list [--tags X]   List your snippets (optionally filter by tags)"
    echo "  push <file>       Push a file as a new snippet"
    echo "  pull <id>         Pull a snippet by ID"
    echo "  search <query>    Search snippets"
    echo "  new <title>       Create snippet with --file <path>"
    echo "  export <id>       Export snippet code to file(s)"
    echo ""
    echo "Environment:"
    echo "  KOALA_SERVER      Server URL (default: http://localhost:3000)"
    echo "  KOALA_TOKEN       API key from Settings > API Keys"
    ;;
esac
