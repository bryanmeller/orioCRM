import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import 'app_language.dart';

class IptvServer {
  final String id;
  final String name;
  final String baseUrl;
  final String username;
  final String password;
  final String preferredOutput;

  const IptvServer({
    required this.id,
    required this.name,
    required this.baseUrl,
    required this.username,
    required this.password,
    required this.preferredOutput,
  });

  String get cleanBaseUrl {
    var value = baseUrl.trim();
    if (!value.startsWith('http://') && !value.startsWith('https://')) {
      value = 'http://$value';
    }
    return value.replaceAll(RegExp(r'/+$'), '');
  }

  String get encodedUsername => Uri.encodeComponent(username);

  String get encodedPassword => Uri.encodeComponent(password);

  factory IptvServer.fromJson(Map<String, dynamic> json, int index) {
    return IptvServer(
      id: _stringValue(json['id'], fallback: 'server-$index'),
      name: _stringValue(
        json['display_name'] ?? json['name'],
        fallback: '${AppLanguage.text('Servidor', 'Server')} ${index + 1}',
      ),
      baseUrl:
          _stringValue(json['url'] ?? json['baseUrl'] ?? json['server_url']),
      username: _stringValue(json['username']),
      password: _stringValue(json['password']),
      preferredOutput: _stringValue(json['preferred_output'], fallback: 'm3u8'),
    );
  }
}

class CategoryOption {
  final String id;
  final String label;

  const CategoryOption({required this.id, required this.label});
}

class IptvContentItem {
  final String id;
  final String epgChannelId;
  final String title;
  final String subtitle;
  final String category;
  final String categoryId;
  final String streamUrl;
  final List<String> alternateStreamUrls;
  final String imageUrl;
  final String type;
  final String? nextShowing;
  final String? rating;
  final String? year;
  final String description;
  final DateTime? eventStartDateTime;
  final bool liveEpgChecked;

  const IptvContentItem({
    required this.id,
    this.epgChannelId = '',
    required this.title,
    required this.subtitle,
    required this.category,
    required this.categoryId,
    required this.streamUrl,
    this.alternateStreamUrls = const [],
    required this.imageUrl,
    required this.type,
    this.nextShowing,
    this.rating,
    this.year,
    this.description = '',
    this.eventStartDateTime,
    this.liveEpgChecked = false,
  });
}

class IptvCatalog {
  final List<CategoryOption> categories;
  final List<IptvContentItem> items;

  const IptvCatalog({required this.categories, required this.items});
}

class IptvHomeCatalogs {
  final IptvServer server;
  final IptvCatalog live;
  final IptvCatalog movies;
  final IptvCatalog series;

  const IptvHomeCatalogs({
    required this.server,
    required this.live,
    required this.movies,
    required this.series,
  });
}

class ContinueWatchingItem {
  final IptvContentItem item;
  final Duration position;
  final Duration duration;

  const ContinueWatchingItem({
    required this.item,
    required this.position,
    required this.duration,
  });

  double get progress {
    if (duration <= Duration.zero) {
      return 0;
    }
    return (position.inMilliseconds / duration.inMilliseconds).clamp(0.0, 1.0);
  }
}

class IptvSeriesSeason {
  final String id;
  final String title;
  final List<IptvContentItem> episodes;

  const IptvSeriesSeason({
    required this.id,
    required this.title,
    required this.episodes,
  });
}

class IptvSeriesDetails {
  final IptvContentItem series;
  final String plot;
  final List<IptvSeriesSeason> seasons;

  const IptvSeriesDetails({
    required this.series,
    required this.plot,
    required this.seasons,
  });
}

class _LiveProgram {
  final String title;
  final DateTime? start;
  final DateTime? end;

  const _LiveProgram({
    required this.title,
    required this.start,
    required this.end,
  });
}

class _CentralEpgBatchResult {
  final bool success;
  final Map<String, Map<String, dynamic>> data;

  const _CentralEpgBatchResult({required this.success, required this.data});
}

