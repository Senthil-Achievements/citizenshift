# Verifies content/original against SHA256SUMS.txt.
# Exit code 0 = all original content intact. Non-zero = modification detected.
$root = $PSScriptRoot
$manifestPath = Join-Path $root 'SHA256SUMS.txt'

if (-not (Test-Path $manifestPath)) {
  Write-Output 'FAIL: SHA256SUMS.txt missing.'
  exit 2
}

$entries = Get-Content $manifestPath | Where-Object { $_ -match '^[0-9a-f]{64}\s+' }
$failed = 0
$missing = 0

foreach ($line in $entries) {
  $parts = $line -split '\s+', 2
  $expected = $parts[0]
  $rel = $parts[1]
  $full = Join-Path $root ($rel -replace '/', '\')

  if (-not (Test-Path $full)) {
    Write-Output ("MISSING  {0}" -f $rel)
    $missing++
    continue
  }

  $actual = (Get-FileHash -Path $full -Algorithm SHA256).Hash.ToLower()
  if ($actual -ne $expected) {
    Write-Output ("MODIFIED {0}" -f $rel)
    $failed++
  } else {
    Write-Output ("OK       {0}" -f $rel)
  }
}

$total = $entries.Count
if ($failed -eq 0 -and $missing -eq 0) {
  Write-Output ("PASS: {0} original content files intact." -f $total)
  exit 0
}

Write-Output ("FAIL: {0} modified, {1} missing of {2}." -f $failed, $missing, $total)
exit 1
