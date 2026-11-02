# Confirms Git stores original-content bytes identical to the checksum manifest,
# i.e. no line-ending conversion will break SHA256SUMS.txt on checkout.
#
# Uses `git cat-file blob` with binary redirection so raw bytes are preserved.
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

$manifest = Join-Path $root 'content\original\SHA256SUMS.txt'
$entries = Get-Content $manifest | Where-Object { $_ -match '^[0-9a-f]{64}\s+' }

$checked = 0
$mismatch = 0

foreach ($line in $entries) {
  $parts = $line -split '\s+', 2
  $expected = $parts[0]
  $rel = $parts[1]

  $tmp = Join-Path $env:TEMP ('catfile-' + [Guid]::NewGuid().ToString('N') + '.bin')
  $spec = ':content/original/' + $rel

  # Binary redirection: cmd writes the blob bytes verbatim, no text mode.
  cmd /c "git cat-file blob $spec > `"$tmp`"" 2>$null
  if ($LASTEXITCODE -ne 0 -or -not (Test-Path $tmp)) {
    Write-Output "SKIP (not in index): $rel"
    continue
  }

  $actual = (Get-FileHash -Path $tmp -Algorithm SHA256).Hash.ToLower()
  Remove-Item $tmp -Force

  $checked++
  if ($actual -ne $expected) {
    Write-Output "MISMATCH: $rel"
    $mismatch++
  }
  else {
    Write-Output "IDENTICAL: $rel"
  }
}

Write-Output ("checked {0} entries, {1} mismatched" -f $checked, $mismatch)
if ($mismatch -eq 0 -and $checked -gt 0) {
  Write-Output 'PASS: Git stores original content byte-identical to the manifest.'
  exit 0
}
Write-Output 'FAIL: line-ending conversion would break integrity.'
exit 1
