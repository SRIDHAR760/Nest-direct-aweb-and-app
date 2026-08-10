# 🏠 NestDirect — Complete Master Setup & Integration Guide

**NestDirect** is a peer-to-peer, direct-to-owner house rental discovery platform engineered to eliminate brokerage commissions across major Chennai hubs (Adyar, Mylapore, OMR, Velachery, Besant Nagar, Sholinganallur).

This repository contains the complete unified full-stack system:
- **`web/`**: Next-gen React 19 + Vite 6 + Express web application integrated with Cloud Firestore & Gemini AI.
- **`android/`**: Native Android Studio (Kotlin) application powering the mobile interface with build-type dynamic routing (`http://127.0.0.1:3000/` for Debug via USB ADB, `https://nest-direct-webapp.vercel.app/` for Release).
- **`scripts/`**: Automation tooling for Windows PowerShell.

---

## 🏗️ Architecture & Synchronization Flow

```text
       ┌────────────────────────────────────────────────────────┐
       │                      PC BROWSER                        │
       │                http://localhost:3000                   │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │             NestDirect Web Application                 │
       │                   (React + Vite)                       │
       └──────────────┬──────────────────────────▲──────────────┘
                      │                          │
                      │ Firebase Auth            │ Firestore Real-Time
                      ▼                          │ Snapshot Sync
       ┌─────────────────────────────────────────┴──────────────┐
       │                    Cloud Firestore                     │
       │             Shared Production Database                 │
       │      (users, properties, inquiries, chat_messages)      │
       └─────────────────────────────────────────▲──────────────┘
                                                 │
                                                 │ Firebase Auth &
                                                 │ Real-Time Sync
                                                 │
       ┌─────────────────────────────────────────┴──────────────┐
       │                NestDirect Android App                  │
       │                   (com.nestdirect.app)                 │
       └───────────────────────────▲────────────────────────────┘
                                   │
                                   │ USB ADB Reverse Tunnel
                                   │ (adb reverse tcp:3000 tcp:3000)
                                   │
       ┌───────────────────────────┴────────────────────────────┐
       │                    ANDROID DEVICE                      │
       │                http://127.0.0.1:3000/                  │
       └────────────────────────────────────────────────────────┘
```

---

## ⚡ Windows Quick Start Guide

### Step 1: Start Web Application (Terminal 1)

```powershell
cd web
npm install
npm run dev
```

The web server will start on:
👉 `http://localhost:3000`

### Step 2: Configure USB Reverse Tunnel (Terminal 2)

Connect your Android phone via USB (with USB Debugging enabled under Developer Options).

Option A: Run Automated Script:
```powershell
.\scripts\start_local_development.ps1
```

Option B: Run Manual Commands:
```powershell
adb devices
adb reverse tcp:3000 tcp:3000
adb reverse --list
```

### Step 3: Run Android Application (Android Studio)

1. Open the `android` folder in **Android Studio**.
2. Let Gradle sync complete.
3. Select your connected Android phone in the target device dropdown.
4. Click **Run ▶** (or press Shift+F10).

The **Debug APK** will launch and instantly load `http://127.0.0.1:3000/` reaching your local PC web server via USB ADB reverse!

---

## 🔧 Build Types & Target URLs

The Android application uses Gradle `BuildConfig` variables to cleanly isolate development and production environments:

| Build Variant | Target Web URL | Transport | Cleartext HTTP |
|---------------|────────────────|-----------|----------------|
| **Debug** (`assembleDebug`) | `http://127.0.0.1:3000/` | USB ADB Reverse Tunnel | Allowed strictly for `127.0.0.1` & `localhost` |
| **Release** (`assembleRelease`) | `https://nest-direct-webapp.vercel.app/` | Production Internet (HTTPS) | Enforced HTTPS only (Cleartext blocked) |

---

## ⚙️ Requirements & Tooling

- **Operating System:** Windows 10/11 (PowerShell)
- **Node.js:** >= 18.x
- **npm:** >= 9.x
- **JDK:** OpenJDK 17 or bundled Android Studio JDK
- **Android SDK:** Platform 35 (`compileSdk = 35`, `targetSdk = 35`, `minSdk = 26`)
- **Gradle:** 8.11.1 wrapper included

---

## 📱 Hardware & USB Debugging Setup

1. On your Android device:
   - Navigate to **Settings** > **About Phone**.
   - Tap **Build Number** 7 times to enable **Developer Options**.
   - Go to **Settings** > **Developer Options** and enable **USB Debugging**.
2. Connect the phone to your PC via USB cable.
3. When prompted on the phone screen with *"Allow USB debugging?"*, select **Always allow from this computer** and press **Allow**.

---

## 🛠️ Gradle Commands

Build Debug APK:
```powershell
cd android
.\gradlew.bat clean assembleDebug
```
Output path: `android\app\build.gradle.kts` -> `android\app\build\outputs\apk\debug\app-debug.apk`

Build Release APK:
```powershell
cd android
.\gradlew.bat assembleRelease
```

---

## ❓ Troubleshooting

### 1. Android Displays "Connection Error" / Offline State
- Verify `npm run dev` is running in the `web/` terminal.
- Run `adb reverse tcp:3000 tcp:3000` again.
- Confirm `adb reverse --list` returns `tcp:3000 tcp:3000`.

### 2. Device shows `unauthorized` in `adb devices`
- Unlock your phone.
- Accept the RSA key fingerprint dialog on the device screen.
- Rerun `adb devices`.

### 3. `adb` is not recognized
- Execute using full SDK path in PowerShell:
  ```powershell
  & "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices
  & "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" reverse tcp:3000 tcp:3000
  ```

---

## 📄 License & System Status

NestDirect Full-Stack Architecture — Verified & Operational.
