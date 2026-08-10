# 🧪 NestDirect 20-Point Cross-Platform Synchronization & Functional Test Plan

This document details the complete 20-point test matrix to verify full operational readiness and real-time backend synchronization between **NestDirect Web** (`http://localhost:3000`) and **NestDirect Android** (`http://127.0.0.1:3000` debug over USB ADB / `https://nest-direct-webapp.vercel.app/` release).

---

## 📋 Test Matrix

| # | Test Case | Target System | Action / Steps | Expected Result | Pass/Fail Criteria |
|---|-----------|---------------|----------------|-----------------|-------------------|
| **1** | **Website Localhost Load** | Web | Run `npm run dev` in `web/` and open `http://localhost:3000` | NestDirect landing page loads, displaying property listings and features. | Web server loads on port 3000 with 200 OK. |
| **2** | **Android ADB Connection** | Android (Debug) | Run `adb reverse tcp:3000 tcp:3000` & launch Android Debug APK | Android app connects to `http://127.0.0.1:3000/` and renders local web app. | Android display matches PC browser display. |
| **3** | **Firebase Email Authentication (Web)** | Web | Sign in or register with Email/Password on PC web. | Authentication succeeds and user state updates. | User UID set in Firebase Auth & document created in Firestore `users`. |
| **4** | **Firebase Email Authentication (Android)** | Android | Sign in with same Email/Password inside Android app. | Authentication succeeds and session state persists. | User profile loaded seamlessly. |
| **5** | **Property Inventory Load** | Web & Android | Open Browse listings view on both devices. | Verified listings load directly from Cloud Firestore `properties` collection. | Real-time snapshot populates grid. |
| **6** | **Add Property (Web → Android Sync)** | Web | Submit a new property listing from Owner Portal on Web. | New property document created in Firestore; appears instantly on Android without refresh. | Real-time `onSnapshot` updates Android UI. |
| **7** | **Add Property (Android → Web Sync)** | Android | Submit a new property listing from Owner Portal on Android device. | Appears instantly on Web browser interface. | Firestore document created; Web reflects change. |
| **8** | **Edit Property Details** | Web / Android | Modify price or title of an owned listing. | Updated details reflect in real-time across both Web and Android. | Document merged in Firestore `properties/{id}`. |
| **9** | **Delete Property** | Web / Android | Delete a property from Owner Dashboard. | Property removed from both Web & Android listing views instantly. | Document deleted from Firestore `properties`. |
| **10** | **Tour Inquiry Synchronization** | Android → Web | Request a tour/visit for a property from Android app. | Inquiry document created in Firestore `inquiries`; appears in Owner Portal on Web. | Status shows pending; owner gets real-time notification/card. |
| **11** | **Real-Time Chat Dialogue** | Web ↔ Android | Send message from Android tenant to Web landlord. | Message arrives instantly on Web chat tab (`chat_messages` listener). Reply appears on Android. | Bi-directional real-time message stream. |
| **12** | **Favorites / Bookmarks Sync** | Web & Android | Bookmark property on Android; refresh Web. | Favorites list synchronized via `users/{uid}` cloud document. | Bookmarked status synced on both clients. |
| **13** | **Image File Upload** | Android | Click property photo upload inside Android WebView. | Native Android file chooser opens (Gallery/Camera); image uploads successfully. | File chooser callback returns image URI. |
| **14** | **Geolocation Permission** | Android | Tap "Use Current Location" or view Neighborhood Map. | Android prompts runtime location permission; location center updates on grant. | WebChromeClient grants geo permission smoothly. |
| **15** | **Android Hardware Back Navigation** | Android | Navigate deep into property details, then press Android system back button. | WebView navigates back in browser history (`webView.goBack()`) instead of closing app. | Smooth back navigation history stack. |
| **16** | **Network Error & Localhost Offline Recovery** | Android | Disconnect npm dev server; launch Android debug app. | Android displays friendly error view with ADB troubleshooting tips; tap-to-retry reloads upon server restart. | No white blank screen on network failure. |
| **17** | **Application Process Restart** | Android | Force stop Android app and re-launch. | WebView restores session; user remains logged into Firebase without re-entering credentials. | DOM storage & cookies preserved. |
| **18** | **Firebase Auth Session Persistence** | Web & Android | Close browser tab / restart phone app. | Session survives application backgrounding/recreation cleanly. | Auth state restored via IndexedDB / Web Storage. |
| **19** | **Release URL Enforcement** | Android (Release) | Build `assembleRelease` APK and inspect runtime URL. | Release APK explicitly connects to `https://nest-direct-webapp.vercel.app/` (Production Vercel). | `BuildConfig.WEB_BASE_URL` resolves to production URL. |
| **20** | **Debug URL USB Enforcement** | Android (Debug) | Build `assembleDebug` APK and inspect runtime URL. | Debug APK explicitly connects to `http://127.0.0.1:3000/` (Localhost via USB reverse). | `BuildConfig.WEB_BASE_URL` resolves to debug URL. |

---

## 🛠️ Step-by-Step Sync Verification Procedure

1. **Start Local Server:**
   ```powershell
   cd web
   npm run dev
   ```
   *Verify server is listening on `http://localhost:3000`*

2. **Connect Device & Tunnel ADB:**
   ```powershell
   adb devices
   adb reverse tcp:3000 tcp:3000
   ```

3. **Launch Debug App on USB Device:**
   - In Android Studio, run `app` (Debug).
   - Android phone will open `http://127.0.0.1:3000/` reaching PC `localhost:3000`.

4. **Verify Shared Real-Time Firestore:**
   - Add property on PC web -> Check Android phone.
   - Send chat message on Android phone -> Check PC web.
   - Both interfaces will update automatically in real-time!
