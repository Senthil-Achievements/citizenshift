# Generates SHA256SUMS.txt for content/original. Run once after restoring files.
$root = $PSScriptRoot
$files = Get-ChildItem $root -Recurse -File |
  Where-Object { $_.Name -ne 'SHA256SUMS.txt' -and $_.Name -ne 'make-manifest.ps1' -and $_.Name -ne 'verify.ps1' } |
  Sort-Object FullName

$lines = @()
foreach ($f in $files) {
  $rel = $f.FullName.Substring($root.Length + 1).Replace('\', '/')
  $hash = (Get-FileHash -Path $f.FullName -Algorithm SHA256).Hash.ToLower()
  $lines += "$hash  $rel"
}

$header = @(
  '# CitizenShift original content - SHA-256 checksum manifest'
  '# Generated: 2026-11-02'
  '# Verify with: powershell -ExecutionPolicy Bypass -File content/original/verify.ps1'
  '# Any changed hash means original content was modified.'
  '# Restore from citizenshift_research_pack.zip if so.'
  ''
)

$body = ($header + $lines) -join "`n"
[System.IO.File]::WriteAllText((Join-Path $root 'SHA256SUMS.txt'), $body + "`n", (New-Object System.Text.UTF8Encoding($false)))
Write-Output ("Wrote SHA256SUMS.txt with {0} entries." -f $lines.Count)
