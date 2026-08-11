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
  });
}

class IptvCatalog {
  final List<CategoryOption> categories;
  final List<IptvContentItem> items;

  const IptvCatalog({required this.categories, required this.items});
}

class ApiService {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.0.2:3000/api',
  );

  static Future<Map<String, dynamic>> loginApp({
    required String licenseCode,
    required String username,
    required String password,
    required String deviceId,
    required Map<String, dynamic> deviceInfo,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/lynx/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'licenseCode': licenseCode,
        'username': username,
        'password': password,
        'deviceId': deviceId,
        'deviceInfo': deviceInfo,
      }),
    );

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

      return decoded;
    }

    throw Exception(decoded['error'] ?? 'Erro de autenticacao');
  }

  static Future<Map<String, dynamic>> requestTrial(
    String deviceId,
    Map<String, dynamic> deviceInfo,
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/v1/auth/app/trial'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'deviceId': deviceId,
        'deviceInfo': deviceInfo,
      }),
    );
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
      );
    }).toList();

    return IptvCatalog(categories: categories, items: items);
  }

  static Future<IptvContentItem> fetchFirstSeriesEpisode(
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
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Servidor Xtream retornou HTTP ${response.statusCode}.');
    }

    final decoded = _decodeObject(response.body);
    final episodes = decoded['episodes'];
    if (episodes is! Map || episodes.isEmpty) {
      throw Exception('Nenhum episodio encontrado para esta serie.');
    }

    Map<String, dynamic>? firstEpisode;
    for (final season in episodes.values) {
      if (season is List && season.isNotEmpty && season.first is Map) {
        firstEpisode = Map<String, dynamic>.from(season.first as Map);
        break;
      }
    }

    if (firstEpisode == null) {
      throw Exception('Nenhum episodio encontrado para esta serie.');
    }

    final episodeId =
        _stringValue(firstEpisode['id'] ?? firstEpisode['episode_id']);
    final ext =
        _stringValue(firstEpisode['container_extension'], fallback: 'mp4');
    var streamUrl = _stringValue(
      firstEpisode['streamUrl'] ??
          firstEpisode['url'] ??
          firstEpisode['direct_source'],
    );
    if (streamUrl.isEmpty && episodeId.isNotEmpty) {
      streamUrl =
          '${server.cleanBaseUrl}/series/${server.encodedUsername}/${server.encodedPassword}/$episodeId.$ext';
    }

    if (streamUrl.isEmpty) {
      throw Exception('Episodio sem URL de reproducao.');
    }

    final episodeTitle = _stringValue(
      firstEpisode['title'] ?? firstEpisode['name'],
      fallback: 'Episodio 1',
    );

    return IptvContentItem(
      id: episodeId.isNotEmpty ? episodeId : '${series.id}-ep-1',
      title: '${series.title} - $episodeTitle',
      subtitle: series.title,
      category: series.category,
      categoryId: series.categoryId,
      streamUrl: streamUrl,
      imageUrl: series.imageUrl,
      type: 'episode',
      rating: series.rating,
      year: series.year,
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
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
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
    final response = await http.post(
      Uri.parse('$baseUrl/lynx/xtream/live'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'baseUrl': server.cleanBaseUrl,
        'username': server.username,
        'password': server.password,
        'action': action,
      }),
    );

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
    );

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

String _cleanBaseUrl(String value) {
  var cleaned = value.trim();
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = 'http://$cleaned';
  }
  return cleaned.replaceAll(RegExp(r'/+$'), '');
}
