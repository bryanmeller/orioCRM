import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timezone/data/latest_all.dart' as tz;
import 'package:timezone/timezone.dart' as tz;

import 'api_service.dart';

class EventReminder {
  final String eventId;
  final int notificationId;
  final String title;
  final DateTime startDateTime;
  final String streamUrl;
  final List<String> alternateStreamUrls;
  final String imageUrl;
  final String category;
  final String categoryId;
  final String subtitle;
  final String description;

  const EventReminder({
    required this.eventId,
    required this.notificationId,
    required this.title,
    required this.startDateTime,
    required this.streamUrl,
    required this.alternateStreamUrls,
    required this.imageUrl,
    required this.category,
    required this.categoryId,
    required this.subtitle,
    required this.description,
  });

  factory EventReminder.fromJson(Map<String, dynamic> json) {
    return EventReminder(
      eventId: _stringValue(json['eventId']),
      notificationId: int.tryParse('${json['notificationId']}') ?? 0,
      title: _stringValue(json['title']),
      startDateTime: DateTime.tryParse(_stringValue(json['startDateTime'])) ??
          DateTime.fromMillisecondsSinceEpoch(0),
      streamUrl: _stringValue(json['streamUrl']),
      alternateStreamUrls: (json['alternateStreamUrls'] is List)
          ? (json['alternateStreamUrls'] as List)
              .map((item) => item.toString())
              .where((item) => item.isNotEmpty)
              .toList()
          : const [],
      imageUrl: _stringValue(json['imageUrl']),
      category: _stringValue(json['category']),
      categoryId: _stringValue(json['categoryId']),
      subtitle: _stringValue(json['subtitle']),
      description: _stringValue(json['description']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'eventId': eventId,
      'notificationId': notificationId,
      'title': title,
      'startDateTime': startDateTime.toIso8601String(),
      'streamUrl': streamUrl,
      'alternateStreamUrls': alternateStreamUrls,
      'imageUrl': imageUrl,
      'category': category,
      'categoryId': categoryId,
      'subtitle': subtitle,
      'description': description,
    };
  }

  IptvContentItem toContentItem() {
    return IptvContentItem(
      id: eventId,
      title: title,
      subtitle: subtitle,
      category: category,
      categoryId: categoryId,
      streamUrl: streamUrl,
      alternateStreamUrls: alternateStreamUrls,
      imageUrl: imageUrl,
      type: 'live',
      description: description,
      eventStartDateTime: startDateTime,
    );
  }
}

class ReminderService {
  static const String _storageKey = 'game_day_event_reminders';
  static const String _channelId = 'game_day_reminders';
  static const String _channelName = 'Lembretes de jogos';
  static const String _channelDescription =
      'Notificacoes 15 minutos antes dos jogos marcados.';
  static const String _notificationIcon = 'ic_launcher_foreground';

  static final FlutterLocalNotificationsPlugin _notifications =
      FlutterLocalNotificationsPlugin();
  static final ValueNotifierPayload tapPayload = ValueNotifierPayload();

  static bool _initialized = false;
  static String? _initialPayload;

  static String? consumeInitialPayload() {
    final payload = _initialPayload;
    _initialPayload = null;
    return payload;
  }

  static Future<void> initialize() async {
    if (_initialized) {
      return;
    }

    tz.initializeTimeZones();
    await _configureLocalTimezone();

    const androidSettings = AndroidInitializationSettings(_notificationIcon);
    const settings = InitializationSettings(android: androidSettings);

    final launchDetails =
        await _notifications.getNotificationAppLaunchDetails();
    if (launchDetails?.didNotificationLaunchApp == true) {
      _initialPayload = launchDetails?.notificationResponse?.payload;
    }

    await _notifications.initialize(
      settings: settings,
      onDidReceiveNotificationResponse: (response) {
        final payload = response.payload;
        if (payload == null || payload.isEmpty) {
          return;
        }
        tapPayload.value = payload;
      },
    );

    await _notifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(
          const AndroidNotificationChannel(
            _channelId,
            _channelName,
            description: _channelDescription,
            importance: Importance.high,
          ),
        );

    _initialized = true;
  }

  static Future<bool> requestNotificationPermission() async {
    await initialize();
    final android = _notifications.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();
    final granted = await android?.requestNotificationsPermission();
    return granted ?? true;
  }

  static Future<Map<String, EventReminder>> getActiveReminders() async {
    final prefs = await SharedPreferences.getInstance();
    final rawList = prefs.getStringList(_storageKey) ?? [];
    final reminders = <String, EventReminder>{};
    final now = DateTime.now();
    var changed = false;

    for (final raw in rawList) {
      try {
        final decoded = jsonDecode(raw);
        if (decoded is! Map) {
          changed = true;
          continue;
        }
        final reminder = EventReminder.fromJson(
          Map<String, dynamic>.from(decoded),
        );
        if (reminder.eventId.isEmpty ||
            reminder.notificationId == 0 ||
            !reminder.startDateTime.isAfter(now)) {
          if (reminder.notificationId != 0) {
            await _notifications.cancel(id: reminder.notificationId);
          }
          changed = true;
          continue;
        }
        reminders[reminder.eventId] = reminder;
      } catch (_) {
        changed = true;
      }
    }

    if (changed) {
      await _saveReminders(reminders);
    }
    return reminders;
  }

