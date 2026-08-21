import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

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
        fallback: 'Servidor ${index + 1}',
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

  const IptvContentItem({
    required this.id,
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
  });
}

class IptvCatalog {
  final List<CategoryOption> categories;
  final List<IptvContentItem> items;

  const IptvCatalog({required this.categories, required this.items});
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

class ApiService {
  static const Duration _requestTimeout = Duration(seconds: 15);

  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://dimgrey-sardine-991820.hostingersite.com/api',
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
          Uri.parse('$appBaseUrl/v1/auth/app/login'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'licenseCode': licenseCode,
            'username': username,
            'password': password,
            'deviceId': deviceId,
            'deviceInfo': deviceInfo,
          }),
        )
        .timeout(_requestTimeout);

    final decoded = _decodeObject(response.body);
    if (response.statusCode == 200) {
      final prefs = await SharedPreferences.getInstance();

      if (decoded['user'] != null) {
        await prefs.setString('user_data', jsonEncode(decoded['user']));
      }

      if (decoded['license'] != null) {
        await prefs.setString('license_data', jsonEncode(decoded['license']));
      }

      if (decoded['servers'] != null) {
        await prefs.setString('servers_data', jsonEncode(decoded['servers']));
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

      return decoded;
    }

    throw Exception(decoded['error'] ?? 'Erro de autenticacao');
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
    throw Exception(errorData['error'] ?? 'Erro ao solicitar teste gratis');
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

  static Future<IptvCatalog> fetchLiveCatalog() async {
    final server = await _requireActiveServer();
    final categoriesData = await _fetchLiveProxy(server, 'categories');
    final categoryMap = _categoryNameMap(categoriesData);
    final categories = [
      const CategoryOption(id: 'todos', label: 'Todos os Canais'),
      ..._mapCategories(categoriesData),
    ];

    final streamsData = await _fetchLiveProxy(server, 'streams');
    final items = streamsData.asMap().entries.map((entry) {
      final index = entry.key;
      final item = entry.value;
      final catId = _stringValue(item['category_id']);
      final catName = categoryMap[catId] ?? 'Geral';
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
        title: _stringValue(item['name'] ?? item['stream_name'],
            fallback: 'Canal sem Nome'),
        subtitle: _formatProgramNow(item),
        category: catName,
        categoryId: catId,
        streamUrl: streamUrl,
        alternateStreamUrls:
            generatedUrls.where((url) => url != streamUrl).toList(),
        imageUrl: _stringValue(item['stream_icon']),
        type: 'live',
        description: _stringValue(
          item['description'] ?? item['plot'] ?? item['overview'],
        ),
        nextShowing: _formatProgramNext(item),
      );
    }).toList();

    return IptvCatalog(categories: categories, items: items);
  }

  static Future<IptvCatalog> fetchMoviesCatalog() async {
    final server = await _requireActiveServer();
    final categoriesData = await _fetchXtream(server, 'get_vod_categories');
    final categoryMap = _categoryNameMap(categoriesData);
    final categories = [
      const CategoryOption(id: 'todos', label: 'Todos os Filmes'),
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
        title: _stringValue(item['name'] ?? item['title'],
            fallback: 'Filme sem Nome'),
        subtitle: [
          if (year.isNotEmpty) year,
          _categoryName(categoryMap, catId),
        ].join(' - '),
        category: _categoryName(categoryMap, catId),
        categoryId: catId,
        streamUrl: streamUrl,
        imageUrl: _stringValue(item['stream_icon'] ?? item['cover']),
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

  static Future<IptvCatalog> fetchSeriesCatalog() async {
    final server = await _requireActiveServer();
    final categoriesData = await _fetchXtream(server, 'get_series_categories');
    final categoryMap = _categoryNameMap(categoriesData);
    final categories = [
      const CategoryOption(id: 'todos', label: 'Todas as Series'),
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
        title: _stringValue(item['name'] ?? item['title'],
            fallback: 'Serie sem Nome'),
        subtitle: [
          if (year.isNotEmpty) year,
          _categoryName(categoryMap, catId),
        ].join(' - '),
        category: _categoryName(categoryMap, catId),
        categoryId: catId,
        streamUrl: '',
        imageUrl: _stringValue(item['cover']),
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

    throw Exception('Nenhum episodio encontrado para esta serie.');
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
      throw Exception('Servidor Xtream retornou HTTP ${response.statusCode}.');
    }

    final decoded = _decodeObject(response.body);
    final episodes = decoded['episodes'];
    if (episodes is! Map || episodes.isEmpty) {
      throw Exception('Nenhum episodio encontrado para esta serie.');
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
                ? 'Temporada $seasonNumber'
                : 'Temporada ${seasons.length + 1}',
            episodes: seasonEpisodes,
          ),
        );
      }
    }

    if (seasons.isEmpty) {
      throw Exception('Nenhum episodio encontrado para esta serie.');
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
      fallback: 'Episodio',
    );
    final episodeNum = _stringValue(json['episode_num'] ?? json['episode']);
    final seasonLabel = seasonNumber > 0 ? 'T$seasonNumber' : 'Temporada';
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
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  static Future<bool> hasSavedSession() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token') ?? '';
    final servers = prefs.getString('servers_data') ?? '';
    return token.isNotEmpty || servers.isNotEmpty;
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
            title: _stringValue(raw['title'], fallback: 'Continuar assistindo'),
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
      throw Exception('Servidor nao configurado. Faca login novamente.');
    }
    if (server.baseUrl.isEmpty ||
        server.username.isEmpty ||
        server.password.isEmpty) {
      throw Exception('Credenciais Xtream nao encontradas para este servidor.');
    }
    return server;
  }

  static Future<List<Map<String, dynamic>>> _fetchLiveProxy(
    IptvServer server,
    String action,
  ) async {
    final response = await http
        .post(
          Uri.parse('$baseUrl/lynx/xtream/live'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'baseUrl': server.cleanBaseUrl,
            'username': server.username,
            'password': server.password,
            'action': action,
          }),
        )
        .timeout(_requestTimeout);

    final decoded = _decodeObject(response.body);
    if (response.statusCode < 200 ||
        response.statusCode >= 300 ||
        decoded['success'] != true) {
      throw Exception(decoded['error'] ?? 'Falha ao carregar canais IPTV.');
    }

    final data = decoded['data'];
    if (data is! List) {
      return [];
    }
    return data
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
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
      throw Exception('Servidor Xtream retornou HTTP ${response.statusCode}.');
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

  static List<CategoryOption> _mapCategories(List<Map<String, dynamic>> data) {
    return data
        .map((item) {
          return CategoryOption(
            id: _stringValue(item['category_id']),
            label:
                _stringValue(item['category_name'], fallback: 'Sem Categoria'),
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
    var value = _stringValue(
      item['epg_now'] ??
          item['current_program'] ??
          item['now_showing'] ??
          item['epg_channel_id'],
      fallback: 'Programacao Ao Vivo',
    ).replaceFirst(RegExp(r'^EPG:\s*', caseSensitive: false), '');
    if (!RegExp(r'^\d{1,2}:\d{2}').hasMatch(value)) {
      final time = _stringValue(item['now_start'] ?? item['start_time'],
          fallback: '13:00');
      value = '$time $value';
    }
    return value;
  }

  static String _formatProgramNext(Map<String, dynamic> item) {
    var value = _stringValue(
      item['epg_next'] ?? item['next_program'] ?? item['next_showing'],
      fallback: 'Programacao Normal',
    ).replaceFirst(RegExp(r'^A seguir:\s*', caseSensitive: false), '');
    if (!RegExp(r'^\d{1,2}:\d{2}').hasMatch(value)) {
      final time = _stringValue(item['next_start'] ?? item['next_time'],
          fallback: '14:00');
      value = '$time $value';
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
