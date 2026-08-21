import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:media_kit/media_kit.dart';
import 'initial_screen.dart';
import 'login_screen.dart';
import 'home_screen.dart';
import 'player_screen.dart';
import 'series_details_screen.dart';
import 'api_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  MediaKit.ensureInitialized();

  // Enforce landscape for TV
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);

  final hasSavedSession = await ApiService.hasSavedSession();
  final initialRoute = hasSavedSession ? '/home' : '/';

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
              builder: (_) => _LoginGate(deviceId: deviceId),
            );
          case '/home':
            return MaterialPageRoute(builder: (_) => const HomeScreen());
          case '/player':
            final args = settings.arguments as Map<String, dynamic>? ?? {};
            final alternateVideoUrls = (args['alternateVideoUrls'] is List)
                ? (args['alternateVideoUrls'] as List)
                    .map((item) => item.toString())
                    .where((item) => item.isNotEmpty)
                    .toList()
                : <String>[];
            final liveChannels = (args['liveChannels'] is List)
                ? (args['liveChannels'] as List)
                    .whereType<IptvContentItem>()
                    .toList()
                : <IptvContentItem>[];
            return MaterialPageRoute(
              builder: (_) => PlayerScreen(
                title: args['title'] ?? 'Reprodução',
                subtitle: args['subtitle'] ?? '',
                description: (args['description'] ?? '').toString(),
                imageUrl: (args['imageUrl'] ?? '').toString(),
                category: args['category'] ?? '',
                videoUrl: args['videoUrl'] ?? '',
                alternateVideoUrls: alternateVideoUrls,
                contentType: (args['contentType'] ?? '').toString(),
                contentId: (args['contentId'] ?? '').toString(),
                favoriteId: (args['favoriteId'] ?? '').toString(),
                liveChannels: liveChannels,
                initialPosition: Duration(
                  milliseconds: args['resumePositionMs'] is int
                      ? args['resumePositionMs'] as int
                      : int.tryParse(
                            (args['resumePositionMs'] ?? '').toString(),
                          ) ??
                          0,
                ),
              ),
            );
          case '/series':
            final series = settings.arguments;
            if (series is IptvContentItem) {
              return MaterialPageRoute(
                builder: (_) => SeriesDetailsScreen(series: series),
              );
            }
            return MaterialPageRoute(builder: (_) => const HomeScreen());
          default:
            return MaterialPageRoute(builder: (_) => InitialScreen());
        }
      },
    );
  }
}

class _LoginGate extends StatelessWidget {
  final String deviceId;

  const _LoginGate({required this.deviceId});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<bool>(
      future: ApiService.hasSavedSession(),
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Scaffold(
            backgroundColor: Colors.black,
            body: Center(
              child: CircularProgressIndicator(color: Color(0xFF6A00FF)),
            ),
          );
        }

        if (snapshot.data == true) {
          return const HomeScreen();
        }

        return LoginScreen(deviceId: deviceId);
      },
    );
  }
}
