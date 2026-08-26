import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:media_kit/media_kit.dart';
import 'initial_screen.dart';
import 'login_screen.dart';
import 'home_screen.dart';
import 'player_screen.dart';
import 'series_details_screen.dart';
import 'api_service.dart';
import 'reminder_service.dart';

final GlobalKey<NavigatorState> appNavigatorKey = GlobalKey<NavigatorState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  MediaKit.ensureInitialized();

  // Keep the mobile app in landscape, matching the IPTV browsing layout.
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);

  final hasSavedSession = await ApiService.hasSavedSession();
  final initialRoute = hasSavedSession ? '/home' : '/';

  runApp(
    StreamFlixApp(
      initialRoute: initialRoute,
    ),
  );

  unawaited(_initializeRemindersAfterStartup());
}

Future<void> _initializeRemindersAfterStartup() async {
  try {
    await ReminderService.initialize();
    final eventId = ReminderService.eventIdFromPayload(
        ReminderService.consumeInitialPayload());
    if (eventId == null || eventId.isEmpty) {
      return;
    }
    ReminderService.tapPayload.value =
        ReminderService.payloadForEventId(eventId);
  } catch (error) {
    debugPrint('ReminderService initialization failed: $error');
  }
}

class StreamFlixApp extends StatefulWidget {
  final String initialRoute;
  final String? initialReminderEventId;

  const StreamFlixApp({
    Key? key,
    required this.initialRoute,
    this.initialReminderEventId,
  }) : super(key: key);

  @override
  State<StreamFlixApp> createState() => _StreamFlixAppState();
}

class _StreamFlixAppState extends State<StreamFlixApp> {
  late final Stream<String> _notificationTapStream;
  StreamSubscription<String>? _notificationTapSubscription;

  @override
  void initState() {
    super.initState();
    _notificationTapStream = ReminderService.tapPayload.stream;
    _notificationTapSubscription = _notificationTapStream.listen(
      _handleNotificationPayload,
    );
  }

  @override
  void dispose() {
    _notificationTapSubscription?.cancel();
    super.dispose();
  }

  Future<void> _handleNotificationPayload(String payload) async {
    final eventId = ReminderService.eventIdFromPayload(payload);
    if (eventId == null || eventId.isEmpty) {
      return;
    }

    final hasSavedSession = await ApiService.hasSavedSession();
    final navigator = appNavigatorKey.currentState;
    if (navigator == null) {
      return;
    }

    if (!hasSavedSession) {
      navigator.pushNamedAndRemoveUntil('/', (route) => false);
      return;
    }

    navigator.pushNamedAndRemoveUntil(
      '/home',
      (route) => false,
      arguments: {'reminderEventId': eventId},
    );
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Orio CRM Mobile',
      navigatorKey: appNavigatorKey,
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
      initialRoute: widget.initialRoute,
      onGenerateRoute: (settings) {
        switch (settings.name) {
          case '/':
            return MaterialPageRoute(builder: (_) => const InitialScreen());
          case '/login':
            final deviceId = settings.arguments as String? ?? 'unknown';
            return MaterialPageRoute(
              builder: (_) => _LoginGate(deviceId: deviceId),
            );
          case '/home':
            final args = settings.arguments as Map<String, dynamic>? ?? {};
            final reminderEventId =
                (args['reminderEventId'] ?? widget.initialReminderEventId)
                    ?.toString();
            return MaterialPageRoute(
              builder: (_) => HomeScreen(
                initialReminderEventId: reminderEventId,
              ),
            );
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
            return MaterialPageRoute(builder: (_) => const InitialScreen());
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
