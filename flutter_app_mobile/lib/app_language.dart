import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

class AppLanguage {
  static String _code = 'pt';

  static String get code => _code;
  static bool get isEnglish => _code == 'en';

  static String text(String portuguese, String english) {
    return isEnglish ? english : portuguese;
  }

  static Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    final rawUser = prefs.getString('user_data') ?? '';
    if (rawUser.isEmpty) {
      _code = 'pt';
      return;
    }
    try {
      final decoded = jsonDecode(rawUser);
      if (decoded is Map) {
        setPreferredLanguage(decoded['preferred_language']?.toString());
        return;
      }
    } catch (_) {
      // Keep Portuguese when saved user data cannot be decoded.
    }
    _code = 'pt';
  }

  static void updateFromLoginResponse(Map<String, dynamic> response) {
    final user = response['user'];
    setPreferredLanguage(
        user is Map ? user['preferred_language']?.toString() : null);
  }

  static void setPreferredLanguage(String? language) {
    final normalized = (language ?? '').trim().toLowerCase();
    _code = normalized.startsWith('en') ? 'en' : 'pt';
  }
}