  static Future<EventReminder> scheduleGameReminder(
    IptvContentItem event,
  ) async {
    await initialize();
    final startDateTime = event.eventStartDateTime;
    if (startDateTime == null) {
      throw Exception('Horario do evento nao encontrado.');
    }

    final scheduledDate = startDateTime.subtract(const Duration(minutes: 15));
    if (!scheduledDate.isAfter(DateTime.now())) {
      throw Exception('Nao e possivel lembrar jogos que ja comecaram.');
    }

    final permitted = await requestNotificationPermission();
    if (!permitted) {
      throw Exception('Permissao de notificacao negada.');
    }
    final exactAlarmPermitted = await _requestExactAlarmPermission();
    if (!exactAlarmPermitted) {
      throw Exception('Permissao de alarme exato negada.');
    }

    final reminders = await getActiveReminders();
    final notificationId = _notificationIdForEvent(event.id);
    final reminder = EventReminder(
      eventId: event.id,
      notificationId: notificationId,
      title: event.title,
      startDateTime: startDateTime,
      streamUrl: event.streamUrl,
      alternateStreamUrls: event.alternateStreamUrls,
      imageUrl: event.imageUrl,
      category: event.category,
      categoryId: event.categoryId,
      subtitle: event.subtitle,
      description: event.description,
    );

    await _notifications.zonedSchedule(
      id: notificationId,
      title: 'Seu jogo comeca em 15 minutos',
      body:
          '${event.title} comeca as ${_formatTime(startDateTime)}. Toque para assistir.',
      scheduledDate: tz.TZDateTime.from(scheduledDate, tz.local),
      notificationDetails: const NotificationDetails(
        android: AndroidNotificationDetails(
          _channelId,
          _channelName,
          channelDescription: _channelDescription,
          icon: _notificationIcon,
          importance: Importance.high,
          priority: Priority.high,
          category: AndroidNotificationCategory.reminder,
        ),
      ),
      payload: _payloadFor(event.id),
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
    );

    reminders[event.id] = reminder;
    await _saveReminders(reminders);
    return reminder;
  }

  static Future<void> cancelGameReminder(String eventId) async {
    await initialize();
    final reminders = await getActiveReminders();
    final reminder = reminders.remove(eventId);
    if (reminder != null) {
      await _notifications.cancel(id: reminder.notificationId);
      await _saveReminders(reminders);
    }
  }

  static String? eventIdFromPayload(String? payload) {
    if (payload == null || payload.isEmpty) {
      return null;
    }
    try {
      final decoded = jsonDecode(payload);
      if (decoded is Map && decoded['type'] == 'game_reminder') {
        return _stringValue(decoded['eventId']);
      }
    } catch (_) {
      return null;
    }
    return null;
  }

  static String payloadForEventId(String eventId) {
    return _payloadFor(eventId);
  }

  static String _payloadFor(String eventId) {
    return jsonEncode({'type': 'game_reminder', 'eventId': eventId});
  }

  static Future<bool> _requestExactAlarmPermission() async {
    final android = _notifications.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();
    if (android == null) {
      return true;
    }

    final canSchedule = await android.canScheduleExactNotifications();
    if (canSchedule == true) {
      return true;
    }

    final granted = await android.requestExactAlarmsPermission();
    return granted ?? false;
  }

  static Future<void> _saveReminders(
    Map<String, EventReminder> reminders,
  ) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(
      _storageKey,
      reminders.values.map((item) => jsonEncode(item.toJson())).toList(),
    );
  }

  static Future<void> _configureLocalTimezone() async {
    try {
      final localTimezone = await FlutterTimezone.getLocalTimezone();
      tz.setLocalLocation(tz.getLocation(localTimezone.identifier));
    } catch (_) {
      tz.setLocalLocation(tz.UTC);
    }
  }

  static int _notificationIdForEvent(String eventId) {
    var hash = 0x811c9dc5;
    for (final unit in eventId.codeUnits) {
      hash ^= unit;
      hash = (hash * 0x01000193) & 0x7fffffff;
    }
    return max(1, hash);
  }

  static String _formatTime(DateTime value) {
    final hour = value.hour.toString().padLeft(2, '0');
    final minute = value.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }
}

class ValueNotifierPayload {
  final _controller = StreamController<String>.broadcast();
  String? _value;

  Stream<String> get stream => _controller.stream;

  set value(String payload) {
    _value = payload;
    _controller.add(payload);
  }

  String? consume() {
    final value = _value;
    _value = null;
    return value;
  }
}

String _stringValue(dynamic value, {String fallback = ''}) {
  if (value == null) {
    return fallback;
  }
  final text = value.toString().trim();
  return text.isEmpty ? fallback : text;
}
