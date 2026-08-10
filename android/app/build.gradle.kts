plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.nestdirect.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.nestdirect.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
        // Expose the web app URL through BuildConfig so it can be referenced in Kotlin code.
        // Overridden per build type below.
        buildConfigField("String", "WEB_BASE_URL", "\"https://nest-direct-webapp.vercel.app/\"")
    }

    buildTypes {
        debug {
            isDebuggable = true
            // Debug builds connect to localhost via USB ADB reverse.
            // Run: adb reverse tcp:3000 tcp:3000
            buildConfigField("String", "WEB_BASE_URL", "\"http://127.0.0.1:3000/\"")
        }
        release {
            isMinifyEnabled = false
            // Use standard signing config for local installation compatibility
            signingConfig = signingConfigs.getByName("debug")
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            // Release builds always use the live production Vercel deployment.
            buildConfigField("String", "WEB_BASE_URL", "\"https://nest-direct-webapp.vercel.app/\"")
        }
    }

    buildFeatures {
        // Required for BuildConfig.DEBUG and BuildConfig.WEB_BASE_URL references in Kotlin.
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    // AndroidX WebKit — modern WebView APIs
    implementation("androidx.webkit:webkit:1.11.0")
    // Core AndroidX
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    // Splash Screen API
    implementation("androidx.core:core-splashscreen:1.0.1")
}
