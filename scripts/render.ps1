param([string]$Project,[Parameter(ValueFromRemainingArguments=$true)][string[]]$RenderArguments)
$ErrorActionPreference='Stop'
$taskRoot=Split-Path $PSScriptRoot -Parent
$taskNode=(Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $taskNode) {
  $taskConfig=Join-Path $taskRoot 'archive/local/runtime.json'
  if (Test-Path -LiteralPath $taskConfig) {$taskNode=(Get-Content -Raw -LiteralPath $taskConfig | ConvertFrom-Json).nodeExecutable}
}
if (-not $taskNode -or -not (Test-Path -LiteralPath $taskNode)) {throw 'Node.js not found. Install Node.js and add it to PATH.'}
if (-not $Project) {
  & $taskNode (Join-Path $taskRoot 'render.mjs') --list
  $Project=Read-Host 'Project id or number'
}
& $taskNode (Join-Path $taskRoot 'render.mjs') $Project @RenderArguments
exit $LASTEXITCODE
