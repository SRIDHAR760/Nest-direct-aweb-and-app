# NestDirect Localhost + USB Android Debug

## 1. Start the web app on the PC
Open PowerShell in the web folder:

```powershell
npm install
npm run dev
```

Expected URL:

```text
http://localhost:3000
```

Keep this terminal open.

## 2. Enable USB debugging on the Android phone
- Settings > About phone > tap Build number 7 times
- Settings > Developer options > USB debugging ON
- Connect phone by USB
- Accept the RSA debugging prompt on the phone

## 3. Verify Android Debug Bridge
From Android Studio Terminal:

```powershell
adb devices
```

Your phone should be listed as `device`.

## 4. Forward phone localhost port 3000 to the PC

```powershell
adb reverse tcp:3000 tcp:3000
adb reverse --list
```

The debug Android build is already configured to open:

```text
http://127.0.0.1:3000/
```

## 5. Run from Android Studio
- Open the `android` folder in Android Studio
- Wait for Gradle Sync
- Select the connected phone in the device selector
- Select `app`
- Click Run ▶

Debug builds load the local PC web app through USB.
Release builds still use:

```text
https://nest-direct-webapp.vercel.app/
```

## 6. Test synchronization
- Open http://localhost:3000 in the PC browser
- Open NestDirect on the USB phone
- Sign in to the same Firebase-backed environment
- Create/update a property, inquiry, or chat from one side
- Check the other side

Both clients use the same Firebase/Firestore data.

## Troubleshooting

### Android says page cannot be reached
Run:

```powershell
adb reverse tcp:3000 tcp:3000
```

and make sure `npm run dev` is still running.

### `adb` is not recognized
Use Android Studio Terminal, or run the full SDK path such as:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices
```

### Phone shows `unauthorized`
Unlock the phone and accept the USB debugging RSA dialog, then run `adb devices` again.

### Multiple devices
Use:

```powershell
adb -s DEVICE_SERIAL reverse tcp:3000 tcp:3000
```

### Stop USB forwarding

```powershell
adb reverse --remove tcp:3000
```
