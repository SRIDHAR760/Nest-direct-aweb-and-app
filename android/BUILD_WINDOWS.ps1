$ErrorActionPreference = "Stop"

Write-Host "NestDirect Android build check" -ForegroundColor Cyan

if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
    throw "Java is not available. In Android Studio, use the bundled JDK or install JDK 17."
}

if (-not $env:ANDROID_HOME) {
    $defaultSdk = Join-Path $env:LOCALAPPDATA "Android\Sdk"
    if (Test-Path $defaultSdk) {
        $env:ANDROID_HOME = $defaultSdk
    }
}

if (-not $env:ANDROID_HOME -or -not (Test-Path $env:ANDROID_HOME)) {
    throw "Android SDK not found. Open Android Studio > Settings > Android SDK and install Android SDK Platform 35."
}

"sdk.dir=$($env:ANDROID_HOME -replace '\\','\\\\')" | Set-Content -Encoding ASCII local.properties

Write-Host "Using Android SDK: $env:ANDROID_HOME" -ForegroundColor Green
Write-Host "Building debug APK..." -ForegroundColor Cyan

.\gradlew.bat clean assembleDebug --console=plain

$apk = Join-Path $PSScriptRoot "app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apk) {
    Write-Host "SUCCESS: $apk" -ForegroundColor Green
} else {
    throw "Build command completed but APK was not found at $apk"
}
