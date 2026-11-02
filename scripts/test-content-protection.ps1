# Self-test: confirm read-only protection blocks writes to original content.
$root = Join-Path (Split-Path $PSScriptRoot -Parent) 'original'
$target = Join-Path $root 'content\content-library.json'

$blocked = $false
try {
  Add-Content -Path $target -Value 'TAMPER' -ErrorAction Stop
}
catch {
  $blocked = $true
}

if ($blocked) {
  Write-Output 'PASS: write to original content blocked by read-only attribute.'
}
else {
  Write-Output 'FAIL: write succeeded - protection is NOT working.'
}
