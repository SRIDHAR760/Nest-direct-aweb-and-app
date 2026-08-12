package com.nestdirect.app

import android.Manifest
import android.app.Activity
import android.app.DownloadManager
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.webkit.CookieManager
import android.webkit.GeolocationPermissions
import android.webkit.PermissionRequest
import android.webkit.SafeBrowsingResponse
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.annotation.RequiresApi
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen

class MainActivity : Activity() {
    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private lateinit var offlineMessage: TextView
    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null
    private var pendingPermissionRequest: PermissionRequest? = null
    private var pendingGeoCallback: GeolocationPermissions.Callback? = null
    private var pendingGeoOrigin: String? = null

    private val appUrl: String by lazy { 
        // Build-type specific URL configured in app/build.gradle.kts
        // DEBUG: http://127.0.0.1:3000/
        // RELEASE: https://nest-direct-webapp.vercel.app/
        BuildConfig.WEB_BASE_URL
    }
    private val trustedHosts = setOf("nest-direct-webapp.vercel.app", "127.0.0.1", "localhost")
    private val runtimePermissionRequestCode = 7001
    private val fileChooserRequestCode = 7002

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        buildUi()
        configureWebView()
        handleIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
    }

    private fun buildUi() {
        val root = FrameLayout(this)

        webView = WebView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        }
        root.addView(webView)

        progressBar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            max = 100
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                8
            ).apply { gravity = Gravity.TOP }
        }
        root.addView(progressBar)

        offlineMessage = TextView(this).apply {
            val debugInfo = if (BuildConfig.DEBUG) {
                "\n\n[DEBUG HINT]\n1. Ensure 'npm run dev' is running on PC.\n2. Run: 'adb reverse tcp:3000 tcp:3000'"
            } else ""
            text = "NestDirect connection error.\nCheck your network and tap here to retry.$debugInfo"
            textSize = 15f
            gravity = Gravity.CENTER
            setPadding(48, 48, 48, 48)
            visibility = View.GONE
            setOnClickListener { loadHome() }
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        }
        root.addView(offlineMessage)

        setContentView(root)
    }

    @Suppress("SetJavaScriptEnabled")
    private fun configureWebView() {
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            setGeolocationEnabled(true)
            loadsImagesAutomatically = true
            cacheMode = WebSettings.LOAD_DEFAULT
            mixedContentMode = if (BuildConfig.DEBUG) WebSettings.MIXED_CONTENT_ALWAYS_ALLOW else WebSettings.MIXED_CONTENT_NEVER_ALLOW
            allowFileAccess = false
            allowContentAccess = true
            javaScriptCanOpenWindowsAutomatically = true
            setSupportMultipleWindows(false)
            mediaPlaybackRequiresUserGesture = false
            builtInZoomControls = false
            displayZoomControls = false
            loadWithOverviewMode = true
            useWideViewPort = true
            userAgentString = "$userAgentString NestDirectAndroid/1.0"
        }

        CookieManager.getInstance().apply {
            setAcceptCookie(true)
            setAcceptThirdPartyCookies(webView, true)
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val uri = request.url
                return handleNavigation(uri)
            }

            override fun onPageStarted(view: WebView, url: String?, favicon: Bitmap?) {
                progressBar.visibility = View.VISIBLE
                offlineMessage.visibility = View.GONE
            }

            override fun onPageFinished(view: WebView, url: String?) {
                progressBar.visibility = View.GONE
            }

            override fun onReceivedHttpError(
                view: WebView,
                request: WebResourceRequest,
                errorResponse: WebResourceResponse
            ) {
                if (request.isForMainFrame && errorResponse.statusCode >= 500) {
                    showOfflineState()
                }
            }

            override fun onReceivedError(
                view: WebView,
                request: WebResourceRequest,
                error: WebResourceError
            ) {
                if (request.isForMainFrame) {
                    showOfflineState()
                }
            }

            @RequiresApi(Build.VERSION_CODES.O_MR1)
            override fun onSafeBrowsingHit(
                view: WebView,
                request: WebResourceRequest,
                threatType: Int,
                callback: SafeBrowsingResponse
            ) {
                callback.backToSafety(true)
                Toast.makeText(this@MainActivity, "Unsafe page blocked.", Toast.LENGTH_LONG).show()
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                progressBar.progress = newProgress
                progressBar.visibility = if (newProgress >= 100) View.GONE else View.VISIBLE
            }

            override fun onPermissionRequest(request: PermissionRequest) {
                if (request.origin.host !in trustedHosts) {
                    request.deny()
                    return
                }
                val androidPermissions = mutableListOf<String>()
                if (request.resources.contains(PermissionRequest.RESOURCE_VIDEO_CAPTURE)) {
                    androidPermissions += Manifest.permission.CAMERA
                }
                if (request.resources.contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE)) {
                    androidPermissions += Manifest.permission.RECORD_AUDIO
                }
                val missing = androidPermissions.filter {
                    checkSelfPermission(it) != PackageManager.PERMISSION_GRANTED
                }
                if (missing.isEmpty()) {
                    request.grant(request.resources)
                } else {
                    pendingPermissionRequest = request
                    requestPermissions(missing.toTypedArray(), runtimePermissionRequestCode)
                }
            }

            override fun onGeolocationPermissionsShowPrompt(
                origin: String,
                callback: GeolocationPermissions.Callback
            ) {
                val originUri = Uri.parse(origin)
                if (originUri.host !in trustedHosts) {
                    callback.invoke(origin, false, false)
                    return
                }
                val fine = checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                val coarse = checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
                if (fine || coarse) {
                    callback.invoke(origin, true, false)
                } else {
                    pendingGeoCallback = callback
                    pendingGeoOrigin = origin
                    requestPermissions(
                        arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION),
                        runtimePermissionRequestCode
                    )
                }
            }

            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                this@MainActivity.fileChooserCallback?.onReceiveValue(null)
                this@MainActivity.fileChooserCallback = filePathCallback
                return try {
                    val chooserIntent = fileChooserParams?.createIntent()
                        ?: Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                            type = "*/*"
                            addCategory(Intent.CATEGORY_OPENABLE)
                        }
                    startActivityForResult(chooserIntent, fileChooserRequestCode)
                    true
                } catch (_: ActivityNotFoundException) {
                    this@MainActivity.fileChooserCallback = null
                    Toast.makeText(this@MainActivity, "No file picker available.", Toast.LENGTH_LONG).show()
                    false
                }
            }
        }

        webView.setDownloadListener { url, _, contentDisposition, mimeType, _ ->
            try {
                val request = DownloadManager.Request(Uri.parse(url))
                    .setMimeType(mimeType)
                    .addRequestHeader("Cookie", CookieManager.getInstance().getCookie(url))
                    .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                    .setDestinationInExternalPublicDir(
                        Environment.DIRECTORY_DOWNLOADS,
                        android.webkit.URLUtil.guessFileName(url, contentDisposition, mimeType)
                    )
                (getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager).enqueue(request)
                Toast.makeText(this, "Download started.", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Toast.makeText(this, "Could not download file: ${e.message}", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun handleNavigation(uri: Uri): Boolean {
        val scheme = uri.scheme?.lowercase()
        if ((scheme == "https" || scheme == "http") && uri.host in trustedHosts) {
            return false
        }

        if (scheme == "tel" || scheme == "mailto" || scheme == "geo" || scheme == "sms") {
            return openExternal(uri)
        }

        if (scheme == "http" || scheme == "https") {
            return openExternal(uri)
        }

        return try {
            startActivity(Intent(Intent.ACTION_VIEW, uri))
            true
        } catch (_: Exception) {
            true
        }
    }

    private fun openExternal(uri: Uri): Boolean {
        return try {
            startActivity(Intent(Intent.ACTION_VIEW, uri))
            true
        } catch (_: Exception) {
            Toast.makeText(this, "No app can open this link.", Toast.LENGTH_SHORT).show()
            true
        }
    }

    private fun handleIntent(intent: Intent) {
        val target = intent.data?.takeIf { it.host in trustedHosts }?.toString() ?: appUrl
        if (isOnline()) {
            offlineMessage.visibility = View.GONE
            webView.visibility = View.VISIBLE
            webView.loadUrl(target)
        } else {
            showOfflineState()
        }
    }

    private fun loadHome() {
        if (isOnline()) {
            webView.visibility = View.VISIBLE
            offlineMessage.visibility = View.GONE
            webView.loadUrl(appUrl)
        } else {
            Toast.makeText(this, "Still offline.", Toast.LENGTH_SHORT).show()
        }
    }

    private fun showOfflineState() {
        progressBar.visibility = View.GONE
        webView.visibility = View.GONE
        offlineMessage.visibility = View.VISIBLE
    }

    private fun isOnline(): Boolean {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = cm.activeNetwork ?: return false
        val capabilities = cm.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode != runtimePermissionRequestCode) return

        pendingPermissionRequest?.let { webPermission ->
            val allGranted = permissions.indices.all { grantResults.getOrNull(it) == PackageManager.PERMISSION_GRANTED }
            if (allGranted) webPermission.grant(webPermission.resources) else webPermission.deny()
            pendingPermissionRequest = null
        }

        pendingGeoCallback?.let { callback ->
            val origin = pendingGeoOrigin ?: ""
            val granted = checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED ||
                checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
            callback.invoke(origin, granted, false)
            pendingGeoCallback = null
            pendingGeoOrigin = null
        }
    }

    @Deprecated("Deprecated in Android API, retained for file chooser compatibility")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == fileChooserRequestCode) {
            val result = if (resultCode == RESULT_OK) {
                WebChromeClient.FileChooserParams.parseResult(resultCode, data)
            } else null
            fileChooserCallback?.onReceiveValue(result)
            fileChooserCallback = null
        }
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }

    override fun onDestroy() {
        webView.apply {
            stopLoading()
            clearHistory()
            removeAllViews()
            destroy()
        }
        super.onDestroy()
    }
}
