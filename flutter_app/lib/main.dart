import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:media_kit/media_kit.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'initial_screen.dart';
import 'login_screen.dart';
import 'home_screen.dart';
import 'player_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  MediaKit.ensureInitialized();

  // Enforce landscape for TV
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);

  final prefs = await SharedPreferences.getInstance();
  final token = prefs.getString('auth_token');
  final initialRoute = token != null ? '/home' : '/';

  runApp(StreamFlixApp(initialRoute: initialRoute));
}

class StreamFlixApp extends StatelessWidget {
  final String initialRoute;

  const StreamFlixApp({Key? key, required this.initialRoute}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'StreamFlix TV',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: const Color(0xFF6A00FF),
        scaffoldBackgroundColor: Colors.black,
        focusColor: Colors.white24,
        highlightColor: Colors.white10,
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.grey.shade900,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          labelStyle: const TextStyle(color: Colors.grey),
        ),
      ),
      initialRoute: initialRoute,
      onGenerateRoute: (settings) {
        switch (settings.name) {
          case '/':
            return MaterialPageRoute(builder: (_) => InitialScreen());
          case '/login':
            final deviceId = settings.arguments as String? ?? 'unknown';
            return MaterialPageRoute(
                builder: (_) => LoginScreen(deviceId: deviceId));
          case '/home':
            return MaterialPageRoute(builder: (_) => HomeScreen());
          case '/player':
            final args = settings.arguments as Map<String, dynamic>? ?? {};
            final alternateVideoUrls = (args['alternateVideoUrls'] is List)
                ? (args['alternateVideoUrls'] as List)
                    .map((item) => item.toString())
                    .where((item) => item.isNotEmpty)
                    .toList()
                : <String>[];
            return MaterialPageRoute(
              builder: (_) => PlayerScreen(
                title: args['title'] ?? 'Reprodução',
                subtitle: args['subtitle'] ?? '',
                category: args['category'] ?? '',
                videoUrl: args['videoUrl'] ?? '',
                alternateVideoUrls: alternateVideoUrls,
              ),
            );
          default:
            return MaterialPageRoute(builder: (_) => InitialScreen());
        }
      },
    );
  }
}