class ApiService {
  static String get allServersUnavailableMessage => AppLanguage.text(
        'Servico indisponivel no momento. Tente novamente mais tarde ou entre em contato com o revendedor ou provedor do servico.',
        'The service is currently unavailable. Try again later or contact your reseller or service provider.',
      );
  static DateTime? _lastSessionRefreshAttemptAt;
  static DateTime? _loginRetryAfterUntil;
  static const Duration _requestTimeout = Duration(seconds: 15);
  static const Duration _loginTimeout = Duration(seconds: 30);
  static const Duration _sessionValidationTimeout = Duration(seconds: 12);
  static const Duration _providerStatusTimeout = Duration(seconds: 7);
  static const Duration _providerStatusDefaultInterval = Duration(days: 1);
  static const String _providerStatusNextCheckKey =
      'provider_license_status_next_check_at';
  static const String _providerStatusCodeKey = 'provider_license_status_code';
  static const String _authorizationNoticeKey = 'authorization_notice';
  static const String _appLoginLicenseCodeKey = 'app_login_license_code';
  static const String _appLoginUsernameKey = 'app_login_username';
  static const String _appLoginPasswordKey = 'app_login_password';
  static String get _authorizationDeniedMessage => AppLanguage.text(
        'Seu acesso nao esta autorizado. Entre em contato com o revendedor ou provedor do servico.',
        'Your access is not authorized. Contact your reseller or service provider.',
      );
  static final Map<String, Future<bool>> _providerStatusChecksInFlight = {};
  static final Map<String, Future<bool>> _deviceSessionChecksInFlight = {};
  static const Duration _liveNowNextCacheMaxAge = Duration(hours: 26);
  static const Duration _liveNowNextRefreshInterval = Duration(hours: 20);
  static const Duration _missingLiveEpgRefreshInterval = Duration(minutes: 30);
  static const String _parentalPinKey = 'parental_control_pin';
  static const String _adultContentBlockedKey = 'adult_content_blocked';
  static const String _defaultParentalPin = '1234';
  static const String _liveNowNextCachePrefix = 'live_now_next_epg_cache_v1';
  static const bool epgDiagnosticsEnabled = kDebugMode ||
      bool.fromEnvironment('EPG_DIAGNOSTICS', defaultValue: false);
  static final http.Client _epgHttpClient = http.Client();
  static final Map<String, Future<_CentralEpgBatchResult>> _centralEpgInFlight =
      {};
  static final Map<String, Future<void>> _centralEpgCacheWrites = {};

  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://orioplayer.com/api',
  );

  static String get appBaseUrl {
    return baseUrl.replaceFirst(RegExp(r'/api/?$'), '');
  }

  static Future<Map<String, dynamic>> loginApp({
    required String licenseCode,
    required String username,
    required String password,
    required String deviceId,
    required Map<String, dynamic> deviceInfo,
  }) async {
    final response = await http
        .post(
          Uri.parse('$baseUrl/v1/auth/app/login'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'licenseCode': licenseCode,
            'username': username,
            'password': password,
            'deviceId': deviceId,
            'deviceInfo': deviceInfo,
          }),
        )
        .timeout(_loginTimeout);

    final decoded = _decodeObject(response.body);
    if (response.statusCode == 200 &&
        decoded['success'] == true &&
        decoded['servers'] is List &&
        (decoded['servers'] as List).isNotEmpty) {
      await _saveSessionPayload(decoded);
      await _saveAppLoginCredentials(
        licenseCode: licenseCode,
        username: username,
        password: password,
      );

      return decoded;
    }

    throw Exception(
      decoded['error'] ??
          AppLanguage.text('Erro de autenticacao', 'Authentication error'),
    );
  }

  static Future<Map<String, dynamic>> requestTrial(
    String deviceId,
    Map<String, dynamic> deviceInfo,
  ) async {
    final response = await http
        .post(
          Uri.parse('$appBaseUrl/v1/auth/app/trial'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'deviceId': deviceId,
            'deviceInfo': deviceInfo,
          }),
        )
        .timeout(_requestTimeout);
    if (response.statusCode == 200) {
      return _decodeObject(response.body);
    }

    final errorData = _decodeObject(response.body);
    throw Exception(
      errorData['error'] ??
          AppLanguage.text(
            'Erro ao solicitar teste gratis',
            'Unable to request a free trial',
          ),
    );
  }

  static Future<IptvServer?> getActiveServer() async {
    final prefs = await SharedPreferences.getInstance();
    final rawServers = prefs.getString('servers_data');
    if (rawServers == null || rawServers.isEmpty) {
      return null;
    }

    final decoded = jsonDecode(rawServers);
    if (decoded is! List || decoded.isEmpty) {
      return null;
    }

    final servers = decoded
        .whereType<Map>()
        .map((item) => IptvServer.fromJson(Map<String, dynamic>.from(item), 0))
        .toList();

    if (servers.isEmpty) {
      return null;
    }

    final selectedUrl = prefs.getString('selected_server_url') ?? '';
    final selectedId = prefs.getString('selected_server_id') ?? '';

    if (selectedId.isNotEmpty) {
      for (final server in servers) {
        if (server.id == selectedId) {
          return server;
        }
      }
    }

    if (selectedUrl.isNotEmpty) {
      for (final server in servers) {
        if (server.cleanBaseUrl == _cleanBaseUrl(selectedUrl)) {
          return server;
        }
      }
    }

    return servers.first;
  }

  static Future<List<IptvServer>> getSavedServers() async {
    final prefs = await SharedPreferences.getInstance();
    final rawServers = prefs.getString('servers_data');
    if (rawServers == null || rawServers.isEmpty) {
      return [];
    }

    final decoded = jsonDecode(rawServers);
    if (decoded is! List || decoded.isEmpty) {
      return [];
    }

    return decoded
        .asMap()
        .entries
        .where((entry) => entry.value is Map)
        .map(
          (entry) => IptvServer.fromJson(
            Map<String, dynamic>.from(entry.value as Map),
            entry.key,
          ),
        )
        .toList();
  }

  static Future<void> selectActiveServer(IptvServer server) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('selected_server_id', server.id);
    await prefs.setString('selected_server_url', server.baseUrl);
    await prefs.setString('selected_server_name', server.name);
  }

  static Future<IptvHomeCatalogs> fetchHomeCatalogsWithFailover({
    String deviceId = '',
    bool refreshServersFirst = false,
  }) async {
    if (refreshServersFirst) {
      await _tryRefreshSavedSession(deviceId: deviceId);
    }

    var servers = await getSavedServers();
    if (servers.isEmpty) {
      await _tryRefreshSavedSession(deviceId: deviceId);
      servers = await getSavedServers();
    }
    if (servers.isEmpty) {
      throw Exception(
        AppLanguage.text(
          'Servidor nao configurado. Faca login novamente.',
          'Server not configured. Sign in again.',
        ),
      );
    }

    var triedRefreshAfterError = false;
    while (true) {
      final orderedServers = await _orderedServersForFailover(servers);
      for (final server in orderedServers) {
        if (!_hasRequiredServerCredentials(server)) {
          continue;
        }

        try {
          final liveCatalog = await _fetchLiveCatalogForServer(server);
          await selectActiveServer(server);
          final secondaryCatalogs = await Future.wait([
            _fetchCatalogOrEmpty(
              () => _fetchMoviesCatalogForServer(server),
              emptyLabel: AppLanguage.text('Todos os Filmes', 'All Movies'),
            ),
            _fetchCatalogOrEmpty(
              () => _fetchSeriesCatalogForServer(server),
              emptyLabel: AppLanguage.text('Todas as Series', 'All Series'),
            ),
          ]);
          return IptvHomeCatalogs(
            server: server,
            live: liveCatalog,
            movies: secondaryCatalogs[0],
            series: secondaryCatalogs[1],
          );
        } catch (_) {}
      }

      if (triedRefreshAfterError) {
        throw Exception(allServersUnavailableMessage);
      }

      triedRefreshAfterError = true;
      await _tryRefreshSavedSession(deviceId: deviceId);
      final refreshedServers = await getSavedServers();
      if (refreshedServers.isEmpty) {
        throw Exception(allServersUnavailableMessage);
      }
      servers = refreshedServers;
    }
  }

  static Future<IptvCatalog> _fetchCatalogOrEmpty(
    Future<IptvCatalog> Function() fetch, {
    required String emptyLabel,
  }) async {
    try {
      return await fetch();
    } catch (_) {
      return IptvCatalog(
        categories: [CategoryOption(id: 'todos', label: emptyLabel)],
        items: const [],
      );
    }
  }

  static Future<bool> refreshSavedSession({
    String deviceId = '',
    bool logoutOnRevoked = true,
    Duration? minInterval,
    http.Client? client,
  }) async {
    final normalizedDeviceId = _stringValue(deviceId);
    if (normalizedDeviceId.isEmpty) {
      return false;
    }

    final now = DateTime.now();
    if (minInterval != null &&
        _lastSessionRefreshAttemptAt != null &&
        now.difference(_lastSessionRefreshAttemptAt!) < minInterval) {
      return false;
    }
    _lastSessionRefreshAttemptAt = now;

    final prefs = await SharedPreferences.getInstance();
    final savedLogin = _savedAppLoginCredentials(prefs);
    final user = _savedUserData(prefs);
    final providerCode = _stringValue(
      user?['provider_code'] ??
          user?['providerCode'] ??
          _providerCodeFromJwt(prefs.getString('auth_token') ?? ''),
    );
    final isProvider = providerCode.isNotEmpty;
    var loginLicenseCode = savedLogin?.licenseCode ?? '';
    var loginUsername = savedLogin?.username ?? '';
    var loginPassword = savedLogin?.password ?? '';
    if (loginLicenseCode.isEmpty && isProvider) {
      final server = await getActiveServer();
      if (server != null && _hasRequiredServerCredentials(server)) {
        loginLicenseCode = providerCode;
        loginUsername = server.username;
        loginPassword = server.password;
      }
    }
    final usesAppLogin = loginLicenseCode.isNotEmpty &&
        loginUsername.isNotEmpty &&
        loginPassword.isNotEmpty;
    if (usesAppLogin &&
        _loginRetryAfterUntil != null &&
        now.isBefore(_loginRetryAfterUntil!)) {
      return false;
    }

    final uri = Uri.parse(usesAppLogin
        ? '$baseUrl/v1/auth/app/login'
        : '$appBaseUrl/v1/auth/app/device-login');
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (!usesAppLogin) 'X-Device-Id': normalizedDeviceId,
    };
    final body = jsonEncode(usesAppLogin
        ? {
            'licenseCode': loginLicenseCode,
            'username': loginUsername,
            'password': loginPassword,
            'deviceId': normalizedDeviceId,
          }
        : {'deviceId': normalizedDeviceId});

    final response = await (client == null
            ? http.post(uri, headers: headers, body: body)
            : client.post(uri, headers: headers, body: body))
        .timeout(usesAppLogin ? _loginTimeout : _sessionValidationTimeout);

    final decoded = _decodeObject(response.body);
    if (usesAppLogin && response.statusCode == 429) {
      final retryAfter = response.headers['retry-after'];
      final delaySeconds = int.tryParse(retryAfter ?? '');
      if (delaySeconds != null) {
        _loginRetryAfterUntil =
            DateTime.now().add(Duration(seconds: delaySeconds.clamp(1, 3600)));
      } else {
        try {
          _loginRetryAfterUntil = HttpDate.parse(retryAfter ?? '');
        } catch (_) {
          _loginRetryAfterUntil = null;
        }
      }
      return false;
    }
    if (response.statusCode == 200 &&
        decoded['success'] == true &&
        (!usesAppLogin ||
            (decoded['servers'] is List &&
                (decoded['servers'] as List).isNotEmpty))) {
      await _saveSessionPayload(decoded);
      if (usesAppLogin) {
        _loginRetryAfterUntil = null;
      }
      return true;
    }

    final code = _stringValue(decoded['code']);
    final error = _stringValue(decoded['error']);
    if (logoutOnRevoked &&
        _isSessionRevokedResponse(response.statusCode, code, error)) {
      await logout();
      final refreshedPrefs = await SharedPreferences.getInstance();
      await refreshedPrefs.setString(
        _authorizationNoticeKey,
        _authorizationDeniedMessage,
      );
    }
    return false;
  }

  static Future<void> _tryRefreshSavedSession({String deviceId = ''}) async {
    try {
      await refreshSavedSession(
        deviceId: deviceId,
        logoutOnRevoked: false,
      );
    } catch (_) {
      // Catalog failover can still use the last saved server list.
    }
  }

  static Future<IptvCatalog> fetchLiveCatalog() async {
    final server = await _requireActiveServer();
    return _fetchLiveCatalogForServer(server);
  }

  static Future<IptvCatalog> _fetchLiveCatalogForServer(
    IptvServer server,
  ) async {
    final categoriesData = await _fetchLiveProxy(server, 'categories');
    final categoryMap = _categoryNameMap(categoriesData);
    final categories = [
      CategoryOption(
        id: 'todos',
        label: AppLanguage.text('Todos os Canais', 'All Channels'),
      ),
      ..._mapCategories(categoriesData),
    ];

    final streamsData = await _fetchLiveProxy(server, 'streams');
    final items = streamsData.asMap().entries.map((entry) {
      final index = entry.key;
      final item = entry.value;
      final catId = _stringValue(item['category_id']);
      final catName =
          categoryMap[catId] ?? AppLanguage.text('Geral', 'General');
      final streamId = _stringValue(item['stream_id'] ?? item['id']);
      final ext = _stringValue(
        item['container_extension'],
        fallback: 'ts',
      );
      final cleanExt = ext.toLowerCase().replaceAll('.', '');
      var streamUrl = _stringValue(
        item['streamUrl'] ?? item['url'] ?? item['direct_source'],
      );
      final generatedUrls = <String>[];
      if (streamUrl.isEmpty && streamId.isNotEmpty) {
        streamUrl =
            '${server.cleanBaseUrl}/live/${server.encodedUsername}/${server.encodedPassword}/$streamId.$cleanExt';
        generatedUrls.add(streamUrl);
        for (final fallbackExt in ['ts', 'm3u8']) {
          if (fallbackExt != cleanExt) {
            generatedUrls.add(
              '${server.cleanBaseUrl}/live/${server.encodedUsername}/${server.encodedPassword}/$streamId.$fallbackExt',
            );
          }
        }
      }

      return IptvContentItem(
        id: streamId.isNotEmpty ? streamId : 'live-$index',
        epgChannelId: _stringValue(
          item['epg_channel_id'] ??
              item['epgChannelId'] ??
              item['epg_id'] ??
              item['xmltv_id'] ??
              item['tvguide_id'],
        ),
        title: _stringValue(
          item['name'] ?? item['stream_name'],
          fallback: AppLanguage.text('Canal sem Nome', 'Unnamed Channel'),
        ),
        subtitle: _formatProgramNow(item),
        category: catName,
        categoryId: catId,
        streamUrl: streamUrl,
        alternateStreamUrls:
            generatedUrls.where((url) => url != streamUrl).toList(),
        imageUrl: _imageUrl(item, server),
        type: 'live',
        description: _stringValue(
          item['description'] ?? item['plot'] ?? item['overview'],
        ),
        nextShowing: _formatProgramNext(item),
        eventStartDateTime: _eventStartDateTime(item),
      );
    }).toList();

    final cachedItems = await _applyCachedCentralLiveEpg(server, items);
    return IptvCatalog(categories: categories, items: cachedItems);
  }

  static Future<List<IptvContentItem>> fetchLiveEpgItems(
    List<IptvContentItem> items, {
    bool useXtreamFallback = true,
  }) async {
    if (items.isEmpty) {
      return const [];
    }
    final server = await _requireActiveServer();
    final cachedItems = await _applyCachedCentralLiveEpg(server, items);
    if (cachedItems.every((item) => item.liveEpgChecked)) {
      return cachedItems;
    }
    return _attachLiveEpg(
      server,
      cachedItems,
      useXtreamFallback: useXtreamFallback,
    );
  }

  static Future<({List<IptvContentItem> items, bool success})>
      refreshLiveEpgCache(
    List<IptvContentItem> items, {
    bool force = false,
  }) async {
    if (items.isEmpty) {
      return (items: <IptvContentItem>[], success: true);
    }

    final server = await _requireActiveServer();
    final cachedItems = await _applyCachedCentralLiveEpg(server, items);
    final pendingItems =
        cachedItems.where((item) => !item.liveEpgChecked).toList();
    if (!force &&
        pendingItems.isEmpty &&
        !await _shouldRefreshCentralLiveEpg(server)) {
      return (items: cachedItems, success: true);
    }

    final refreshItems =
        force || pendingItems.isEmpty ? cachedItems : pendingItems;
    final refreshed = await _attachCentralLiveEpg(server, refreshItems);
    final refreshedById = {
      for (final item in refreshed.items)
        item.id: refreshed.success && !item.liveEpgChecked
            ? _itemWithoutLiveEpg(item)
            : item,
    };
    return (
      items: [
        for (final item in cachedItems) refreshedById[item.id] ?? item,
      ],
      success: refreshed.success,
    );
  }

  static Future<IptvCatalog> fetchMoviesCatalog() async {
    final server = await _requireActiveServer();
    return _fetchMoviesCatalogForServer(server);
  }

  static Future<IptvCatalog> _fetchMoviesCatalogForServer(
    IptvServer server,
  ) async {
    final categoriesData = await _fetchXtream(server, 'get_vod_categories');
    final categoryMap = _categoryNameMap(categoriesData);
    final categories = [
      CategoryOption(
        id: 'todos',
        label: AppLanguage.text('Todos os Filmes', 'All Movies'),
      ),
      ..._mapCategories(categoriesData),
    ];

    final moviesData = await _fetchXtream(server, 'get_vod_streams');
    final items = moviesData.asMap().entries.map((entry) {
      final index = entry.key;
      final item = entry.value;
      final catId = _stringValue(item['category_id']);
      final streamId = _stringValue(item['stream_id'] ?? item['id']);
      final ext = _stringValue(item['container_extension'], fallback: 'mp4');
      var streamUrl = _stringValue(
        item['streamUrl'] ?? item['url'] ?? item['direct_source'],
      );
      if (streamUrl.isEmpty && streamId.isNotEmpty) {
        streamUrl =
            '${server.cleanBaseUrl}/movie/${server.encodedUsername}/${server.encodedPassword}/$streamId.$ext';
      }

      final year = _stringValue(item['year']).isNotEmpty
          ? _stringValue(item['year'])
          : _stringValue(item['release_date']).split('-').first;

      return IptvContentItem(
        id: streamId.isNotEmpty ? streamId : 'movie-$index',
        title: _stringValue(
          item['name'] ?? item['title'],
          fallback: AppLanguage.text('Filme sem Nome', 'Unnamed Movie'),
        ),
        subtitle: [
          if (year.isNotEmpty) year,
          _categoryName(categoryMap, catId),
        ].join(' - '),
        category: _categoryName(categoryMap, catId),
        categoryId: catId,
        streamUrl: streamUrl,
        imageUrl: _imageUrl(item, server),
        type: 'movie',
        rating: _rating(item),
        year: year.isNotEmpty ? year : null,
        description: _stringValue(
          item['plot'] ??
              item['description'] ??
              item['overview'] ??
              item['plot_long'],
        ),
      );
    }).toList();

    return IptvCatalog(categories: categories, items: items);
  }

  static Future<IptvContentItem> fetchMovieDetails(
    IptvContentItem movie,
  ) async {
    final server = await _requireActiveServer();
    final uri = Uri.parse(
      '${server.cleanBaseUrl}/player_api.php?username=${Uri.encodeQueryComponent(server.username)}&password=${Uri.encodeQueryComponent(server.password)}&action=get_vod_info&vod_id=${Uri.encodeQueryComponent(movie.id)}',
    );
    final response = await http.get(
      uri,
      headers: const {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'IPTVSmartersPro/1.0 (Linux; Android 10)',
      },
    ).timeout(_requestTimeout);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(
        '${AppLanguage.text('Servidor Xtream retornou HTTP', 'Xtream server returned HTTP')} ${response.statusCode}.',
      );
    }

    final decoded = _decodeObject(response.body);
    final rawInfo = decoded['info'];
    final rawMovieData = decoded['movie_data'];
    final info = rawInfo is Map
        ? Map<String, dynamic>.from(rawInfo)
        : <String, dynamic>{};
    final movieData = rawMovieData is Map
        ? Map<String, dynamic>.from(rawMovieData)
        : <String, dynamic>{};
    final merged = <String, dynamic>{
      ...decoded,
      ...movieData,
      ...info,
    };
    final imageUrl = _imageUrl(merged, server);
    final rating = _rating(merged);
    final description = _firstNonEmptyString([
      info['plot'],
      info['description'],
      info['overview'],
      info['plot_long'],
      info['movie_description'],
      info['o_description'],
      movieData['plot'],
      movieData['description'],
      movieData['overview'],
      movieData['plot_long'],
      decoded['plot'],
      decoded['description'],
      decoded['overview'],
      decoded['plot_long'],
      movie.description,
    ]);

    final year = _stringValue(info['releasedate']).isNotEmpty
        ? _stringValue(info['releasedate']).split('-').first
        : _stringValue(info['release_date']).isNotEmpty
            ? _stringValue(info['release_date']).split('-').first
            : _stringValue(info['year'], fallback: movie.year ?? '');
    final ext = _stringValue(
      movieData['container_extension'] ?? info['container_extension'],
      fallback: 'mp4',
    );
    var streamUrl = _stringValue(
      movieData['streamUrl'] ??
          movieData['url'] ??
          movieData['direct_source'] ??
          info['streamUrl'] ??
          info['url'] ??
          info['direct_source'],
      fallback: movie.streamUrl,
    );
    if (streamUrl.isEmpty && movie.id.isNotEmpty) {
      streamUrl =
          '${server.cleanBaseUrl}/movie/${server.encodedUsername}/${server.encodedPassword}/${movie.id}.$ext';
    }

    return IptvContentItem(
      id: movie.id,
      epgChannelId: movie.epgChannelId,
      title: _stringValue(
        movieData['name'] ??
            info['name'] ??
            movieData['title'] ??
            info['title'],
        fallback: movie.title,
      ),
      subtitle: [
        if (year.isNotEmpty) year,
        movie.category,
      ].join(' - '),
      category: movie.category,
      categoryId: movie.categoryId,
      streamUrl: streamUrl,
      alternateStreamUrls: movie.alternateStreamUrls,
      imageUrl: imageUrl.isNotEmpty ? imageUrl : movie.imageUrl,
      type: movie.type,
      rating: rating.isNotEmpty ? rating : movie.rating,
      year: year.isNotEmpty ? year : movie.year,
      description: description,
    );
  }

  static Future<IptvCatalog> fetchSeriesCatalog() async {
    final server = await _requireActiveServer();
    return _fetchSeriesCatalogForServer(server);
  }

  static Future<IptvCatalog> _fetchSeriesCatalogForServer(
    IptvServer server,
  ) async {
    final categoriesData = await _fetchXtream(server, 'get_series_categories');
    final categoryMap = _categoryNameMap(categoriesData);
    final categories = [
      CategoryOption(
        id: 'todos',
        label: AppLanguage.text('Todas as Series', 'All Series'),
      ),
      ..._mapCategories(categoriesData),
    ];

    final seriesData = await _fetchXtream(server, 'get_series');
    final items = seriesData.asMap().entries.map((entry) {
      final index = entry.key;
      final item = entry.value;
      final catId = _stringValue(item['category_id']);
      final seriesId = _stringValue(item['series_id'] ?? item['id']);
      final year = _stringValue(item['releaseDate']).isNotEmpty
          ? _stringValue(item['releaseDate']).split('-').first
          : _stringValue(item['release_date']).isNotEmpty
              ? _stringValue(item['release_date']).split('-').first
              : _stringValue(item['year']);

      return IptvContentItem(
        id: seriesId.isNotEmpty ? seriesId : 'series-$index',
        title: _stringValue(
          item['name'] ?? item['title'],
          fallback: AppLanguage.text('Serie sem Nome', 'Unnamed Series'),
        ),
        subtitle: [
          if (year.isNotEmpty) year,
          _categoryName(categoryMap, catId),
        ].join(' - '),
        category: _categoryName(categoryMap, catId),
        categoryId: catId,
        streamUrl: '',
        imageUrl: _imageUrl(item, server),
        type: 'series',
        rating: _rating(item),
        year: year.isNotEmpty ? year : null,
        description: _stringValue(
          item['plot'] ?? item['description'] ?? item['overview'],
        ),
      );
    }).toList();

    return IptvCatalog(categories: categories, items: items);
  }

  static Future<IptvContentItem> fetchFirstSeriesEpisode(
    IptvContentItem series,
  ) async {
    final details = await fetchSeriesDetails(series);
    for (final season in details.seasons) {
      if (season.episodes.isNotEmpty) {
        return season.episodes.first;
      }
    }

    throw Exception(
      AppLanguage.text(
        'Nenhum episodio encontrado para esta serie.',
        'No episodes were found for this series.',
      ),
    );
  }

  static Future<IptvSeriesDetails> fetchSeriesDetails(
    IptvContentItem series,
  ) async {
    final server = await _requireActiveServer();
    final uri = Uri.parse(
      '${server.cleanBaseUrl}/player_api.php?username=${Uri.encodeQueryComponent(server.username)}&password=${Uri.encodeQueryComponent(server.password)}&action=get_series_info&series_id=${Uri.encodeQueryComponent(series.id)}',
    );
    final response = await http.get(
      uri,
      headers: const {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'IPTVSmartersPro/1.0 (Linux; Android 10)',
      },
    ).timeout(_requestTimeout);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(
        '${AppLanguage.text('Servidor Xtream retornou HTTP', 'Xtream server returned HTTP')} ${response.statusCode}.',
      );
    }

    final decoded = _decodeObject(response.body);
    final episodes = decoded['episodes'];
    if (episodes is! Map || episodes.isEmpty) {
      throw Exception(
        AppLanguage.text(
          'Nenhum episodio encontrado para esta serie.',
          'No episodes were found for this series.',
        ),
      );
    }

    final seasons = <IptvSeriesSeason>[];
    final sortedEntries = episodes.entries.toList()
      ..sort(
          (a, b) => _seasonSortValue(a.key).compareTo(_seasonSortValue(b.key)));

    for (final entry in sortedEntries) {
      final rawSeason = entry.value;
      if (rawSeason is! List) {
        continue;
      }

      final seasonId = _stringValue(entry.key);
      final seasonNumber = _seasonSortValue(entry.key);
      final sortedEpisodes = rawSeason.whereType<Map>().toList()
        ..sort((a, b) => _episodeSortValue(a).compareTo(_episodeSortValue(b)));

      final seasonEpisodes = sortedEpisodes
          .map((item) => _seriesEpisodeFromJson(
                series: series,
                server: server,
                seasonId: seasonId,
                seasonNumber: seasonNumber,
                json: Map<String, dynamic>.from(item),
              ))
          .where((episode) => episode.streamUrl.isNotEmpty)
          .toList();

      if (seasonEpisodes.isNotEmpty) {
        seasons.add(
          IptvSeriesSeason(
            id: seasonId.isNotEmpty ? seasonId : '${seasons.length + 1}',
            title: seasonNumber > 0
                ? '${AppLanguage.text('Temporada', 'Season')} $seasonNumber'
                : '${AppLanguage.text('Temporada', 'Season')} ${seasons.length + 1}',
            episodes: seasonEpisodes,
          ),
        );
      }
    }

    if (seasons.isEmpty) {
      throw Exception(
        AppLanguage.text(
          'Nenhum episodio encontrado para esta serie.',
          'No episodes were found for this series.',
        ),
      );
    }

    final info = decoded['info'] is Map
        ? Map<String, dynamic>.from(decoded['info'] as Map)
        : <String, dynamic>{};

    return IptvSeriesDetails(
      series: series,
      plot: _stringValue(info['plot'] ?? info['description']),
      seasons: seasons,
    );
  }

  static IptvContentItem _seriesEpisodeFromJson({
    required IptvContentItem series,
    required IptvServer server,
    required String seasonId,
    required int seasonNumber,
    required Map<String, dynamic> json,
  }) {
    final episodeId = _stringValue(json['id'] ?? json['episode_id']);
    final ext = _stringValue(json['container_extension'], fallback: 'mp4');
    var streamUrl = _stringValue(
      json['streamUrl'] ?? json['url'] ?? json['direct_source'],
    );
    if (streamUrl.isEmpty && episodeId.isNotEmpty) {
      streamUrl =
          '${server.cleanBaseUrl}/series/${server.encodedUsername}/${server.encodedPassword}/$episodeId.$ext';
    }

    final episodeTitle = _stringValue(
      json['title'] ?? json['name'],
      fallback: AppLanguage.text('Episodio', 'Episode'),
    );
    final episodeNum = _stringValue(json['episode_num'] ?? json['episode']);
    final seasonLabel = seasonNumber > 0
        ? '${AppLanguage.text('T', 'S')}$seasonNumber'
        : AppLanguage.text('Temporada', 'Season');
    final episodeLabel = episodeNum.isNotEmpty ? 'E$episodeNum' : '';
    final prefix =
        [seasonLabel, episodeLabel].where((part) => part.isNotEmpty).join(' ');

    return IptvContentItem(
      id: episodeId.isNotEmpty
          ? episodeId
          : '${series.id}-$seasonId-$episodeTitle',
      title: episodeTitle,
      subtitle: prefix.isNotEmpty ? prefix : series.title,
      category: series.category,
      categoryId: series.categoryId,
      streamUrl: streamUrl,
      imageUrl: series.imageUrl,
      type: 'episode',
      rating: series.rating,
      year: series.year,
      description: series.description,
    );
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('user_data');
    await prefs.remove('license_data');
    await prefs.remove('servers_data');
    await prefs.remove('selected_server_id');
    await prefs.remove('selected_server_url');
    await prefs.remove('selected_server_name');
    await prefs.remove(_continueWatchingKey);
    await prefs.remove(_providerStatusNextCheckKey);
    await prefs.remove(_providerStatusCodeKey);
    await prefs.remove(_authorizationNoticeKey);
    await prefs.remove(_appLoginLicenseCodeKey);
    await prefs.remove(_appLoginUsernameKey);
    await prefs.remove(_appLoginPasswordKey);
    AppLanguage.setPreferredLanguage(null);
  }

  static Future<String?> consumeAuthorizationNotice() async {
    final prefs = await SharedPreferences.getInstance();
    final notice = prefs.getString(_authorizationNoticeKey);
    if (notice != null) {
      await prefs.remove(_authorizationNoticeKey);
    }
    return notice;
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  static Future<
          ({DateTime? expiresAt, String preferredLanguage, String accountType})>
      getSavedLicenseDisplayInfo() async {
    final prefs = await SharedPreferences.getInstance();
    final license = _savedLicenseData(prefs);
    final user = _savedUserData(prefs);
    final preferredLanguage =
        _stringValue(user?['preferred_language']).toLowerCase();
    final accountType = _stringValue(user?['account_type']).toUpperCase();
    final expiresAt = license == null ? null : _sessionExpiryDate(license);
    return (
      expiresAt: expiresAt ?? (user == null ? null : _sessionExpiryDate(user)),
      preferredLanguage: preferredLanguage.startsWith('en') ? 'en' : 'pt',
      accountType: accountType,
    );
  }

  static Future<bool> hasSavedSession() async {
    return isSavedSessionLocallyValid();
  }

  static Future<bool> isSavedSessionLocallyValid() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token') ?? '';
    final servers = prefs.getString('servers_data') ?? '';
    if (token.isEmpty && servers.isEmpty) {
      return false;
    }

    final license = _savedLicenseData(prefs);
    if (license == null) {
      return true;
    }

    if (!_isLicensePayloadActive(license)) {
      await logout();
      return false;
    }

    return true;
  }

  static Future<bool> validateSavedSession({
    String? deviceId,
    bool revalidateWithServer = false,
    http.Client? client,
  }) async {
    final localValid = await isSavedSessionLocallyValid();
    if (!localValid) {
      return false;
    }

    if (revalidateWithServer) {
      final prefs = await SharedPreferences.getInstance();
      final user = _savedUserData(prefs);
      final providerCode = _stringValue(
        user?['provider_code'] ??
            user?['providerCode'] ??
            _providerCodeFromJwt(prefs.getString('auth_token') ?? ''),
      );
      if (providerCode.isNotEmpty) {
        return _validateProviderStatus(
          providerCode,
          deviceId: _stringValue(deviceId),
          client: client,
        );
      }
      if (_savedAppLoginCredentials(prefs) != null) {
        return true;
      }
    }

    if (!revalidateWithServer ||
        _stringValue(deviceId).isEmpty ||
        !await _shouldRevalidateWithDeviceLogin()) {
      return true;
    }

    final normalizedDeviceId = _stringValue(deviceId);
    final existing = _deviceSessionChecksInFlight[normalizedDeviceId];
    if (existing != null) {
      return existing;
    }

    final check = _validateWithDeviceLogin(
      normalizedDeviceId,
      client: client,
    );
    _deviceSessionChecksInFlight[normalizedDeviceId] = check;
    try {
      return await check;
    } finally {
      if (identical(_deviceSessionChecksInFlight[normalizedDeviceId], check)) {
        _deviceSessionChecksInFlight.remove(normalizedDeviceId);
      }
    }
  }

  static Future<bool> _validateWithDeviceLogin(
    String deviceId, {
    http.Client? client,
  }) async {
    try {
      final request = client == null
          ? http.post(
              Uri.parse('$appBaseUrl/v1/auth/app/device-login'),
              headers: {
                'Content-Type': 'application/json',
                'X-Device-Id': deviceId,
              },
              body: jsonEncode({'deviceId': deviceId}),
            )
          : client.post(
              Uri.parse('$appBaseUrl/v1/auth/app/device-login'),
              headers: {
                'Content-Type': 'application/json',
                'X-Device-Id': deviceId,
              },
              body: jsonEncode({'deviceId': deviceId}),
            );
      final response = await request.timeout(_sessionValidationTimeout);

      final decoded = _decodeObject(response.body);
      if (response.statusCode == 200 && decoded['success'] == true) {
        await _saveSessionPayload(decoded);
        return isSavedSessionLocallyValid();
      }

      final code = _stringValue(decoded['code']);
      final error = _stringValue(decoded['error']);
      if (response.statusCode == 401 ||
          response.statusCode == 403 ||
          code == 'DEVICE_NOT_LINKED' ||
          code == 'DEVICE_AMBIGUOUS' ||
          code == 'LICENSE_EXPIRED' ||
          error.toLowerCase().contains('licença expirada') ||
          error.toLowerCase().contains('licenca expirada') ||
          error.toLowerCase().contains('bloqueada') ||
          error.toLowerCase().contains('inativa') ||
          error.toLowerCase().contains('cancelada')) {
        await logout();
        return false;
      }

      return isSavedSessionLocallyValid();
    } catch (_) {
      return isSavedSessionLocallyValid();
    }
  }

  static Future<bool> _validateProviderStatus(
    String providerCode, {
    required String deviceId,
    http.Client? client,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token') ?? '';

    final nextCheckAt = prefs.getInt(_providerStatusNextCheckKey) ?? 0;
    if (token.isNotEmpty &&
        token != 'authenticated' &&
        prefs.getString(_providerStatusCodeKey) == providerCode &&
        nextCheckAt > DateTime.now().millisecondsSinceEpoch) {
      return true;
    }

    final key = jsonEncode([providerCode, token]);
    final existing = _providerStatusChecksInFlight[key];
    if (existing != null) {
      return existing;
    }

    final check = _performProviderStatusCheck(
      providerCode,
      token,
      deviceId: deviceId,
      client: client,
    );
    _providerStatusChecksInFlight[key] = check;
    try {
      return await check;
    } finally {
      if (identical(_providerStatusChecksInFlight[key], check)) {
        _providerStatusChecksInFlight.remove(key);
      }
    }
  }

  static String _providerCodeFromJwt(String token) {
    final parts = token.split('.');
    if (parts.length != 3) {
      return '';
    }
    try {
      final payload = jsonDecode(
        utf8.decode(base64Url.decode(base64Url.normalize(parts[1]))),
      );
      if (payload is! Map) {
        return '';
      }
      return _stringValue(payload['providerCode'] ?? payload['provider_code']);
    } catch (_) {
      return '';
    }
  }

  static Future<bool> _performProviderStatusCheck(
    String providerCode,
    String savedToken, {
    required String deviceId,
    http.Client? client,
  }) async {
    var token = savedToken;
    try {
      if (token.isEmpty || token == 'authenticated' || _isExpiredJwt(token)) {
        final renewed = await _renewProviderToken(
          providerCode,
          token,
          deviceId: deviceId,
          client: client,
        );
        if (renewed.denied) {
          return _revokeProviderAccessIfCurrent(token);
        }
        if (renewed.token == null) {
          return true;
        }
        token = renewed.token!;
      }

      var response = await _requestProviderStatus(
        providerCode,
        token,
        client: client,
      );
      if (response.statusCode == 401 && token == savedToken) {
        final renewed = await _renewProviderToken(
          providerCode,
          token,
          deviceId: deviceId,
          client: client,
        );
        if (renewed.denied) {
          return _revokeProviderAccessIfCurrent(token);
        }
        if (renewed.token == null) {
          return true;
        }
        token = renewed.token!;
        response = await _requestProviderStatus(
          providerCode,
          token,
          client: client,
        );
      }

      final prefs = await SharedPreferences.getInstance();
      if (prefs.getString('auth_token') != token) {
        return isSavedSessionLocallyValid();
      }

      final decoded = _decodeObject(response.body);
      if (decoded['access_allowed'] == false || response.statusCode == 403) {
        return _revokeProviderAccessIfCurrent(token);
      }

      if (response.statusCode == 200 && decoded['access_allowed'] == true) {
        final requestedSeconds = _intValue(decoded['next_check_seconds']);
        final intervalSeconds = requestedSeconds > 0
            ? requestedSeconds.clamp(300, 86400)
            : _providerStatusDefaultInterval.inSeconds;
        await prefs.setString(_providerStatusCodeKey, providerCode);
        await prefs.setInt(
          _providerStatusNextCheckKey,
          DateTime.now()
              .add(Duration(seconds: intervalSeconds))
              .millisecondsSinceEpoch,
        );
      }
      return true;
    } catch (_) {
      return true; // Offline/5xx is not evidence that access was revoked.
    }
  }

  static Future<bool> _revokeProviderAccessIfCurrent(String token) async {
    final prefs = await SharedPreferences.getInstance();
    if (prefs.getString('auth_token') != token) {
      return isSavedSessionLocallyValid();
    }
    await logout();
    await prefs.setString(_authorizationNoticeKey, _authorizationDeniedMessage);
    return false;
  }

  static Future<http.Response> _requestProviderStatus(
    String providerCode,
    String token, {
    http.Client? client,
  }) {
    final request = client == null
        ? http.post(
            Uri.parse('$baseUrl/v1/provider/license/status'),
            headers: {
              'Authorization': 'Bearer $token',
              'Content-Type': 'application/json',
            },
            body: jsonEncode({'providerCode': providerCode}),
          )
        : client.post(
            Uri.parse('$baseUrl/v1/provider/license/status'),
            headers: {
              'Authorization': 'Bearer $token',
              'Content-Type': 'application/json',
            },
            body: jsonEncode({'providerCode': providerCode}),
          );
    return request.timeout(_providerStatusTimeout);
  }

  static Future<({String? token, bool denied})> _renewProviderToken(
    String providerCode,
    String oldToken, {
    required String deviceId,
    http.Client? client,
  }) async {
    if (deviceId.isEmpty) {
      return (token: null, denied: false);
    }
    final prefs = await SharedPreferences.getInstance();
    final savedLogin = _savedAppLoginCredentials(prefs);
    final server = savedLogin == null ? await getActiveServer() : null;
    final username = savedLogin?.username ?? server?.username ?? '';
    final password = savedLogin?.password ?? server?.password ?? '';
    final licenseCode = savedLogin?.licenseCode ?? providerCode;
    if (licenseCode.isEmpty || username.isEmpty || password.isEmpty) {
      return (token: null, denied: false);
    }

    final uri = Uri.parse('$baseUrl/v1/auth/app/login');
    final body = jsonEncode({
      'licenseCode': licenseCode,
      'username': username,
      'password': password,
      'deviceId': deviceId,
    });
    final request = client == null
        ? http.post(
            uri,
            headers: {'Content-Type': 'application/json'},
            body: body,
          )
        : client.post(
            uri,
            headers: {'Content-Type': 'application/json'},
            body: body,
          );
    final response = await request.timeout(_sessionValidationTimeout);
    if (response.statusCode != 200) {
      Map<String, dynamic> decoded;
      try {
        decoded = _decodeObject(response.body);
      } catch (_) {
        return (token: null, denied: false);
      }
      final error = _stringValue(decoded['error']).toLowerCase();
      final denied = decoded['access_allowed'] == false ||
          response.statusCode == 403 ||
          error.contains('não reconhecido') ||
          error.contains('provedor bloqueado') ||
          error.contains('provedor inativo');
      return (token: null, denied: denied);
    }
    final decoded = _decodeObject(response.body);
    final newToken = _stringValue(
      decoded['token'] ??
          decoded['authToken'] ??
          decoded['access_token'] ??
          decoded['sessionToken'],
    );
    if (decoded['success'] != true || newToken.isEmpty) {
      return (token: null, denied: false);
    }

    if (prefs.getString('auth_token') != oldToken) {
      return (token: null, denied: false);
    }
    await _saveSessionPayload(decoded);
    return (token: newToken, denied: false);
  }

  static Future<void> _saveSessionPayload(Map<String, dynamic> decoded) async {
    final prefs = await SharedPreferences.getInstance();

    if (decoded['user'] != null) {
      AppLanguage.updateFromLoginResponse(decoded);
      await prefs.setString('user_data', jsonEncode(decoded['user']));
    }

    if (decoded['license'] != null) {
      await prefs.setString('license_data', jsonEncode(decoded['license']));
    }

    if (decoded['servers'] != null) {
      await prefs.setString('servers_data', jsonEncode(decoded['servers']));
      final servers = await getSavedServers();
      if (servers.isNotEmpty) {
        final selected = decoded['selected_server'];
        IptvServer? target;
        if (selected is Map) {
          final selectedId = _stringValue(selected['id']);
          final rawSelectedUrl =
              _stringValue(selected['url'] ?? selected['server_url']);
          final selectedUrl =
              rawSelectedUrl.isEmpty ? '' : _cleanBaseUrl(rawSelectedUrl);
          for (final server in servers) {
            if ((selectedId.isNotEmpty && server.id == selectedId) ||
                (selectedUrl.isNotEmpty &&
                    server.cleanBaseUrl == selectedUrl)) {
              target = server;
              break;
            }
          }
        }
        target ??= await getActiveServer();
        await selectActiveServer(target ?? servers.first);
      }
    }

    final token = _stringValue(
      decoded['token'] ??
          decoded['authToken'] ??
          decoded['access_token'] ??
          decoded['sessionToken'],
    );
    await prefs.setString(
      'auth_token',
      token.isNotEmpty ? token : 'authenticated',
    );
  }

  static Future<void> _saveAppLoginCredentials({
    required String licenseCode,
    required String username,
    required String password,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_appLoginLicenseCodeKey, licenseCode.trim());
    await prefs.setString(_appLoginUsernameKey, username.trim());
    await prefs.setString(_appLoginPasswordKey, password);
  }

  static ({String licenseCode, String username, String password})?
      _savedAppLoginCredentials(SharedPreferences prefs) {
    final licenseCode = prefs.getString(_appLoginLicenseCodeKey)?.trim() ?? '';
    final username = prefs.getString(_appLoginUsernameKey)?.trim() ?? '';
    final password = prefs.getString(_appLoginPasswordKey) ?? '';
    if (licenseCode.isEmpty || username.isEmpty || password.isEmpty) {
      return null;
    }
    return (
      licenseCode: licenseCode,
      username: username,
      password: password,
    );
  }

  static Map<String, dynamic>? _savedLicenseData(SharedPreferences prefs) {
    final rawLicense = prefs.getString('license_data') ?? '';
    if (rawLicense.isEmpty) {
      return null;
    }
    try {
      final decoded = jsonDecode(rawLicense);
      if (decoded is Map<String, dynamic>) {
        return decoded;
      }
      if (decoded is Map) {
        return Map<String, dynamic>.from(decoded);
      }
    } catch (_) {
      return null;
    }
    return null;
  }

  static Map<String, dynamic>? _savedUserData(SharedPreferences prefs) {
    final rawUser = prefs.getString('user_data') ?? '';
    if (rawUser.isEmpty) {
      return null;
    }
    try {
      final decoded = jsonDecode(rawUser);
      if (decoded is Map<String, dynamic>) {
        return decoded;
      }
      if (decoded is Map) {
        return Map<String, dynamic>.from(decoded);
      }
    } catch (_) {
      return null;
    }
    return null;
  }

  static Future<bool> _shouldRevalidateWithDeviceLogin() async {
    final prefs = await SharedPreferences.getInstance();
    final user = _savedUserData(prefs);
    final license = _savedLicenseData(prefs);

    final role = _stringValue(user?['role']).toUpperCase();
    final providerCode = _stringValue(
      user?['provider_code'] ?? user?['providerCode'],
    );
    if (role == 'PROVIDER' || providerCode.isNotEmpty) {
      return false;
    }

    return license != null && _sessionExpiryDate(license) != null;
  }

  static bool _isSessionRevokedResponse(
    int statusCode,
    String code,
    String error,
  ) {
    final lowerError = error.toLowerCase();
    return statusCode == 401 ||
        statusCode == 403 ||
        code == 'DEVICE_NOT_LINKED' ||
        code == 'DEVICE_AMBIGUOUS' ||
        code == 'LICENSE_EXPIRED' ||
        (lowerError.contains('licen') && lowerError.contains('expirada')) ||
        lowerError.contains('bloqueada') ||
        lowerError.contains('inativa') ||
        lowerError.contains('cancelada');
  }

  static bool _isLicensePayloadActive(Map<String, dynamic> license) {
    final status = _stringValue(license['status']).toUpperCase();
    if (status.isNotEmpty && !const {'ACTIVE', 'TRIAL'}.contains(status)) {
      return false;
    }

    final expiresAt = _sessionExpiryDate(license);
    if (expiresAt == null) {
      return true;
    }

    return expiresAt.isAfter(DateTime.now());
  }

  static DateTime? _sessionExpiryDate(Map<String, dynamic> license) {
    for (final key in [
      'expires_at',
      'valid_until',
      'validUntil',
      'expiresAt',
    ]) {
      final value = _stringValue(license[key]);
      if (value.isEmpty) {
        continue;
      }
      final parsed = DateTime.tryParse(value.replaceFirst(' ', 'T'));
      if (parsed != null) {
        return parsed.toLocal();
      }
    }
    return null;
  }

  static Future<bool> isAdultContentBlocked() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_adultContentBlockedKey) ?? true;
  }

  static Future<void> setAdultContentBlocked(bool blocked) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_adultContentBlockedKey, blocked);
  }

  static Future<bool> validateParentalPin(String pin) async {
    final prefs = await SharedPreferences.getInstance();
    final savedPin = prefs.getString(_parentalPinKey) ?? _defaultParentalPin;
    return pin == savedPin;
  }

  static Future<void> changeParentalPin(String pin) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_parentalPinKey, pin);
  }

  static String playbackContentId(IptvContentItem item) {
    return '${item.type}:${item.id}';
  }

  static String _playbackPositionKey(String contentId) {
    return 'playback_position_ms_$contentId';
  }

  static String _playbackDurationKey(String contentId) {
    return 'playback_duration_ms_$contentId';
  }

  static const String _continueWatchingKey = 'continue_watching_items';

  static String _contentItemIdFromPlaybackId(String contentId) {
    final separator = contentId.indexOf(':');
    if (separator < 0 || separator == contentId.length - 1) {
      return contentId;
    }
    return contentId.substring(separator + 1);
  }

  static Future<List<Map<String, dynamic>>> _readContinueWatchingRaw(
    SharedPreferences prefs,
  ) async {
    final rawList = prefs.getStringList(_continueWatchingKey) ?? [];
    return rawList
        .map((raw) {
          try {
            final decoded = jsonDecode(raw);
            if (decoded is Map) {
              return Map<String, dynamic>.from(decoded);
            }
          } catch (_) {
            return null;
          }
          return null;
        })
        .whereType<Map<String, dynamic>>()
        .toList();
  }

  static Future<List<ContinueWatchingItem>> getContinueWatchingItems() async {
    final prefs = await SharedPreferences.getInstance();
    final rawItems = await _readContinueWatchingRaw(prefs);

    final items = <ContinueWatchingItem>[];
    for (final raw in rawItems) {
      final contentId = _stringValue(raw['contentId']);
      final positionMs = prefs.getInt(_playbackPositionKey(contentId)) ??
          int.tryParse('${raw['positionMs'] ?? 0}') ??
          0;
      final durationMs = prefs.getInt(_playbackDurationKey(contentId)) ??
          int.tryParse('${raw['durationMs'] ?? 0}') ??
          0;

      if (contentId.isEmpty ||
          positionMs < const Duration(seconds: 30).inMilliseconds ||
          (durationMs > 0 && positionMs / durationMs >= 0.95)) {
        continue;
      }

      final streamUrl = _stringValue(raw['streamUrl']);
      if (streamUrl.isEmpty) {
        continue;
      }

      items.add(
        ContinueWatchingItem(
          item: IptvContentItem(
            id: _contentItemIdFromPlaybackId(contentId),
            title: _stringValue(
              raw['title'],
              fallback: AppLanguage.text(
                'Continuar assistindo',
                'Continue watching',
              ),
            ),
            subtitle: _stringValue(raw['subtitle']),
            category: _stringValue(raw['category']),
            categoryId: _stringValue(raw['categoryId']),
            streamUrl: streamUrl,
            alternateStreamUrls: (raw['alternateStreamUrls'] is List)
                ? (raw['alternateStreamUrls'] as List)
                    .map((item) => item.toString())
                    .where((item) => item.isNotEmpty)
                    .toList()
                : const [],
            imageUrl: _stringValue(raw['imageUrl']),
            type: _stringValue(raw['type'], fallback: 'movie'),
            description: _stringValue(raw['description']),
          ),
          position: Duration(milliseconds: positionMs),
          duration: Duration(milliseconds: durationMs),
        ),
      );
    }

    return items;
  }

  static Future<Duration?> getSavedPlaybackPosition(String contentId) async {
    if (contentId.isEmpty) {
      return null;
    }

    final prefs = await SharedPreferences.getInstance();
    final positionMs = prefs.getInt(_playbackPositionKey(contentId)) ?? 0;
    if (positionMs < const Duration(seconds: 30).inMilliseconds) {
      return null;
    }

    return Duration(milliseconds: positionMs);
  }

  static Future<void> savePlaybackProgress({
    required String contentId,
    required Duration position,
    required Duration duration,
    String title = '',
    String subtitle = '',
    String category = '',
    String categoryId = '',
    String streamUrl = '',
    List<String> alternateStreamUrls = const [],
    String imageUrl = '',
    String type = '',
    String description = '',
  }) async {
    if (contentId.isEmpty) {
      return;
    }

    final prefs = await SharedPreferences.getInstance();
    final positionMs = position.inMilliseconds;
    final durationMs = duration.inMilliseconds;

    final isTooEarly = position < const Duration(seconds: 30);
    final isNearEnd = duration > Duration.zero &&
        (duration - position) < const Duration(minutes: 2);
    final watchedAlmostAll = durationMs > 0 && positionMs / durationMs >= 0.95;

    if (isTooEarly || isNearEnd || watchedAlmostAll) {
      await clearPlaybackProgress(contentId);
      return;
    }

    await prefs.setInt(_playbackPositionKey(contentId), positionMs);
    await prefs.setInt(_playbackDurationKey(contentId), durationMs);

    if (streamUrl.isNotEmpty && title.isNotEmpty) {
      final items = await _readContinueWatchingRaw(prefs);
      items.removeWhere((item) => _stringValue(item['contentId']) == contentId);
      items.insert(0, {
        'contentId': contentId,
        'title': title,
        'subtitle': subtitle,
        'category': category,
        'categoryId': categoryId,
        'streamUrl': streamUrl,
        'alternateStreamUrls': alternateStreamUrls,
        'imageUrl': imageUrl,
        'type': type,
        'description': description,
        'positionMs': positionMs,
        'durationMs': durationMs,
        'updatedAt': DateTime.now().millisecondsSinceEpoch,
      });
      await prefs.setStringList(
        _continueWatchingKey,
        items.take(30).map(jsonEncode).toList(),
      );
    }
  }

  static Future<void> clearPlaybackProgress(String contentId) async {
    if (contentId.isEmpty) {
      return;
    }

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_playbackPositionKey(contentId));
    await prefs.remove(_playbackDurationKey(contentId));
    final items = await _readContinueWatchingRaw(prefs);
    items.removeWhere((item) => _stringValue(item['contentId']) == contentId);
    await prefs.setStringList(
      _continueWatchingKey,
      items.map(jsonEncode).toList(),
    );
  }

  static Future<bool> isFavorite(String favoriteId) async {
    if (favoriteId.isEmpty) {
      return false;
    }

    final prefs = await SharedPreferences.getInstance();
    final favorites = prefs.getStringList('favorites') ?? [];
    return favorites.contains(favoriteId);
  }

  static Future<Set<String>> getFavoriteIds() async {
    final prefs = await SharedPreferences.getInstance();
    return (prefs.getStringList('favorites') ?? []).toSet();
  }

  static Future<bool> toggleFavorite(String favoriteId) async {
    if (favoriteId.isEmpty) {
      return false;
    }

    final prefs = await SharedPreferences.getInstance();
    final favorites = prefs.getStringList('favorites') ?? [];
    final nextFavorites = favorites.toSet();
    final isFavorite = nextFavorites.contains(favoriteId);

    if (isFavorite) {
      nextFavorites.remove(favoriteId);
    } else {
      nextFavorites.add(favoriteId);
    }

    await prefs.setStringList('favorites', nextFavorites.toList());
    return !isFavorite;
  }

  static Future<IptvServer> _requireActiveServer() async {
    final server = await getActiveServer();
    if (server == null) {
      throw Exception(
        AppLanguage.text(
          'Servidor nao configurado. Faca login novamente.',
          'Server not configured. Sign in again.',
        ),
      );
    }
    if (!_hasRequiredServerCredentials(server)) {
      throw Exception(
        AppLanguage.text(
          'Credenciais Xtream nao encontradas para este servidor.',
          'Xtream credentials were not found for this server.',
        ),
      );
    }
    return server;
  }

  static bool _hasRequiredServerCredentials(IptvServer server) {
    return server.baseUrl.isNotEmpty &&
        server.username.isNotEmpty &&
        server.password.isNotEmpty;
  }

  static Future<List<IptvServer>> _orderedServersForFailover(
    List<IptvServer> servers,
  ) async {
    final active = await getActiveServer();
    if (active == null) {
      return servers;
    }

    final ordered = <IptvServer>[];
    for (final server in servers) {
      if (_isSameServer(server, active)) {
        ordered.add(server);
        break;
      }
    }
    for (final server in servers) {
      if (!ordered.any((item) => _isSameServer(item, server))) {
        ordered.add(server);
      }
    }
    return ordered;
  }

  static bool _isSameServer(IptvServer a, IptvServer b) {
    if (a.id.isNotEmpty && b.id.isNotEmpty) {
      return a.id == b.id;
    }
    return a.cleanBaseUrl == b.cleanBaseUrl;
  }

  static Future<List<Map<String, dynamic>>> _fetchLiveProxy(
    IptvServer server,
    String action, {
    String streamId = '',
  }) async {
    final data = await _fetchLiveProxyData(
      server,
      action,
      streamId: streamId,
    );
    if (data is! List) {
      return [];
    }
    return data
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
  }

  static Future<dynamic> _fetchLiveProxyData(
    IptvServer server,
    String action, {
    String streamId = '',
  }) async {
    final response = await http
        .post(
          Uri.parse('$baseUrl/lynx/xtream/live'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'baseUrl': server.cleanBaseUrl,
            'username': server.username,
            'password': server.password,
            'action': action,
            if (streamId.isNotEmpty) 'streamId': streamId,
          }),
        )
        .timeout(_requestTimeout);

    final decoded = _decodeObject(response.body);
    if (response.statusCode < 200 ||
        response.statusCode >= 300 ||
        decoded['success'] != true) {
      throw Exception(
        decoded['error'] ??
            AppLanguage.text(
              'Falha ao carregar canais IPTV.',
              'Unable to load IPTV channels.',
            ),
      );
    }

    final data = decoded['data'];
    return data;
  }

  static Future<List<Map<String, dynamic>>> _fetchXtream(
    IptvServer server,
    String action,
  ) async {
    final uri = Uri.parse(
      '${server.cleanBaseUrl}/player_api.php?username=${Uri.encodeQueryComponent(server.username)}&password=${Uri.encodeQueryComponent(server.password)}&action=$action',
    );
    final response = await http.get(
      uri,
      headers: const {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'IPTVSmartersPro/1.0 (Linux; Android 10)',
      },
    ).timeout(_requestTimeout);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(
        '${AppLanguage.text('Servidor Xtream retornou HTTP', 'Xtream server returned HTTP')} ${response.statusCode}.',
      );
    }

    final decoded = jsonDecode(response.body);
    if (decoded is! List) {
      return [];
    }
    return decoded
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
  }

  static Future<List<IptvContentItem>> _attachLiveEpg(
    IptvServer server,
    List<IptvContentItem> items, {
    required bool useXtreamFallback,
  }) async {
    final central = await _attachCentralLiveEpg(server, items);
    final centralResult = central.items;
    if (!central.success) {
      return centralResult;
    }
    final pendingItems = centralResult
        .asMap()
        .entries
        .where((entry) => !entry.value.liveEpgChecked)
        .toList();
    if (pendingItems.isEmpty) {
      return centralResult;
    }
    if (!useXtreamFallback || items.length != 1) {
      final result = List<IptvContentItem>.from(centralResult);
      for (final entry in pendingItems) {
        result[entry.key] = _itemWithoutLiveEpg(entry.value);
      }
      return result;
    }

    final result = List<IptvContentItem>.from(centralResult);
    for (final entry in pendingItems) {
      result[entry.key] = await _itemWithShortEpg(server, entry.value);
    }
    return result;
  }

  static IptvContentItem _itemWithoutLiveEpg(IptvContentItem item) {
    final currentLabel =
        item.subtitle == 'Buscando EPG...' ? 'EPG indisponivel' : item.subtitle;
    final fallbackNextShowing = item.nextShowing ?? '';
    final nextLabel = fallbackNextShowing == 'Aguardando EPG...'
        ? 'Sem dados do EPG'
        : fallbackNextShowing;

    return _copyLiveItemWithEpg(
      item,
      subtitle: currentLabel,
      nextShowing: nextLabel,
      liveEpgChecked: true,
    );
  }

  static Future<({List<IptvContentItem> items, bool success})>
      _attachCentralLiveEpg(
    IptvServer server,
    List<IptvContentItem> items,
  ) async {
    if (items.isEmpty) {
      return (items: <IptvContentItem>[], success: true);
    }

    const batchSize = 120;
    final result = List<IptvContentItem>.from(items);
    final freshData = <String, Map<String, dynamic>>{};
    var centralSucceeded = true;

    for (var start = 0; start < result.length; start += batchSize) {
      final end = (start + batchSize).clamp(0, result.length);
      final batch = result.sublist(start, end);
      final requestsByKey = <String, Future<_CentralEpgBatchResult>>{};
      final missing = <IptvContentItem>[];
      for (final item in batch) {
        final key = _centralEpgInFlightKey(server, item);
        final inFlight = _centralEpgInFlight[key];
        if (inFlight == null) {
          missing.add(item);
        } else {
          requestsByKey[key] = inFlight;
        }
      }

      Future<_CentralEpgBatchResult>? newRequest;
      if (missing.isNotEmpty) {
        newRequest = _fetchCentralNowNext(missing);
        for (final item in missing) {
          final key = _centralEpgInFlightKey(server, item);
          _centralEpgInFlight[key] = newRequest;
          requestsByKey[key] = newRequest;
        }
        final completedRequest = newRequest;
        void clearInFlight() {
          for (final item in missing) {
            final key = _centralEpgInFlightKey(server, item);
            if (identical(_centralEpgInFlight[key], completedRequest)) {
              _centralEpgInFlight.remove(key);
            }
          }
        }

        unawaited(completedRequest.then(
          (_) => clearInFlight(),
          onError: (_) => clearInFlight(),
        ));
      }

      final uniqueRequests = requestsByKey.values.toSet().toList();
      final responses = await Future.wait(uniqueRequests);
      final responseByRequest =
          <Future<_CentralEpgBatchResult>, _CentralEpgBatchResult>{
        for (var index = 0; index < uniqueRequests.length; index++)
          uniqueRequests[index]: responses[index],
      };
      if (newRequest != null) {
        freshData.addAll(responseByRequest[newRequest]?.data ?? const {});
      }

      for (var offset = 0; offset < batch.length; offset++) {
        final item = batch[offset];
        final response = responseByRequest[
            requestsByKey[_centralEpgInFlightKey(server, item)]];
        if (response == null) {
          centralSucceeded = false;
          continue;
        }
        centralSucceeded &= response.success;
        final epg = _epgForItem(item, response.data);
        if (epg != null) {
          result[start + offset] = _itemWithNowNextEpg(item, epg);
        }
      }
    }

    if (freshData.isNotEmpty) {
      try {
        await _saveCentralLiveEpgCache(server, freshData);
      } catch (_) {
        if (epgDiagnosticsEnabled) {
          debugPrint('EPG cache write failed');
        }
      }
    }
    return (items: result, success: centralSucceeded);
  }

  static String _centralEpgInFlightKey(
    IptvServer server,
    IptvContentItem item,
  ) {
    return jsonEncode([
      _centralLiveEpgCacheKey(server),
      item.id,
      item.epgChannelId,
      item.title,
    ]);
  }

  static Future<List<IptvContentItem>> _applyCachedCentralLiveEpg(
    IptvServer server,
    List<IptvContentItem> items,
  ) async {
    if (items.isEmpty) {
      return const [];
    }

    final cached = await _readCentralLiveEpgCache(server);
    final epgByChannel = cached.$1;
    final savedAt = cached.$2;
    if (epgByChannel.isEmpty || savedAt == null) {
      return items;
    }

    return items.map((item) {
      if (item.liveEpgChecked) {
        return item;
      }
      final epg = _epgForItem(item, epgByChannel);
      final epgSavedAt = epg == null ? savedAt : _epgCachedAt(epg, savedAt);
      if (epg != null && _cachedNowNextIsUsable(epg, epgSavedAt)) {
        return _itemWithNowNextEpg(item, epg);
      }
      final checked = _epgRowForItem(item, epgByChannel);
      if (checked != null &&
          !_hasNowNextData(checked) &&
          DateTime.now().difference(_epgCachedAt(checked, savedAt)) <
              _missingLiveEpgRefreshInterval) {
        return _itemWithoutLiveEpg(item);
      }
      return item;
    }).toList();
  }

  static Future<bool> _shouldRefreshCentralLiveEpg(IptvServer server) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_centralLiveEpgCacheKey(server));
    if (raw == null || raw.isEmpty) {
      return true;
    }

    try {
      final decoded = jsonDecode(raw);
      if (decoded is! Map) {
        return true;
      }
      final updatedAt = _intValue(decoded['updatedAt']);
      if (updatedAt <= 0) {
        return true;
      }
      final age = DateTime.now().difference(
        DateTime.fromMillisecondsSinceEpoch(updatedAt),
      );
      return age >= _liveNowNextRefreshInterval;
    } catch (_) {
      return true;
    }
  }

  static Future<(Map<String, Map<String, dynamic>>, DateTime?)>
      _readCentralLiveEpgCache(IptvServer server) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_centralLiveEpgCacheKey(server));
    if (raw == null || raw.isEmpty) {
      return (<String, Map<String, dynamic>>{}, null);
    }

    try {
      final decoded = jsonDecode(raw);
      if (decoded is! Map) {
        return (<String, Map<String, dynamic>>{}, null);
      }
      final updatedAt = _intValue(decoded['updatedAt']);
      final data = decoded['data'];
      if (updatedAt <= 0 || data is! Map) {
        return (<String, Map<String, dynamic>>{}, null);
      }

      final result = <String, Map<String, dynamic>>{};
      for (final entry in data.entries) {
        final key = _stringValue(entry.key);
        final value = entry.value;
        if (key.isNotEmpty && value is Map) {
          result[key] = Map<String, dynamic>.from(value);
        }
      }
      return (result, DateTime.fromMillisecondsSinceEpoch(updatedAt));
    } catch (_) {
      return (<String, Map<String, dynamic>>{}, null);
    }
  }

  static Future<void> _saveCentralLiveEpgCache(
    IptvServer server,
    Map<String, Map<String, dynamic>> freshData,
  ) async {
    if (freshData.isEmpty) {
      return;
    }
    final key = _centralLiveEpgCacheKey(server);
    final previousWrite = _centralEpgCacheWrites[key];
    Future<void> write() async {
      final cached = await _readCentralLiveEpgCache(server);
      final merged = Map<String, Map<String, dynamic>>.from(cached.$1);
      final savedAt = DateTime.now().millisecondsSinceEpoch;
      for (final entry in freshData.entries) {
        merged[entry.key] = {...entry.value, '_cachedAt': savedAt};
      }

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(
        key,
        jsonEncode({
          'updatedAt': savedAt,
          'data': merged,
        }),
      );
    }

    final currentWrite = previousWrite == null
        ? write()
        : previousWrite.then((_) => write(), onError: (_) => write());
    _centralEpgCacheWrites[key] = currentWrite;
    try {
      await currentWrite;
    } finally {
      if (identical(_centralEpgCacheWrites[key], currentWrite)) {
        _centralEpgCacheWrites.remove(key);
      }
    }
  }

  static bool _cachedNowNextIsUsable(
    Map<String, dynamic> epg,
    DateTime savedAt,
  ) {
    final age = DateTime.now().difference(savedAt);
    if (age > _liveNowNextCacheMaxAge) {
      return false;
    }

    final now = DateTime.now();
    final current = _liveProgramFromNowNext(epg['current']);
    if (current?.end != null && current!.end!.isAfter(now)) {
      return true;
    }

    final next = _liveProgramFromNowNext(epg['next']);
    if (next?.start != null && next!.start!.isAfter(now)) {
      return true;
    }

    return current != null &&
        current.end == null &&
        age < const Duration(hours: 4);
  }

  static DateTime _epgCachedAt(Map<String, dynamic> epg, DateTime fallback) {
    final timestamp = _intValue(epg['_cachedAt']);
    return timestamp > 0
        ? DateTime.fromMillisecondsSinceEpoch(timestamp)
        : fallback;
  }

  static String _centralLiveEpgCacheKey(IptvServer server) {
    final serverKey = server.id.isNotEmpty ? server.id : server.cleanBaseUrl;
    return '$_liveNowNextCachePrefix:$serverKey';
  }

  static Future<_CentralEpgBatchResult> _fetchCentralNowNext(
    List<IptvContentItem> items,
  ) async {
    final channelIds = items
        .expand(_epgLookupIds)
        .where((id) => id.trim().isNotEmpty)
        .toSet()
        .toList();
    final channels = items.map(_epgLookupChannel).toList();
    if (channelIds.isEmpty && channels.isEmpty) {
      return const _CentralEpgBatchResult(success: true, data: {});
    }

    final stopwatch = Stopwatch()..start();
    var statusCode = 0;
    var responseBytes = 0;
    var matched = 0;
    var encoding = 'identity';
    var authMode = 'none';
    var available = false;
    var source = 'unknown';
    try {
      final headers = await _epgRequestHeaders();
      authMode = headers.containsKey('Authorization')
          ? 'bearer'
          : headers.containsKey('X-Server-Id')
              ? 'server'
              : 'none';
      final response = await _epgHttpClient
          .post(
            Uri.parse('$baseUrl/epg/now-next'),
            headers: headers,
            body: jsonEncode({
              'channelIds': channelIds,
              'channels': channels,
            }),
          )
          .timeout(const Duration(seconds: 7));
      statusCode = response.statusCode;
      responseBytes = response.bodyBytes.length;
      encoding = response.headers['content-encoding'] ?? 'identity';

      final decoded = _decodeObject(response.body);
      available = decoded['available'] == true;
      source = _stringValue(decoded['source'], fallback: 'unknown');
      if (response.statusCode < 200 ||
          response.statusCode >= 300 ||
          decoded['success'] != true ||
          decoded['available'] == false) {
        return const _CentralEpgBatchResult(success: false, data: {});
      }

      final data = decoded['data'];
      final result = <String, Map<String, dynamic>>{};
      if (data is List) {
        for (var index = 0;
            index < data.length && index < channels.length;
            index++) {
          final item = data[index];
          if (item is! Map) {
            continue;
          }
          final epg = Map<String, dynamic>.from(item);
          for (final channelId in _epgStructuredRequestIds(channels[index])) {
            result[channelId] = epg;
          }
          for (final channelId in _epgResponseIds(epg)) {
            result[channelId] = epg;
          }
          if (_hasNowNextData(epg)) {
            matched++;
          }
        }
        return _CentralEpgBatchResult(success: true, data: result);
      }

      if (data is Map) {
        for (final entry in data.entries) {
          final item = entry.value;
          if (item is! Map) {
            continue;
          }
          final epg = Map<String, dynamic>.from(item);
          final entryKey = _stringValue(entry.key);
          if (entryKey.isNotEmpty) {
            result[entryKey] = epg;
          }
          for (final channelId in _epgResponseIds(epg)) {
            result[channelId] = epg;
          }
          if (_hasNowNextData(epg)) {
            matched++;
          }
        }
        return _CentralEpgBatchResult(success: true, data: result);
      }

      return const _CentralEpgBatchResult(success: false, data: {});
    } catch (_) {
      return const _CentralEpgBatchResult(success: false, data: {});
    } finally {
      if (epgDiagnosticsEnabled) {
        debugPrint(
          'EPG central channels=${channels.length} matched=$matched '
          'status=$statusCode elapsedMs=${stopwatch.elapsedMilliseconds} '
          'decodedBytes=$responseBytes encoding=$encoding '
          'auth=$authMode available=$available source=$source',
        );
      }
    }
  }

  static List<String> _epgResponseIds(Map<String, dynamic> epg) {
    return [
      epg['channelId'],
      epg['id'],
      epg['epgChannelId'],
      epg['name'],
      epg['requestName'],
      epg['matchedChannelId'],
      epg['globalChannelId'],
      epg['matchedName'],
    ].map(_stringValue).where((id) => id.trim().isNotEmpty).toSet().toList();
  }

  static Future<Map<String, String>> _epgRequestHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token') ?? '';
    final serverId = prefs.getString('selected_server_id') ?? '';
    return {
      'Content-Type': 'application/json',
      if (token.isNotEmpty && token != 'authenticated' && !_isExpiredJwt(token))
        'Authorization': 'Bearer $token',
      if (serverId.isNotEmpty) 'X-Server-Id': serverId,
    };
  }

  static bool _isExpiredJwt(String token) {
    final parts = token.split('.');
    if (parts.length != 3) {
      return false;
    }
    try {
      final payload = jsonDecode(
        utf8.decode(base64Url.decode(base64Url.normalize(parts[1]))),
      );
      if (payload is! Map) {
        return false;
      }
      final expiresAt = payload['exp'];
      if (expiresAt is! num) {
        return false;
      }
      final nowSeconds = DateTime.now().millisecondsSinceEpoch ~/ 1000;
      return expiresAt <= nowSeconds + 30;
    } catch (_) {
      return false;
    }
  }

  static Map<String, dynamic> _epgLookupChannel(IptvContentItem item) {
    final streamId = item.id.trim();
    final epgChannelId = item.epgChannelId.trim();
    final channelId = epgChannelId.isNotEmpty ? epgChannelId : streamId;
    return {
      if (channelId.isNotEmpty) 'channelId': channelId,
      'name': item.title,
      if (streamId.isNotEmpty) 'streamId': int.tryParse(streamId) ?? streamId,
      if (epgChannelId.isNotEmpty) 'epgChannelId': epgChannelId,
      'cleanName': _cleanEpgChannelName(item.title),
    };
  }

  static List<String> _epgStructuredRequestIds(Map<String, dynamic> channel) {
    return [
      channel['channelId'],
      channel['streamId'],
      channel['name'],
      channel['cleanName'],
      channel['epgChannelId'],
    ].map(_stringValue).where((id) => id.trim().isNotEmpty).toSet().toList();
  }

  static List<String> _epgLookupIds(IptvContentItem item) {
    return [
      if (_isSafeEpgChannelId(item)) item.epgChannelId,
      item.id,
      item.title,
      _cleanEpgChannelName(item.title),
    ].where((id) => id.trim().isNotEmpty).toSet().toList();
  }

  static bool _isSafeEpgChannelId(IptvContentItem item) {
    final epgChannelId = item.epgChannelId.trim();
    if (epgChannelId.isEmpty) {
      return false;
    }

    final epgText = _normalizedEpgMatchText(epgChannelId);
    final titleText = _normalizedEpgMatchText(item.title);
    if (epgText.isEmpty || titleText.isEmpty) {
      return false;
    }

    final epgTokens = _significantEpgTokens(epgText);
    final titleTokens = _significantEpgTokens(titleText);
    if (epgTokens.isEmpty || titleTokens.isEmpty) {
      return false;
    }

    return epgTokens.any((token) => titleTokens.contains(token)) ||
        titleTokens.any((token) => epgText.contains(token));
  }

  static Set<String> _significantEpgTokens(String value) {
    const ignored = {
      'canal',
      'fhd',
      'hd',
      'h264',
      'h265',
      'hevc',
      'sd',
      'uhd',
    };
    return value
        .split(' ')
        .where((token) => token.length >= 4 && !ignored.contains(token))
        .toSet();
  }

  static String _normalizedEpgMatchText(String value) {
    return _cleanEpgChannelName(value)
        .toLowerCase()
        .replaceAll(RegExp(r'[áàãâä]'), 'a')
        .replaceAll(RegExp(r'[éèêë]'), 'e')
        .replaceAll(RegExp(r'[íìîï]'), 'i')
        .replaceAll(RegExp(r'[óòõôö]'), 'o')
        .replaceAll(RegExp(r'[úùûü]'), 'u')
        .replaceAll('ç', 'c')
        .replaceAll(RegExp(r'[^a-z0-9]+'), ' ')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
  }

  static String _cleanEpgChannelName(String value) {
    return value
        .replaceAll(
            RegExp(r'\b(FHD|HD|SD|H264|H265|HEVC|4K)\b', caseSensitive: false),
            ' ')
        .replaceAll(RegExp(r'[¹²³ºª°]'), ' ')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
  }

  static Map<String, dynamic>? _epgForItem(
    IptvContentItem item,
    Map<String, Map<String, dynamic>> epgByChannel,
  ) {
    for (final id in _epgLookupIds(item)) {
      final epg = epgByChannel[id];
      if (epg != null && _hasNowNextData(epg)) {
        return epg;
      }
    }
    return null;
  }

  static Map<String, dynamic>? _epgRowForItem(
    IptvContentItem item,
    Map<String, Map<String, dynamic>> epgByChannel,
  ) {
    for (final id in _epgLookupIds(item)) {
      final epg = epgByChannel[id];
      if (epg != null) {
        return epg;
      }
    }
    return null;
  }

  static bool _hasNowNextData(Map<String, dynamic> epg) {
    return _liveProgramFromNowNext(epg['current']) != null ||
        _liveProgramFromNowNext(epg['next']) != null;
  }

  static IptvContentItem _itemWithNowNextEpg(
    IptvContentItem item,
    Map<String, dynamic> epg,
  ) {
    final current = _liveProgramFromNowNext(epg['current']);
    final next = _liveProgramFromNowNext(epg['next']);
    final fallbackNextShowing = item.nextShowing ?? '';

    return _copyLiveItemWithEpg(
      item,
      subtitle: current != null
          ? _formatProgramLabel(current)
          : item.subtitle == 'Buscando EPG...'
              ? 'EPG indisponivel'
              : item.subtitle,
      nextShowing: next != null
          ? _formatProgramLabel(next)
          : fallbackNextShowing == 'Aguardando EPG...'
              ? 'Sem dados do EPG'
              : fallbackNextShowing,
      liveEpgChecked: true,
    );
  }

  static _LiveProgram? _liveProgramFromNowNext(dynamic data) {
    if (data is! Map) {
      return null;
    }
    final program = _liveProgramFromJson(Map<String, dynamic>.from(data));
    return program.title.isEmpty || _isBrokenEpgText(program.title)
        ? null
        : program;
  }

  static Future<IptvContentItem> _itemWithShortEpg(
    IptvServer server,
    IptvContentItem item,
  ) async {
    final programs = await _fetchShortEpg(server, item.id);
    if (programs.isEmpty) {
      final currentLabel = item.subtitle == 'Buscando EPG...'
          ? 'EPG indisponivel'
          : item.subtitle;
      final fallbackNextShowing = item.nextShowing ?? '';
      final nextLabel = fallbackNextShowing == 'Aguardando EPG...'
          ? 'Sem dados do EPG'
          : fallbackNextShowing;
      return _copyLiveItemWithEpg(
        item,
        subtitle: currentLabel,
        nextShowing: nextLabel,
        liveEpgChecked: true,
      );
    }

    final now = DateTime.now();
    final currentIndex = programs.indexWhere((program) {
      final start = program.start;
      final end = program.end;
      if (start == null || end == null) {
        return false;
      }
      return !now.isBefore(start) && now.isBefore(end);
    });

    final current = currentIndex >= 0
        ? programs[currentIndex]
        : programs.where((program) {
            final start = program.start;
            final end = program.end;
            return start != null &&
                end == null &&
                !now.isBefore(start) &&
                now.difference(start) < const Duration(hours: 6);
          }).firstOrNull;

    final next = currentIndex >= 0
        ? programs.skip(currentIndex + 1).firstOrNull
        : programs.where((program) {
            final start = program.start;
            return start != null && start.isAfter(now);
          }).firstOrNull;

    final subtitle = current != null
        ? _formatProgramLabel(current)
        : _formatProgramNowFromItem(item);
    final nextShowing = next != null
        ? _formatProgramLabel(next)
        : _formatProgramNextFromItem(item);

    return _copyLiveItemWithEpg(
      item,
      subtitle: subtitle,
      nextShowing: nextShowing,
      liveEpgChecked: true,
    );
  }

  static IptvContentItem _copyLiveItemWithEpg(
    IptvContentItem item, {
    required String subtitle,
    required String nextShowing,
    required bool liveEpgChecked,
  }) {
    return IptvContentItem(
      id: item.id,
      epgChannelId: item.epgChannelId,
      title: item.title,
      subtitle: subtitle,
      category: item.category,
      categoryId: item.categoryId,
      streamUrl: item.streamUrl,
      alternateStreamUrls: item.alternateStreamUrls,
      imageUrl: item.imageUrl,
      type: item.type,
      nextShowing: nextShowing,
      rating: item.rating,
      year: item.year,
      description: item.description,
      eventStartDateTime: item.eventStartDateTime,
      liveEpgChecked: liveEpgChecked,
    );
  }

  static Future<List<_LiveProgram>> _fetchShortEpg(
    IptvServer server,
    String streamId,
  ) async {
    if (streamId.isEmpty) {
      return const [];
    }

    final proxyPrograms = await _fetchShortEpgProxy(server, streamId);
    if (_hasCurrentOrFutureProgram(proxyPrograms)) {
      return proxyPrograms;
    }

    try {
      final uri = Uri.parse(
        '${server.cleanBaseUrl}/player_api.php?username=${Uri.encodeQueryComponent(server.username)}&password=${Uri.encodeQueryComponent(server.password)}&action=get_short_epg&stream_id=${Uri.encodeQueryComponent(streamId)}&limit=24',
      );
      final response = await http.get(
        uri,
        headers: const {
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'IPTVSmartersPro/1.0 (Linux; Android 10)',
        },
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode < 200 || response.statusCode >= 300) {
        return const [];
      }

      final directPrograms = _programsFromEpgData(jsonDecode(response.body));
      return directPrograms.isNotEmpty ? directPrograms : proxyPrograms;
    } catch (_) {
      return proxyPrograms;
    }
  }

  static bool _hasCurrentOrFutureProgram(List<_LiveProgram> programs) {
    final now = DateTime.now();
    return programs.any((program) {
      final start = program.start;
      final end = program.end;
      if (start == null) {
        return false;
      }
      if (end == null) {
        return !start.isBefore(now);
      }
      return end.isAfter(now);
    });
  }

  static Future<List<_LiveProgram>> _fetchShortEpgProxy(
    IptvServer server,
    String streamId,
  ) async {
    try {
      final data = await _fetchLiveProxyData(
        server,
        'epg',
        streamId: streamId,
      ).timeout(const Duration(seconds: 8));
      return _programsFromEpgData(data);
    } catch (_) {
      return const [];
    }
  }

  static List<_LiveProgram> _programsFromEpgData(dynamic decoded) {
    final programs = _epgListings(decoded)
        .map(_liveProgramFromJson)
        .where((program) => program.title.isNotEmpty)
        .toList()
      ..sort((a, b) {
        final aStart = a.start;
        final bStart = b.start;
        if (aStart == null && bStart == null) {
          return 0;
        }
        if (aStart == null) {
          return 1;
        }
        if (bStart == null) {
          return -1;
        }
        return aStart.compareTo(bStart);
      });
    return programs;
  }

  static List<Map<String, dynamic>> _epgListings(dynamic decoded) {
    dynamic data = decoded;
    if (decoded is Map) {
      data = decoded['epg_listings'] ??
          decoded['listings'] ??
          decoded['data'] ??
          decoded['epg'];
    }
    if (data is Map) {
      data = data['epg_listings'] ?? data['listings'] ?? data['data'];
    }
    if (data is! List) {
      return const [];
    }
    return data
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList();
  }

  static _LiveProgram _liveProgramFromJson(Map<String, dynamic> item) {
    return _LiveProgram(
      title: _decodeEpgText(
        item['title'] ??
            item['name'] ??
            item['program_title'] ??
            item['programme_title'],
      ),
      start: _programDateTime(item, const [
        'start_timestamp',
        'startTimestamp',
        'start',
        'start_time',
        'startTime',
      ]),
      end: _programDateTime(item, const [
        'stop_timestamp',
        'stopTimestamp',
        'end_timestamp',
        'endTimestamp',
        'stop',
        'end',
        'end_time',
        'endTime',
      ]),
    );
  }

  static DateTime? _programDateTime(
    Map<String, dynamic> item,
    List<String> keys,
  ) {
    for (final key in keys) {
      final value = _stringValue(item[key]);
      if (value.isEmpty) {
        continue;
      }

      final parsedInt = int.tryParse(value);
      if (parsedInt != null && parsedInt > 0) {
        final millis = parsedInt > 9999999999 ? parsedInt : parsedInt * 1000;
        return DateTime.fromMillisecondsSinceEpoch(millis);
      }

      final normalized = value.replaceFirst(' ', 'T');
      final parsed = DateTime.tryParse(normalized);
      if (parsed != null) {
        return parsed;
      }
    }
    return null;
  }

  static String _decodeEpgText(dynamic value) {
    final text = _stringValue(value);
    if (text.isEmpty) {
      return '';
    }

    final compact = text.replaceAll(RegExp(r'\s+'), '');
    final canBeBase64 = compact.length % 4 == 0 &&
        RegExp(r'^[A-Za-z0-9+/]+={0,2}$').hasMatch(compact);
    if (!canBeBase64) {
      return text;
    }

    try {
      final decoded = utf8.decode(base64.decode(compact), allowMalformed: true);
      return decoded.trim().isNotEmpty ? decoded.trim() : text;
    } catch (_) {
      return text;
    }
  }

  static bool _isBrokenEpgText(String value) {
    final text = value.trim();
    if (text.isEmpty) {
      return true;
    }

    final replacementCount = text.runes.where((rune) => rune == 0xFFFD).length;
    if (replacementCount > 0) {
      return true;
    }

    final visibleChars = text.replaceAll(RegExp(r'\s+'), '');
    if (visibleChars.isEmpty) {
      return true;
    }

    final letterOrNumberCount =
        RegExp(r'[A-Za-z0-9À-ÿ]').allMatches(visibleChars).length;
    return letterOrNumberCount / visibleChars.length < 0.35;
  }

  static String _formatProgramLabel(_LiveProgram program) {
    final title = program.title.trim();
    final start = program.start;
    if (start == null) {
      return title;
    }
    return '${_twoDigits(start.hour)}:${_twoDigits(start.minute)} $title';
  }

  static String _twoDigits(int value) => value.toString().padLeft(2, '0');

  static List<CategoryOption> _mapCategories(List<Map<String, dynamic>> data) {
    return data
        .map((item) {
          return CategoryOption(
            id: _stringValue(item['category_id']),
            label: _stringValue(
              item['category_name'],
              fallback: AppLanguage.text('Sem Categoria', 'Uncategorized'),
            ),
          );
        })
        .where((item) => item.id.isNotEmpty)
        .toList();
  }

  static Map<String, String> _categoryNameMap(List<Map<String, dynamic>> data) {
    final result = <String, String>{};
    for (final item in data) {
      final id = _stringValue(item['category_id']);
      final name = _stringValue(item['category_name']);
      if (id.isNotEmpty && name.isNotEmpty) {
        result[id] = name;
      }
    }
    return result;
  }

  static String _categoryName(Map<String, String> map, String id) {
    return map[id] ?? 'Geral';
  }

  static String _formatProgramNow(Map<String, dynamic> item) {
    return _formatProgramNowFromItem(item);
  }

  static String _formatProgramNowFromItem(dynamic item) {
    if (item is IptvContentItem) {
      if (item.type == 'live' && !item.liveEpgChecked) {
        return 'Buscando EPG...';
      }
      return item.subtitle.trim().isNotEmpty
          ? item.subtitle
          : 'Programacao indisponivel';
    }
    final map = item is Map<String, dynamic> ? item : <String, dynamic>{};
    var value = _stringValue(
      map['epg_now'] ?? map['current_program'] ?? map['now_showing'],
      fallback: 'Buscando EPG...',
    ).replaceFirst(RegExp(r'^EPG:\s*', caseSensitive: false), '');
    if (!RegExp(r'^\d{1,2}:\d{2}').hasMatch(value)) {
      final time = _stringValue(map['now_start'] ?? map['start_time']);
      if (time.isNotEmpty) {
        value = '$time $value';
      }
    }
    return value;
  }

  static String _formatProgramNext(Map<String, dynamic> item) {
    return _formatProgramNextFromItem(item);
  }

  static String _formatProgramNextFromItem(dynamic item) {
    if (item is IptvContentItem) {
      if (item.type == 'live' && !item.liveEpgChecked) {
        return 'Aguardando EPG...';
      }
      return (item.nextShowing ?? '').trim().isNotEmpty
          ? item.nextShowing!
          : 'Sem proxima programacao';
    }
    final map = item is Map<String, dynamic> ? item : <String, dynamic>{};
    var value = _stringValue(
      map['epg_next'] ?? map['next_program'] ?? map['next_showing'],
      fallback: 'Aguardando EPG...',
    ).replaceFirst(RegExp(r'^A seguir:\s*', caseSensitive: false), '');
    if (!RegExp(r'^\d{1,2}:\d{2}').hasMatch(value)) {
      final time = _stringValue(map['next_start'] ?? map['next_time']);
      if (time.isNotEmpty) {
        value = '$time $value';
      }
    }
    return value;
  }

  static String _rating(Map<String, dynamic> item) {
    final rating = _stringValue(item['rating']);
    if (rating.isNotEmpty && rating != '0' && rating != '0.0') {
      return rating;
    }

    final fiveBased = double.tryParse(_stringValue(item['rating_5based']));
    if (fiveBased != null && fiveBased > 0) {
      return (fiveBased * 2).toStringAsFixed(1);
    }

    return '';
  }

  static DateTime? _eventStartDateTime(Map<String, dynamic> item) {
    final timestamp = _eventTimestamp(item);
    if (timestamp != null) {
      return timestamp;
    }

    final titleTime = _timeFromText(
      [
        _stringValue(item['name'] ?? item['stream_name']),
        _stringValue(item['title']),
      ].join(' '),
    );
    if (titleTime != null) {
      final date = _dateFromEventFields(item) ?? DateTime.now();
      return DateTime(
        date.year,
        date.month,
        date.day,
        titleTime.$1,
        titleTime.$2,
      );
    }

    final combined = _eventDateTimeFromFields(item);
    if (combined != null) {
      return combined;
    }

    final textTime = _timeFromText(
      [
        _stringValue(item['name'] ?? item['stream_name']),
        _stringValue(item['title']),
        _stringValue(item['epg_now']),
        _stringValue(item['current_program']),
      ].join(' '),
    );
    if (textTime == null) {
      return null;
    }

    final now = DateTime.now();
    return DateTime(
      now.year,
      now.month,
      now.day,
      textTime.$1,
      textTime.$2,
    );
  }

  static DateTime? _eventTimestamp(Map<String, dynamic> item) {
    for (final key in [
      'start_timestamp',
      'event_timestamp',
      'timestamp',
      'startTimeTimestamp',
      'start_time_unix',
    ]) {
      final raw = _stringValue(item[key]);
      if (raw.isEmpty) {
        continue;
      }
      final parsed = int.tryParse(raw);
      if (parsed == null || parsed <= 0) {
        continue;
      }
      final millis = parsed > 9999999999 ? parsed : parsed * 1000;
      return DateTime.fromMillisecondsSinceEpoch(millis);
    }
    return null;
  }

  static DateTime? _eventDateTimeFromFields(Map<String, dynamic> item) {
    final dateValue = _firstStringValue(item, [
      'event_date',
      'start_date',
      'date',
      'startDate',
      'eventDate',
    ]);
    final timeValue = _firstStringValue(item, [
      'event_time',
      'start_time',
      'time',
      'startTime',
    ]);

    if (dateValue.isNotEmpty) {
      final direct = DateTime.tryParse(
        timeValue.isNotEmpty ? '$dateValue $timeValue' : dateValue,
      );
      if (direct != null) {
        return direct;
      }
    }

    final time = _timeFromText(timeValue);
    if (time == null) {
      return null;
    }

    final date = _dateFromText(dateValue) ?? DateTime.now();
    return DateTime(date.year, date.month, date.day, time.$1, time.$2);
  }

  static DateTime? _dateFromEventFields(Map<String, dynamic> item) {
    return _dateFromText(
      _firstStringValue(item, [
        'event_date',
        'start_date',
        'date',
        'startDate',
        'eventDate',
      ]),
    );
  }

  static String _imageUrl(Map<String, dynamic> item, IptvServer server) {
    final nestedInfo = item['info'];
    final nested = nestedInfo is Map
        ? Map<String, dynamic>.from(nestedInfo)
        : <String, dynamic>{};
    final candidates = [
      item['stream_icon'],
      item['cover'],
      item['cover_big'],
      item['movie_image'],
      item['poster'],
      item['poster_path'],
      item['image'],
      item['imageUrl'],
      item['logo'],
      nested['cover'],
      nested['cover_big'],
      nested['movie_image'],
      nested['poster'],
      nested['poster_path'],
      nested['image'],
      nested['imageUrl'],
      if (item['backdrop_path'] is List &&
          (item['backdrop_path'] as List).isNotEmpty)
        (item['backdrop_path'] as List).first,
      if (nested['backdrop_path'] is List &&
          (nested['backdrop_path'] as List).isNotEmpty)
        (nested['backdrop_path'] as List).first,
    ];

    for (final candidate in candidates) {
      final url = _normalizeImageUrl(_stringValue(candidate), server);
      if (url.isNotEmpty) {
        return url;
      }
    }
    return '';
  }

  static String _normalizeImageUrl(String value, IptvServer server) {
    final url = value.trim();
    if (url.isEmpty) {
      return '';
    }
    if (url.startsWith('//')) {
      return 'http:$url';
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('/')) {
      return '${server.cleanBaseUrl}$url';
    }
    return url;
  }

  static String _firstStringValue(
      Map<String, dynamic> item, List<String> keys) {
    for (final key in keys) {
      final value = _stringValue(item[key]);
      if (value.isNotEmpty) {
        return value;
      }
    }
    return '';
  }

  static String _firstNonEmptyString(List<dynamic> values) {
    for (final value in values) {
      final text = _stringValue(value);
      if (text.isNotEmpty) {
        return text;
      }
    }
    return '';
  }

  static DateTime? _dateFromText(String value) {
    final normalized = value.trim();
    if (normalized.isEmpty) {
      return null;
    }
    final iso = DateTime.tryParse(normalized);
    if (iso != null) {
      return iso;
    }
    final match = RegExp(r'\b(\d{1,2})/(\d{1,2})(?:/(\d{2,4}))?\b')
        .firstMatch(normalized);
    if (match == null) {
      return null;
    }
    final now = DateTime.now();
    final day = int.tryParse(match.group(1) ?? '');
    final month = int.tryParse(match.group(2) ?? '');
    var year = int.tryParse(match.group(3) ?? '') ?? now.year;
    if (year < 100) {
      year += 2000;
    }
    if (day == null || month == null) {
      return null;
    }
    return DateTime(year, month, day);
  }

  static (int, int)? _timeFromText(String value) {
    final match =
        RegExp(r'\b([01]?\d|2[0-3])[:hH]([0-5]\d)\b').firstMatch(value);
    if (match == null) {
      return null;
    }
    final hour = int.tryParse(match.group(1) ?? '');
    final minute = int.tryParse(match.group(2) ?? '');
    if (hour == null || minute == null) {
      return null;
    }
    return (hour, minute);
  }

  static Map<String, dynamic> _decodeObject(String body) {
    final decoded = jsonDecode(body);
    if (decoded is Map<String, dynamic>) {
      return decoded;
    }
    if (decoded is Map) {
      return Map<String, dynamic>.from(decoded);
    }
    return {};
  }
}

