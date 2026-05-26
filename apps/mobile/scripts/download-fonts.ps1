# Downloads the four font files this app needs into assets/fonts/.
# Run from repo root: pwsh apps/mobile/scripts/download-fonts.ps1

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$ErrorActionPreference = 'Stop'
$dst = Join-Path $PSScriptRoot '..\assets\fonts'
$dst = (Resolve-Path $dst).Path

$fonts = @(
  @{ url = 'https://raw.githubusercontent.com/aliftype/amiri/master/fonts/ttf/Amiri-Regular.ttf'; out = 'Amiri-Regular.ttf' },
  @{ url = 'https://raw.githubusercontent.com/aliftype/amiri/master/fonts/ttf/Amiri-Bold.ttf';    out = 'Amiri-Bold.ttf' },
  @{ url = 'https://raw.githubusercontent.com/rsms/inter/master/docs/font-files/Inter-Regular.ttf';   out = 'Inter-Regular.ttf' },
  @{ url = 'https://raw.githubusercontent.com/rsms/inter/master/docs/font-files/Inter-SemiBold.ttf';  out = 'Inter-SemiBold.ttf' }
)

foreach ($f in $fonts) {
  $path = Join-Path $dst $f.out
  Write-Host "Downloading $($f.out)..."
  try {
    Invoke-WebRequest -Uri $f.url -OutFile $path -UseBasicParsing -TimeoutSec 60
    $size = (Get-Item $path).Length
    Write-Host "  OK ($size bytes)"
  } catch {
    Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Try downloading manually from the source URL." -ForegroundColor Yellow
  }
}

Write-Host ""
Write-Host "Now run: cd apps/mobile; npx react-native-asset"
