# NestDirect Localhost + USB Reverse Tunnel Development Automation Script
# =========================================================================

$ErrorActionPreference = "Continue"

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " 🏠 NestDirect Localhost + USB Development Setup " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Node & npm Checks
Write-Host "[1/4] Checking Node environment..." -ForegroundColor Yellow
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVer = node --version
    Write-Host "  ✅ Node.js: $nodeVer" -ForegroundColor Green
} else {
    Write-Host "  ⚠️ Node.js not found in PATH! Please install Node.js (>= 18)." -ForegroundColor Red
}

if (Get-Command npm -ErrorAction SilentlyContinue) {
    $npmVer = npm --version
    Write-Host "  ✅ npm: $npmVer" -ForegroundColor Green
} else {
    Write-Host "  ⚠️ npm not found in PATH!" -ForegroundColor Red
}

# 2. Locate ADB executable
Write-Host "`n[2/4] Locating Android ADB bridge..." -ForegroundColor Yellow
$adbPath = "adb"

if (-not (Get-Command adb -ErrorAction SilentlyContinue)) {
    $defaultAdb = Join-Path $env:LOCALAPPDATA "Android\Sdk\platform-tools\adb.exe"
    if (Test-Path $defaultAdb) {
        $adbPath = $defaultAdb
        Write-Host "  ✅ Found ADB at: $adbPath" -ForegroundColor Green
    } else {
        Write-Host "  ❌ ADB not found in PATH or standard Android SDK path." -ForegroundColor Red
        Write-Host "     Please ensure Android Studio / SDK Platform-Tools are installed." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  ✅ ADB available in PATH." -ForegroundColor Green
}

# 3. USB Device Check
Write-Host "`n[3/4] Checking USB Connected Android Devices..." -ForegroundColor Yellow
$devicesOutput = & $adbPath devices
Write-Host $devicesOutput

if ($devicesOutput -match "unauthorized") {
    Write-Host "  ⚠️ DEVICE UNAUTHORIZED!" -ForegroundColor Red
    Write-Host "     Please unlock your phone and tap 'Allow USB debugging' on the pop-up prompt." -ForegroundColor Red
} elseif ($devicesOutput -match "\tdevice") {
    Write-Host "  ✅ USB Android device connected and authorized!" -ForegroundColor Green
} else {
    Write-Host "  ⚠️ No active Android device detected over USB." -ForegroundColor Yellow
    Write-Host "     Ensure:" -ForegroundColor Yellow
    Write-Host "     1. USB Debugging is turned ON in Developer Options." -ForegroundColor Yellow
    Write-Host "     2. USB Cable supports Data Transfer." -ForegroundColor Yellow
}

# 4. ADB Reverse Forwarding (tcp:3000 tcp:3000)
Write-Host "`n[4/4] Configuring ADB Reverse TCP Tunneling..." -ForegroundColor Yellow
& $adbPath reverse tcp:3000 tcp:3000

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Reverse rule created successfully: tcp:3000 -> tcp:3000" -ForegroundColor Green
    Write-Host "`nActive Reverse Mappings:" -ForegroundColor Cyan
    & $adbPath reverse --list
} else {
    Write-Host "  ❌ Failed to set adb reverse mapping. Is your phone connected?" -ForegroundColor Red
}

Write-Host "`n====================================================" -ForegroundColor Cyan
Write-Host " 🚀 NEXT STEPS FOR LOCALHOST DEVELOPMENT " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "1. In Web Terminal:" -ForegroundColor White
Write-Host "   cd web" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor Yellow
Write-Host "   (Website will start on http://localhost:3000)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. In Android Studio:" -ForegroundColor White
Write-Host "   Select your connected device and press Run ▶" -ForegroundColor Yellow
Write-Host "   (Android DEBUG app will automatically load http://127.0.0.1:3000/)" -ForegroundColor Gray
Write-Host "====================================================" -ForegroundColor Cyan
