package com.example.streamflix_tv

import android.provider.Settings
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            "orio_player/device",
        ).setMethodCallHandler { call, result ->
            if (call.method == "getAndroidId") {
                result.success(
                    Settings.Secure.getString(
                        contentResolver,
                        Settings.Secure.ANDROID_ID,
                    ),
                )
            } else {
                result.notImplemented()
            }
        }
    }
}