String _stringValue(dynamic value, {String fallback = ''}) {
  if (value == null) {
    return fallback;
  }
  final text = value.toString().trim();
  return text.isEmpty ? fallback : text;
}

int _intValue(dynamic value, {int fallback = 0}) {
  if (value is int) {
    return value;
  }
  if (value is num) {
    return value.toInt();
  }
  return int.tryParse(_stringValue(value)) ?? fallback;
}

int _seasonSortValue(dynamic value) {
  final parsed =
      int.tryParse(_stringValue(value).replaceAll(RegExp(r'\D'), ''));
  return parsed ?? 9999;
}

int _episodeSortValue(Map item) {
  final explicit = int.tryParse(
    _stringValue(item['episode_num'] ?? item['episode'] ?? item['num']),
  );
  if (explicit != null) {
    return explicit;
  }

  final title = _stringValue(item['title'] ?? item['name']);
  final fromTitle =
      RegExp(r'(?:E|Ep\.?|Episodio)\s*(\d+)', caseSensitive: false)
          .firstMatch(title)
          ?.group(1);
  final parsed = int.tryParse(fromTitle ?? '');
  if (parsed != null) {
    return parsed;
  }
  final id = _stringValue(item['id'] ?? item['episode_id']);
  return int.tryParse(id.replaceAll(RegExp(r'\D'), '')) ?? 9999;
}

String _cleanBaseUrl(String value) {
  var cleaned = value.trim();
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = 'http://$cleaned';
  }
  return cleaned.replaceAll(RegExp(r'/+$'), '');
}
