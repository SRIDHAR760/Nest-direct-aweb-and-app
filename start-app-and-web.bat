@echo off
title NestDirect - Fast Local Web and Mobile App Launcher
echo ========================================================
echo   NestDirect - Fast Web ^& Mobile App Launcher
echo ========================================================
echo.
echo [1/3] Setting up ADB USB Reverse Tunnel (tcp:3000)...
adb reverse tcp:3000 tcp:3000

echo [2/3] Opening Web App in Browser...
start http://localhost:3000

echo [3/3] Launching Fast NestDirect Android App on Phone...
adb shell am force-stop com.nestdirect.app
adb shell am start -n com.nestdirect.app/.MainActivity

echo.
echo ========================================================
echo   BOTH WEB ^& MOBILE APP ARE RUNNING LIVE!
echo ========================================================
timeout /t 3
