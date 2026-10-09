import 'dart:io';
import 'dart:math';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

class DeviceInfoHelper {
  static const MethodChannel _deviceChannel =
      MethodChannel('orio_player/device');
  static const String _persistentDeviceIdKey = 'orio_device_id_v2';

  static Future<String> getDeviceId() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_persistentDeviceIdKey)?.trim() ?? '';
    if (saved.isNotEmpty) {
      return saved;
    }

    final DeviceInfoPlugin deviceInfo = DeviceInfoPlugin();
    String deviceId;
    if (Platform.isAndroid) {
      final AndroidDeviceInfo androidInfo = await deviceInfo.androidInfo;
      final hasExistingSession =
          (prefs.getString('auth_token') ?? '').isNotEmpty ||
              (prefs.getString('servers_data') ?? '').isNotEmpty;
      if (hasExistingSession) {
        // Preserve the identifier used by versions already installed so an
        // update does not consume another device slot on the backend.
        deviceId = androidInfo.id;
      } else {
        try {
          deviceId = (await _deviceChannel.invokeMethod<String>('getAndroidId'))
                  ?.trim() ??
              '';
        } catch (_) {
          deviceId = '';
        }
        if (deviceId.isEmpty || deviceId == '9774d56d682e549c') {
          deviceId = _generateInstallId();
        }
      }
    } else if (Platform.isIOS) {
      final IosDeviceInfo iosInfo = await deviceInfo.iosInfo;
      deviceId = iosInfo.identifierForVendor?.trim() ?? '';
      if (deviceId.isEmpty) {
        deviceId = _generateInstallId();
      }
    } else {
      deviceId = _generateInstallId();
    }

    await prefs.setString(_persistentDeviceIdKey, deviceId);
    return deviceId;
  }

  static String _generateInstallId() {
    final random = Random.secure();
    final value = List.generate(
      12,
      (_) => random.nextInt(256).toRadixString(16).padLeft(2, '0'),
    ).join().toUpperCase();
    return 'ORIO-${value.substring(0, 8)}-${value.substring(8, 16)}-${value.substring(16)}';
  }

  static Future<Map<String, dynamic>> getDeviceInfoDetails() async {
    final DeviceInfoPlugin deviceInfo = DeviceInfoPlugin();
    if (Platform.isAndroid) {
      final AndroidDeviceInfo androidInfo = await deviceInfo.androidInfo;
      return {
        'model': androidInfo.model,
        'os': 'Android ${androidInfo.version.release}',
        'appVersion': '1.0.0', // Could use package_info_plus
      };
    } else if (Platform.isIOS) {
      final IosDeviceInfo iosInfo = await deviceInfo.iosInfo;
      return {
        'model': iosInfo.utsname.machine,
        'os': 'iOS ${iosInfo.systemVersion}',
        'appVersion': '1.0.0',
      };
    }
    return {};
  }
}
