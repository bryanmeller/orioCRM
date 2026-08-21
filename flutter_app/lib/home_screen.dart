import 'package:flutter/material.dart';
import 'package:android_tv_text_field/native_textfield_tv.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/services.dart';

import 'api_service.dart';
import 'tv_focus.dart';
import 'tv_safe_area.dart';

enum HomeSection {
  home('Inicio', Icons.home),
  live('TV ao Vivo', Icons.live_tv),
  movies('Filmes', Icons.movie),
  series('Series', Icons.tv_rounded),
  favorites('Favoritos', Icons.favorite),
  settings('Configuracoes', Icons.settings);

  final String label;
  final IconData icon;

  const HomeSection(this.label, this.icon);
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  HomeSection _activeSection = HomeSection.home;
  String _serverName = 'Carregando...';
  String? _errorMessage;
  bool _loading = true;
  String _selectedCategory = 'todos';
  String _searchQuery = '';
  IptvContentItem? _selectedItem;
  final NativeTextFieldController _searchController =
      NativeTextFieldController();
  final FocusNode _searchFocusNode = FocusNode();
  final FocusNode _homeKeyboardFocusNode = FocusNode();
  final FocusNode _changeServerFocusNode = FocusNode();
  final FocusNode _logoutAccountFocusNode = FocusNode();
  late final Map<HomeSection, FocusNode> _sidebarFocusNodes;

  IptvCatalog _liveCatalog = const IptvCatalog(categories: [], items: []);
  IptvCatalog _movieCatalog = const IptvCatalog(categories: [], items: []);
  IptvCatalog _seriesCatalog = const IptvCatalog(categories: [], items: []);
  List<ContinueWatchingItem> _continueWatchingItems = const [];
  final Set<String> _favorites = {};
  DateTime? _lastHomeBackPress;
  bool _sidebarExpanded = true;

  @override
  void initState() {
    super.initState();
    _sidebarFocusNodes = {
      for (final section in HomeSection.values) section: FocusNode(),
    };
    _searchFocusNode.addListener(_handleSearchFocusChange);
    _loadHome();
  }

  @override
  void dispose() {
    _searchFocusNode.removeListener(_handleSearchFocusChange);
    _homeKeyboardFocusNode.dispose();
    _changeServerFocusNode.dispose();
    _logoutAccountFocusNode.dispose();
    for (final node in _sidebarFocusNodes.values) {
      node.dispose();
    }
    _searchFocusNode.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _handleSearchFocusChange() {
    if (mounted) {
      setState(() {});
    }
    if (_searchFocusNode.hasFocus) {
      _collapseSidebar();
    }
  }

  Future<void> _loadHome() async {
    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    try {
      final prefs = await SharedPreferences.getInstance();
      final server = await ApiService.getActiveServer();
      final savedFavorites = prefs.getStringList('favorites') ?? [];
      final continueWatching = await ApiService.getContinueWatchingItems();
      final serverName = server?.name ??
          prefs.getString('selected_server_name') ??
          'Servidor Desconhecido';

      if (mounted) {
        setState(() => _serverName = serverName);
      }

      final catalogs = await Future.wait([
        ApiService.fetchLiveCatalog(),
        ApiService.fetchMoviesCatalog(),
        ApiService.fetchSeriesCatalog(),
      ]);

      if (!mounted) {
        return;
      }

      setState(() {
        _serverName = serverName;
        _liveCatalog = catalogs[0];
        _movieCatalog = catalogs[1];
        _seriesCatalog = catalogs[2];
        _continueWatchingItems = continueWatching;
        _favorites
          ..clear()
          ..addAll(savedFavorites);
        _selectedItem = _liveCatalog.items.isNotEmpty
            ? _liveCatalog.items.first
            : _movieCatalog.items.isNotEmpty
                ? _movieCatalog.items.first
                : _seriesCatalog.items.isNotEmpty
                    ? _seriesCatalog.items.first
                    : null;
        _loading = false;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _loading = false;
        _errorMessage = _friendlyError(error);
      });
    }
  }

  String _friendlyError(Object error) {
    final message = error.toString().replaceAll('Exception: ', '');
    if (message.contains('TimeoutException')) {
      return 'Tempo limite ao consultar o servidor. Tente novamente ou troque de servidor.';
    }
    return message;
  }

  Future<void> _handleLogout() async {
    await ApiService.logout();
    if (!mounted) {
      return;
    }
    Navigator.of(context).pushReplacementNamed('/');
  }

  Future<void> _handleChangeServer() async {
    final servers = await ApiService.getSavedServers();
    if (!mounted) {
      return;
    }

    if (servers.length <= 1) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Nao ha outro servidor salvo para selecionar.'),
          duration: Duration(seconds: 2),
        ),
      );
      return;
    }

    final activeServer = await ApiService.getActiveServer();
    if (!mounted) {
      return;
    }

    final selectedServer = await showDialog<IptvServer>(
      context: context,
      barrierDismissible: true,
      builder: (context) {
        return AlertDialog(
          backgroundColor: const Color(0xFF101216),
          title: const Text('Trocar servidor'),
          content: SizedBox(
            width: 520,
            height: (servers.length * 58.0).clamp(120.0, 320.0),
            child: ListView.separated(
              itemCount: servers.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final server = servers[index];
                final selected = server.id == activeServer?.id;
                return TvFocusable(
                  autofocus: index == 0,
                  onPressed: () => Navigator.of(context).pop(server),
                  builder: (context, focused) => AnimatedContainer(
                    duration: const Duration(milliseconds: 120),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 12,
                    ),
                    decoration: tvFocusDecoration(
                      focused: focused,
                      baseColor: selected
                          ? const Color(0x332E9BFF)
                          : const Color(0xFF151720),
                      radius: 12,
                      borderColor:
                          selected ? const Color(0xFFB47CFF) : Colors.white10,
                    ),
                    child: Row(
                      children: [
                        Icon(
                          selected
                              ? Icons.radio_button_checked
                              : Icons.radio_button_unchecked,
                          color: selected
                              ? const Color(0xFFB47CFF)
                              : Colors.white54,
                          size: 18,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            server.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancelar'),
            ),
          ],
        );
      },
    );

    if (selectedServer == null || !mounted) {
      return;
    }

    await ApiService.selectActiveServer(selectedServer);
    if (!mounted) {
      return;
    }

    setState(() {
      _serverName = selectedServer.name;
      _errorMessage = null;
      _selectedCategory = 'todos';
      _selectedItem = null;
      _liveCatalog = const IptvCatalog(categories: [], items: []);
      _movieCatalog = const IptvCatalog(categories: [], items: []);
      _seriesCatalog = const IptvCatalog(categories: [], items: []);
      _continueWatchingItems = const [];
    });
    await _loadHome();
  }

  Future<void> _confirmExitApp() async {
    final shouldExit = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return AlertDialog(
          backgroundColor: const Color(0xFF101216),
          title: const Text('Fechar aplicativo?'),
          content: const Text('Tem certeza que deseja fechar o Orio Player?'),
          actions: [
            TextButton(
              autofocus: true,
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Nao'),
            ),
            TextButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: const Text('OK'),
            ),
          ],
        );
      },
    );

    if (shouldExit == true) {
      SystemNavigator.pop();
    }
  }

  Future<void> _handleBackNavigation() async {
    if (_activeSection != HomeSection.home) {
      _lastHomeBackPress = null;
      _selectSection(HomeSection.home);
      return;
    }

    final now = DateTime.now();
    final lastPress = _lastHomeBackPress;
    if (lastPress == null ||
        now.difference(lastPress) > const Duration(seconds: 2)) {
      _lastHomeBackPress = now;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Pressione voltar novamente para fechar.'),
          duration: Duration(seconds: 2),
        ),
      );
      return;
    }

    _lastHomeBackPress = null;
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    await _confirmExitApp();
  }

  IptvCatalog get _activeCatalog {
    switch (_activeSection) {
      case HomeSection.live:
        return _liveCatalog;
      case HomeSection.movies:
        return _movieCatalog;
      case HomeSection.series:
        return _seriesCatalog;
      case HomeSection.favorites:
        final items = [
          ..._liveCatalog.items,
          ..._movieCatalog.items,
          ..._seriesCatalog.items,
        ].where((item) => _favorites.contains(item.id)).toList();
        return IptvCatalog(
          categories: const [CategoryOption(id: 'todos', label: 'Favoritos')],
          items: items,
        );
      case HomeSection.home:
      case HomeSection.settings:
        return _liveCatalog;
    }
  }

  List<IptvContentItem> get _filteredItems {
    var items = _activeCatalog.items;
    if (_selectedCategory != 'todos') {
      items =
          items.where((item) => item.categoryId == _selectedCategory).toList();
    }

    final query = _normalizedSearch(_searchQuery);
    if (query.isEmpty) {
      return items;
    }

    return items.where((item) {
      return _normalizedSearch(_searchableText(item)).contains(query);
    }).toList();
  }

  void _selectSection(HomeSection section) {
    setState(() {
      _activeSection = section;
      _sidebarExpanded = false;
      _selectedCategory = 'todos';
      _searchQuery = '';
      _searchController.clear();
      final catalog = _activeCatalog;
      _selectedItem = catalog.items.isNotEmpty ? catalog.items.first : null;
    });

    if (section == HomeSection.settings) {
      _focusSettingsFirstAction();
    }
  }

  void _expandSidebar() {
    if (!_sidebarExpanded) {
      setState(() => _sidebarExpanded = true);
    }
  }

  void _collapseSidebar() {
    if (_sidebarExpanded) {
      setState(() => _sidebarExpanded = false);
    }
  }

  bool _isSidebarFocused() {
    return _sidebarFocusNodes.values.any((node) => node.hasFocus);
  }

  void _focusActiveSidebarItem() {
    _searchFocusNode.unfocus();
    _expandSidebar();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) {
        return;
      }
      (_sidebarFocusNodes[_activeSection] ??
              _sidebarFocusNodes[HomeSection.home])
          ?.requestFocus();
    });
  }

  void _focusSettingsFirstAction() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _changeServerFocusNode.requestFocus();
      }
    });
  }

  KeyEventResult _handleSidebarKey(
    HomeSection section,
    FocusNode node,
    KeyEvent event,
  ) {
    if (event is! KeyDownEvent) {
      return KeyEventResult.ignored;
    }

    if (event.logicalKey == LogicalKeyboardKey.arrowRight &&
        section == HomeSection.settings) {
      _selectSection(HomeSection.settings);
      return KeyEventResult.handled;
    }

    return KeyEventResult.ignored;
  }

  KeyEventResult _handleHomeKeyEvent(FocusNode node, KeyEvent event) {
    if (event is! KeyDownEvent) {
      return KeyEventResult.ignored;
    }

    if (FocusManager.instance.primaryFocus != node) {
      return KeyEventResult.ignored;
    }

    if (event.logicalKey == LogicalKeyboardKey.arrowLeft &&
        !_isSidebarFocused()) {
      _focusActiveSidebarItem();
      return KeyEventResult.handled;
    }

    return KeyEventResult.ignored;
  }

  KeyEventResult _handleContentFocusableKey(
    FocusNode node,
    KeyEvent event, {
    bool moveLeftToSidebar = true,
  }) {
    if (event is KeyDownEvent &&
        event.logicalKey == LogicalKeyboardKey.arrowLeft &&
        moveLeftToSidebar &&
        !_isSidebarFocused()) {
      _focusActiveSidebarItem();
      return KeyEventResult.handled;
    }

    return KeyEventResult.ignored;
  }

  FocusOnKeyEventCallback? _leftToSidebarKeyHandler(bool enabled) {
    if (!enabled) {
      return null;
    }
    return (node, event) => _handleContentFocusableKey(node, event);
  }

  void _selectCategory(String categoryId) {
    setState(() {
      _selectedCategory = categoryId;
      final filteredItems = _filteredItems;
      _selectedItem = filteredItems.isNotEmpty ? filteredItems.first : null;
    });
  }

  void _applySearch(String value) {
    setState(() {
      _searchQuery = value.trim();
      final items = _filteredItems;
      _selectedItem = items.isNotEmpty ? items.first : null;
    });
  }

  void _clearSearch() {
    _searchController.clear();
    _applySearch('');
  }

  String _searchableText(IptvContentItem item) {
    return [
      item.title,
      item.subtitle,
      item.category,
      item.nextShowing ?? '',
      item.year ?? '',
    ].join(' ');
  }

  String _normalizedSearch(String value) {
    return value
        .toLowerCase()
        .replaceAll(RegExp(r'[áàãâä]'), 'a')
        .replaceAll(RegExp(r'[éèêë]'), 'e')
        .replaceAll(RegExp(r'[íìîï]'), 'i')
        .replaceAll(RegExp(r'[óòõôö]'), 'o')
        .replaceAll(RegExp(r'[úùûü]'), 'u')
        .replaceAll('ç', 'c')
        .trim();
  }

  bool _isGamesOfTheDayCategory(String category) {
    final normalized = _normalizedSearch(category);
    return normalized == 'canais | jogos do dia' ||
        normalized == 'canais jogos do dia' ||
        normalized.contains('jogos do dia');
  }

  List<IptvContentItem> get _gamesOfTheDayItems {
    return _liveCatalog.items
        .where((item) => _isGamesOfTheDayCategory(item.category))
        .toList();
  }

  List<IptvContentItem> get _favoriteHomeItems {
    return [
      ..._liveCatalog.items,
      ..._movieCatalog.items,
      ..._seriesCatalog.items,
    ].where((item) => _favorites.contains(item.id)).toList();
  }

  bool _isFavorite(IptvContentItem item) {
    return _favorites.contains(item.id);
  }

  String _favoriteActionLabel(IptvContentItem item) {
    return _isFavorite(item) ? 'REMOVER' : 'FAVORITAR';
  }

  IconData _favoriteActionIcon(IptvContentItem item) {
    return _isFavorite(item) ? Icons.heart_broken : Icons.favorite;
  }

  Future<void> _toggleFavorite(IptvContentItem item) async {
    setState(() {
      if (_favorites.contains(item.id)) {
        _favorites.remove(item.id);
      } else {
        _favorites.add(item.id);
      }

      if (_activeSection == HomeSection.favorites) {
        final items = _filteredItems;
        if (items.isEmpty) {
          _selectedItem = null;
        } else if (_selectedItem == null ||
            !items.any((content) => content.id == _selectedItem!.id)) {
          _selectedItem = items.first;
        }
      }
    });

    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList('favorites', _favorites.toList());
  }

  bool _isOnDemandContent(IptvContentItem item) {
    return item.type == 'movie' ||
        item.type == 'series' ||
        item.type == 'episode';
  }

  Future<Duration?> _askResumePositionIfNeeded(IptvContentItem item) async {
    if (!_isOnDemandContent(item) || item.type == 'series') {
      return null;
    }

    final position = await ApiService.getSavedPlaybackPosition(
      ApiService.playbackContentId(item),
    );
    if (position == null || !mounted) {
      return null;
    }

    return showDialog<Duration?>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF101216),
        title: const Text('Continuar assistindo?'),
        content: Text(
          'Voce parou em ${_formatResumeTime(position)}. Deseja continuar de onde parou?',
        ),
        actions: [
          TextButton(
            autofocus: true,
            onPressed: () => Navigator.of(context).pop(position),
            child: const Text('Continuar'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(Duration.zero),
            child: const Text('Ver do inicio'),
          ),
        ],
      ),
    );
  }

  String _formatResumeTime(Duration duration) {
    final hours = duration.inHours;
    final minutes = duration.inMinutes.remainder(60);
    final seconds = duration.inSeconds.remainder(60);
    if (hours > 0) {
      return '$hours:${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
    }
    return '$minutes:${seconds.toString().padLeft(2, '0')}';
  }

  Future<void> _playItem(IptvContentItem item) async {
    try {
      if (item.type == 'series') {
        Navigator.of(context).pushNamed('/series', arguments: item);
        return;
      }

      if (item.streamUrl.isEmpty) {
        throw Exception('Este conteudo nao possui URL de reproducao.');
      }

      if (!mounted) {
        return;
      }

      final resumePosition = await _askResumePositionIfNeeded(item);
      if (!mounted) {
        return;
      }

      await Navigator.of(context).pushNamed(
        '/player',
        arguments: {
          'title': item.title,
          'subtitle': item.subtitle,
          'description': item.description,
          'imageUrl': item.imageUrl,
          'category': item.category,
          'videoUrl': item.streamUrl,
          'alternateVideoUrls': item.alternateStreamUrls,
          'contentType': item.type,
          'contentId': ApiService.playbackContentId(item),
          'favoriteId': item.id,
          if (item.type == 'live') 'liveChannels': _liveCatalog.items,
          'resumePositionMs': resumePosition?.inMilliseconds ?? 0,
        },
      );
      if (mounted) {
        final prefs = await SharedPreferences.getInstance();
        final savedFavorites = prefs.getStringList('favorites') ?? [];
        final continueWatching = await ApiService.getContinueWatchingItems();
        setState(() {
          _favorites
            ..clear()
            ..addAll(savedFavorites);
          _continueWatchingItems = continueWatching;
        });
      }
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _errorMessage = error.toString().replaceAll('Exception: ', '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) {
          _handleBackNavigation();
        }
      },
      child: Scaffold(
        backgroundColor: Colors.black,
        body: KeyboardListener(
          focusNode: _homeKeyboardFocusNode,
          autofocus: true,
          onKeyEvent: (event) => _handleHomeKeyEvent(
            _homeKeyboardFocusNode,
            event,
          ),
          child: TvOverscanSafeArea(
            backgroundColor: const Color(0xFF070708),
            child: Row(
              children: [
                _buildSidebar(),
                Expanded(
                  child: FocusScope(
                    onFocusChange: (focused) {
                      if (focused) {
                        _collapseSidebar();
                      }
                    },
                    child: Container(
                      color: const Color(0xFF070708),
                      child: Column(
                        children: [
                          _buildTopBar(),
                          Expanded(
                            child: _loading ? _buildLoading() : _buildContent(),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSidebar() {
    final expanded = _sidebarExpanded;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      curve: Curves.easeOutCubic,
      width: expanded ? 238 : 72,
      color: const Color(0xFF0C0D11),
      padding: EdgeInsets.fromLTRB(
        expanded ? 12 : 10,
        18,
        expanded ? 12 : 10,
        12,
      ),
      child: Column(
        crossAxisAlignment:
            expanded ? CrossAxisAlignment.start : CrossAxisAlignment.center,
        children: [
          ClipRect(
            child: Container(
              padding: EdgeInsets.all(expanded ? 10 : 8),
              decoration: BoxDecoration(
                color: const Color(0xFF121216),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white10),
              ),
              child: Row(
                mainAxisAlignment: expanded
                    ? MainAxisAlignment.start
                    : MainAxisAlignment.center,
                children: [
                  SizedBox(
                    width: expanded ? 42 : 28,
                    height: expanded ? 40 : 28,
                    child: Image.asset(
                      'assets/images/orio_logo.png',
                      fit: BoxFit.contain,
                      alignment: Alignment.centerLeft,
                    ),
                  ),
                  if (expanded) ...[
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Text(
                        'ORIO PLAYER',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                ...HomeSection.values.map((section) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 7),
                    child: _buildMenuItem(section),
                  );
                }),
                if (expanded) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF101217),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.white10),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.dns_rounded,
                          color: Color(0xFFB47CFF),
                          size: 18,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            _serverName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItem(HomeSection section) {
    final active = _activeSection == section;
    final expanded = _sidebarExpanded;
    return TvFocusable(
      focusNode: _sidebarFocusNodes[section],
      autofocus: section == HomeSection.home,
      onKeyEvent: (node, event) => _handleSidebarKey(section, node, event),
      onFocusChange: (focused) {
        if (focused) {
          _expandSidebar();
        }
      },
      onPressed: () => _selectSection(section),
      builder: (context, focused) => AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        padding: EdgeInsets.symmetric(
          vertical: 11,
          horizontal: expanded ? 12 : 0,
        ),
        decoration: tvFocusDecoration(
          focused: focused,
          baseColor: active ? const Color(0xFF18191F) : const Color(0x00000000),
          radius: 12,
          borderColor: active ? const Color(0xFF6A00FF) : Colors.transparent,
        ),
        child: Row(
          mainAxisAlignment:
              expanded ? MainAxisAlignment.start : MainAxisAlignment.center,
          children: [
            Icon(
              section.icon,
              color: active ? const Color(0xFF6A00FF) : Colors.white54,
              size: 18,
            ),
            if (expanded) ...[
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  section.label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: active ? Colors.white : Colors.white54,
                    fontSize: 13,
                    fontWeight: active ? FontWeight.bold : FontWeight.w500,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildTopBar() {
    final canSearch = _activeSection == HomeSection.live ||
        _activeSection == HomeSection.movies ||
        _activeSection == HomeSection.series ||
        _activeSection == HomeSection.favorites;

    return Container(
      height: 86,
      padding: const EdgeInsets.symmetric(horizontal: 28),
      decoration: const BoxDecoration(
        color: Color(0xFF08090D),
        border: Border(bottom: BorderSide(color: Colors.white10)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _activeSection.label,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Servidor: $_serverName',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: Colors.white54, fontSize: 13),
                ),
              ],
            ),
          ),
          Row(
            children: [
              if (canSearch) ...[
                SizedBox(width: 280, child: _buildSearchBar(compact: true)),
                const SizedBox(width: 12),
              ],
              TvFocusable(
                onPressed: _loadHome,
                onFocusChange: (focused) {
                  if (focused) {
                    _collapseSidebar();
                  }
                },
                builder: (context, focused) => AnimatedContainer(
                  duration: const Duration(milliseconds: 120),
                  width: 48,
                  height: 48,
                  decoration: tvFocusDecoration(
                    focused: focused,
                    baseColor: const Color(0xFF101216),
                    radius: 14,
                  ),
                  child: const Icon(Icons.refresh, color: Colors.white70),
                ),
              ),
              const SizedBox(width: 8),
              _buildFocusButton(
                icon: Icons.exit_to_app,
                label: 'Sair',
                onPressed: _confirmExitApp,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    if (_activeSection == HomeSection.settings) {
      return _buildSettings();
    }

    if (_activeSection == HomeSection.home) {
      return _buildHomeDashboard();
    }

    return Padding(
      padding: const EdgeInsets.all(18),
      child: Column(
        children: [
          _buildCategoryRail(_activeCatalog.categories),
          const SizedBox(height: 12),
          _buildCatalogSummary(),
          const SizedBox(height: 12),
          Expanded(child: _buildCatalogList(_filteredItems)),
        ],
      ),
    );
  }

  Widget _buildHomeDashboard() {
    final gamesOfTheDay = _gamesOfTheDayItems;
    final favoriteItems = _favoriteHomeItems;
    final livePreview = _liveCatalog.items.take(8).toList();
    final moviesPreview = _movieCatalog.items.take(10).toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (gamesOfTheDay.isNotEmpty) ...[
            _buildGamesOfTheDaySection(gamesOfTheDay),
          ],
          if (_continueWatchingItems.isNotEmpty) ...[
            const SizedBox(height: 22),
            _buildContinueWatchingSection(),
          ],
          if (favoriteItems.isNotEmpty) ...[
            const SizedBox(height: 22),
            _buildFavoritesSection(favoriteItems),
          ],
          const SizedBox(height: 22),
          _buildSectionHeader('TV ao Vivo', HomeSection.live),
          const SizedBox(height: 12),
          _buildHorizontalRail(livePreview, compact: true),
          const SizedBox(height: 24),
          _buildSectionHeader('Filmes em Destaque', HomeSection.movies),
          const SizedBox(height: 12),
          _buildHorizontalRail(moviesPreview),
          if (_errorMessage != null) ...[
            const SizedBox(height: 18),
            _buildInlineError(_errorMessage!),
          ],
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, HomeSection target) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        TvFocusable(
          onKeyEvent: _handleContentFocusableKey,
          onFocusChange: (focused) {
            if (focused) {
              _collapseSidebar();
            }
          },
          onPressed: () => _selectSection(target),
          builder: (context, focused) => AnimatedContainer(
            duration: const Duration(milliseconds: 120),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: tvFocusDecoration(
              focused: focused,
              baseColor: const Color(0xFF101216),
              radius: 12,
            ),
            child: const Text(
              'Ver tudo',
              style: TextStyle(
                color: Color(0xFFD8C6FF),
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildContinueWatchingSection() {
    final items = _continueWatchingItems.take(12).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Continuar Assistindo',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        LayoutBuilder(
          builder: (context, constraints) {
            const gap = 12.0;
            final cardWidth = _fourAcrossCardWidth(constraints.maxWidth, gap);

            return SizedBox(
              height: 176,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: items.length,
                separatorBuilder: (_, __) => const SizedBox(width: gap),
                itemBuilder: (context, index) {
                  return _buildContinueWatchingCard(
                    items[index],
                    width: cardWidth,
                    moveLeftToSidebar: index == 0,
                  );
                },
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildContinueWatchingCard(
    ContinueWatchingItem progressItem, {
    required double width,
    bool moveLeftToSidebar = false,
  }) {
    final item = progressItem.item;
    final progress = progressItem.progress;
    final timeLabel = progressItem.duration > Duration.zero
        ? '${_formatResumeTime(progressItem.position)} / ${_formatResumeTime(progressItem.duration)}'
        : _formatResumeTime(progressItem.position);

    return TvFocusable(
      onKeyEvent: _leftToSidebarKeyHandler(moveLeftToSidebar),
      onPressed: () => _playItem(item),
      onFocusChange: (focused) {
        if (focused) {
          _collapseSidebar();
        }
      },
      builder: (context, focused) => AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        width: width,
        clipBehavior: Clip.antiAlias,
        decoration: tvFocusDecoration(
          focused: focused,
          baseColor: const Color(0xFF101216),
          radius: 16,
          focusedColor: const Color(0xFFB47CFF),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  _buildImage(item.imageUrl),
                  Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.transparent, Color(0xCC000000)],
                      ),
                    ),
                  ),
                  const Center(
                    child: Icon(
                      Icons.play_circle_fill_rounded,
                      color: Colors.white,
                      size: 42,
                    ),
                  ),
                  Positioned(
                    left: 10,
                    right: 10,
                    bottom: 10,
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(999),
                      child: LinearProgressIndicator(
                        value: progress,
                        minHeight: 5,
                        backgroundColor: Colors.white24,
                        valueColor: const AlwaysStoppedAnimation<Color>(
                          Color(0xFFB47CFF),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    timeLabel,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white54,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFavoritesSection(List<IptvContentItem> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Favoritos',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            TvFocusable(
              onFocusChange: (focused) {
                if (focused) {
                  _collapseSidebar();
                }
              },
              onPressed: () => _selectSection(HomeSection.favorites),
              builder: (context, focused) => AnimatedContainer(
                duration: const Duration(milliseconds: 120),
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: tvFocusDecoration(
                  focused: focused,
                  baseColor: const Color(0xFF101216),
                  radius: 12,
                ),
                child: const Text(
                  'Ver tudo',
                  style: TextStyle(
                    color: Color(0xFFD8C6FF),
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        LayoutBuilder(
          builder: (context, constraints) {
            const gap = 12.0;
            final cardWidth = _fourAcrossCardWidth(constraints.maxWidth, gap);

            return SizedBox(
              height: 164,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: items.length,
                separatorBuilder: (_, __) => const SizedBox(width: gap),
                itemBuilder: (context, index) {
                  return _buildFavoriteHomeCard(
                    items[index],
                    width: cardWidth,
                    moveLeftToSidebar: index == 0,
                  );
                },
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildFavoriteHomeCard(
    IptvContentItem item, {
    required double width,
    bool moveLeftToSidebar = false,
  }) {
    return TvFocusable(
      onKeyEvent: _leftToSidebarKeyHandler(moveLeftToSidebar),
      onPressed: () => _playItem(item),
      onFocusChange: (focused) {
        if (focused) {
          _collapseSidebar();
          setState(() => _selectedItem = item);
        }
      },
      builder: (context, focused) => AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        width: width,
        clipBehavior: Clip.antiAlias,
        decoration: tvFocusDecoration(
          focused: focused,
          baseColor: const Color(0xFF101216),
          radius: 16,
          focusedColor: const Color(0xFFB47CFF),
        ),
        child: Stack(
          fit: StackFit.expand,
          children: [
            _buildImage(item.imageUrl),
            Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.transparent, Color(0xEE050508)],
                ),
              ),
            ),
            Positioned(
              top: 10,
              left: 10,
              child:
                  _buildBadge(item.type == 'live' ? 'AO VIVO' : item.category),
            ),
            const Positioned(
              top: 12,
              right: 12,
              child: Icon(
                Icons.favorite,
                color: Color(0xFFB47CFF),
                size: 20,
              ),
            ),
            Positioned(
              left: 12,
              right: 12,
              bottom: 12,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    item.subtitle.isNotEmpty ? item.subtitle : item.category,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGamesOfTheDaySection(List<IptvContentItem> items) {
    if (items.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Jogos do Dia',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        LayoutBuilder(
          builder: (context, constraints) {
            const gap = 12.0;
            final cardWidth = _fourAcrossCardWidth(constraints.maxWidth, gap);

            return SizedBox(
              height: 164,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: items.length,
                separatorBuilder: (_, __) => const SizedBox(width: gap),
                itemBuilder: (context, index) => _buildGameDayCard(
                  items[index],
                  width: cardWidth,
                  moveLeftToSidebar: index == 0,
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  double _fourAcrossCardWidth(double maxWidth, double gap) {
    return ((maxWidth - (gap * 3)) / 4).clamp(156.0, 246.0).toDouble();
  }

  Widget _buildGameDayCard(
    IptvContentItem item, {
    required double width,
    bool moveLeftToSidebar = false,
  }) {
    return TvFocusable(
      onKeyEvent: _leftToSidebarKeyHandler(moveLeftToSidebar),
      onPressed: () => _playItem(item),
      onFocusChange: (focused) {
        if (focused) {
          _collapseSidebar();
        }
      },
      builder: (context, focused) => AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        width: width,
        clipBehavior: Clip.antiAlias,
        decoration: tvFocusDecoration(
          focused: focused,
          baseColor: const Color(0xFF101216),
          radius: 16,
          focusedColor: const Color(0xFFB47CFF),
        ),
        child: Stack(
          fit: StackFit.expand,
          children: [
            _buildImage(item.imageUrl),
            Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.transparent, Color(0xEE050508)],
                ),
              ),
            ),
            Positioned(
              top: 10,
              left: 10,
              child: _buildBadge('AO VIVO'),
            ),
            Positioned(
              right: 8,
              top: 8,
              child: Container(
                width: 32,
                height: 32,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: const Color(0xAA101216),
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: Colors.white24),
                ),
                child: Icon(
                  _isFavorite(item) ? Icons.favorite : Icons.favorite_border,
                  color: _isFavorite(item)
                      ? const Color(0xFFB47CFF)
                      : Colors.white,
                  size: 20,
                ),
              ),
            ),
            Positioned(
              left: 12,
              right: 12,
              bottom: 12,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    item.subtitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryRail(List<CategoryOption> categories) {
    if (categories.isEmpty) {
      return const SizedBox.shrink();
    }

    return SizedBox(
      height: 44,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: categories.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final category = categories[index];
          final active = _selectedCategory == category.id;
          return TvFocusable(
            onKeyEvent: _leftToSidebarKeyHandler(index == 0),
            onPressed: () => _selectCategory(category.id),
            onFocusChange: (focused) {
              if (focused) {
                _collapseSidebar();
              }
            },
            builder: (context, focused) => AnimatedContainer(
              duration: const Duration(milliseconds: 120),
              padding: const EdgeInsets.symmetric(horizontal: 14),
              alignment: Alignment.center,
              decoration: tvFocusDecoration(
                focused: focused,
                baseColor:
                    active ? const Color(0xFF6A00FF) : const Color(0xFF101216),
                radius: 18,
                borderColor: active ? const Color(0xFFB47CFF) : Colors.white10,
              ),
              child: Text(
                category.label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: active ? Colors.white : Colors.white60,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSearchBar({bool compact = false}) {
    final sectionName = _activeSection == HomeSection.live
        ? 'canais'
        : _activeSection == HomeSection.movies
            ? 'filmes'
            : _activeSection == HomeSection.series
                ? 'series'
                : 'conteudos';

    return Focus(
      canRequestFocus: false,
      onKeyEvent: _leftToSidebarKeyHandler(true),
      child: SizedBox(
        height: compact ? 48 : 52,
        child: AndroidTVTextField(
          key: ValueKey('search-${_activeSection.name}'),
          focusNode: _searchFocusNode,
          controller: _searchController,
          height: compact ? 48 : 52,
          hint: 'Pesquisar $sectionName',
          backgroundColor: const Color(0xFF101216),
          textColor: Colors.white,
          focuesedBorderColor: const Color(0xFFB47CFF),
          unFocuesedBorderColor: Colors.white10,
          onSubmitted: _applySearch,
          postFixWidget: _searchQuery.isEmpty
              ? const Icon(Icons.search, color: Color(0xFFB47CFF), size: 22)
              : IconButton(
                  onPressed: _clearSearch,
                  icon: const Icon(Icons.close, color: Colors.white54),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints.tightFor(
                    width: 36,
                    height: 36,
                  ),
                  visualDensity: VisualDensity.compact,
                ),
        ),
      ),
    );
  }

  Widget _buildCatalogSummary() {
    final item = _selectedItem;
    final count = _filteredItems.length;

    return Container(
      height: 92,
      padding: const EdgeInsets.all(14),
      decoration: _panelDecoration(radius: 18),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: SizedBox(
              width: 92,
              height: 64,
              child: _buildImage(item?.imageUrl ?? ''),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  item?.title ?? _activeSection.label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  '$count itens carregados - ${item?.category ?? 'Todas as categorias'}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white60,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          if (item != null)
            _buildFocusButton(
              icon: Icons.play_arrow,
              label: 'ASSISTIR',
              onPressed: () => _playItem(item),
              moveLeftToSidebar: true,
            ),
          if (item != null) ...[
            const SizedBox(width: 10),
            _buildFocusButton(
              icon: _favoriteActionIcon(item),
              label: _favoriteActionLabel(item),
              onPressed: () => _toggleFavorite(item),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildCatalogList(List<IptvContentItem> items) {
    if (_errorMessage != null) {
      return _buildError();
    }

    if (items.isEmpty) {
      final message = _searchQuery.trim().isEmpty
          ? 'Nenhum conteudo encontrado nesta categoria.'
          : 'Nenhum resultado para "${_searchQuery.trim()}".';
      return Center(
        child: Text(
          message,
          style: const TextStyle(color: Colors.white70),
        ),
      );
    }

    if (_activeSection == HomeSection.live) {
      return _buildLiveRows(items);
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        const maxCrossAxisExtent = 178.0;
        const crossAxisSpacing = 12.0;
        final crossAxisCount =
            (constraints.maxWidth / (maxCrossAxisExtent + crossAxisSpacing))
                .ceil()
                .clamp(1, items.length);

        return GridView.builder(
          padding: EdgeInsets.zero,
          gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
            maxCrossAxisExtent: maxCrossAxisExtent,
            mainAxisSpacing: 12,
            crossAxisSpacing: crossAxisSpacing,
            childAspectRatio: 0.78,
          ),
          itemCount: items.length,
          itemBuilder: (context, index) => _buildPosterCard(
            items[index],
            moveLeftToSidebar: index % crossAxisCount == 0,
          ),
        );
      },
    );
  }

  Widget _buildLiveRows(List<IptvContentItem> items) {
    return Container(
      decoration: _panelDecoration(radius: 18),
      child: Column(
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 12, 16, 10),
            child: Row(
              children: [
                SizedBox(width: 64, child: Text('CANAL', style: _HeaderText())),
                Expanded(flex: 3, child: Text('NOME', style: _HeaderText())),
                Expanded(flex: 3, child: Text('AGORA', style: _HeaderText())),
                Expanded(flex: 3, child: Text('PROXIMO', style: _HeaderText())),
                SizedBox(width: 40, child: Text('FAV', style: _HeaderText())),
              ],
            ),
          ),
          const Divider(height: 1, color: Colors.white10),
          Expanded(
            child: ListView.separated(
              itemCount: items.length,
              separatorBuilder: (_, __) =>
                  const Divider(height: 1, color: Colors.white10),
              itemBuilder: (context, index) {
                final item = items[index];
                final selected = _selectedItem?.id == item.id;
                return TvFocusable(
                  onKeyEvent: _handleContentFocusableKey,
                  onPressed: () {
                    setState(() => _selectedItem = item);
                    _playItem(item);
                  },
                  onFocusChange: (focused) {
                    if (focused) {
                      _collapseSidebar();
                      setState(() => _selectedItem = item);
                    }
                  },
                  builder: (context, focused) => AnimatedContainer(
                    duration: const Duration(milliseconds: 120),
                    decoration: tvFocusDecoration(
                      focused: focused,
                      baseColor: selected
                          ? const Color(0x336A00FF)
                          : Colors.transparent,
                      radius: 0,
                      borderColor: Colors.transparent,
                    ),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 11,
                    ),
                    child: Row(
                      children: [
                        SizedBox(
                          width: 64,
                          child: Text(
                            '${index + 1}'.padLeft(3, '0'),
                            style: const TextStyle(
                              color: Color(0xFFB47CFF),
                              fontFamily: 'monospace',
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                        Expanded(
                          flex: 3,
                          child: Text(
                            item.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        Expanded(
                          flex: 3,
                          child: Text(
                            item.subtitle,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Color(0xFFD8C6FF),
                              fontSize: 11,
                            ),
                          ),
                        ),
                        Expanded(
                          flex: 3,
                          child: Text(
                            item.nextShowing ?? '',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white54,
                              fontSize: 11,
                            ),
                          ),
                        ),
                        SizedBox(
                          width: 40,
                          child: Icon(
                            _isFavorite(item)
                                ? Icons.favorite
                                : Icons.favorite_border,
                            color: _isFavorite(item)
                                ? const Color(0xFFB47CFF)
                                : Colors.white30,
                            size: 18,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHorizontalRail(List<IptvContentItem> items,
      {bool compact = false}) {
    if (items.isEmpty) {
      return _buildInlineError('Nenhum conteudo carregado.');
    }

    return SizedBox(
      height: compact ? 138 : 230,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(width: 14),
        itemBuilder: (context, index) {
          final item = items[index];
          return compact
              ? _buildCompactCard(item, moveLeftToSidebar: index == 0)
              : _buildPosterCard(item, moveLeftToSidebar: index == 0);
        },
      ),
    );
  }

  Widget _buildCompactCard(
    IptvContentItem item, {
    bool moveLeftToSidebar = false,
  }) {
    return TvFocusable(
      onKeyEvent: _leftToSidebarKeyHandler(moveLeftToSidebar),
      onPressed: () => _playItem(item),
      onFocusChange: (focused) {
        if (focused) {
          _collapseSidebar();
          setState(() => _selectedItem = item);
        }
      },
      builder: (context, focused) => AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        width: 250,
        padding: const EdgeInsets.all(14),
        decoration: tvFocusDecoration(
          focused: focused,
          baseColor: const Color(0xFF101216),
          radius: 18,
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: SizedBox(
                width: 74,
                height: 74,
                child: _buildImage(item.imageUrl),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    item.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    item.category,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: Colors.white54, fontSize: 11),
                  ),
                ],
              ),
            ),
            Icon(
              _isFavorite(item) ? Icons.favorite : Icons.favorite_border,
              color:
                  _isFavorite(item) ? const Color(0xFFB47CFF) : Colors.white30,
              size: 18,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPosterCard(
    IptvContentItem item, {
    bool moveLeftToSidebar = false,
  }) {
    return TvFocusable(
      onKeyEvent: _leftToSidebarKeyHandler(moveLeftToSidebar),
      onPressed: () => _playItem(item),
      onFocusChange: (focused) {
        if (focused) {
          _collapseSidebar();
          setState(() => _selectedItem = item);
        }
      },
      builder: (context, focused) => AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        width: 170,
        clipBehavior: Clip.antiAlias,
        decoration: tvFocusDecoration(
          focused: focused,
          baseColor: const Color(0xFF101216),
          radius: 18,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  _buildImage(item.imageUrl),
                  Positioned(
                    top: 8,
                    left: 8,
                    child: _buildBadge(item.category),
                  ),
                  if (_isFavorite(item))
                    const Positioned(
                      top: 8,
                      right: 8,
                      child: Icon(
                        Icons.favorite,
                        color: Color(0xFFB47CFF),
                        size: 18,
                      ),
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    item.subtitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: Colors.white54, fontSize: 11),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImage(String url) {
    if (url.isEmpty) {
      return _buildFallbackImage();
    }

    return Image.network(
      url,
      fit: BoxFit.cover,
      errorBuilder: (_, __, ___) => _buildFallbackImage(),
      loadingBuilder: (context, child, loadingProgress) {
        if (loadingProgress == null) {
          return child;
        }
        return _buildFallbackImage();
      },
    );
  }

  Widget _buildFallbackImage() {
    return Container(
      color: const Color(0xFF171820),
      child: const Center(
        child: Icon(Icons.live_tv, color: Color(0xFF6A00FF), size: 34),
      ),
    );
  }

  Widget _buildSettings() {
    return Padding(
      padding: const EdgeInsets.all(28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Configuracoes',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          if (_errorMessage != null) ...[
            _buildInlineError('Erro atual: $_errorMessage'),
            const SizedBox(height: 12),
          ],
          _buildInlineError('Servidor ativo: $_serverName'),
          const SizedBox(height: 14),
          _buildFocusButton(
            icon: Icons.dns_rounded,
            label: 'Trocar Servidor',
            onPressed: _handleChangeServer,
            focusNode: _changeServerFocusNode,
            moveLeftToSidebar: true,
          ),
          const SizedBox(height: 12),
          _buildFocusButton(
            icon: Icons.exit_to_app,
            label: 'Sair da Conta',
            onPressed: _handleLogout,
            focusNode: _logoutAccountFocusNode,
          ),
        ],
      ),
    );
  }

  Widget _buildLoading() {
    return const Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          CircularProgressIndicator(color: Color(0xFF6A00FF)),
          SizedBox(height: 16),
          Text(
            'Carregando catalogo IPTV...',
            style:
                TextStyle(color: Colors.white70, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.warning_amber_rounded,
                color: Colors.redAccent, size: 42),
            const SizedBox(height: 12),
            Text(
              _errorMessage ?? 'Falha ao carregar conteudo IPTV.',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white70),
            ),
            const SizedBox(height: 16),
            _buildFocusButton(
              icon: Icons.refresh,
              label: 'Tentar Novamente',
              onPressed: _loadHome,
              moveLeftToSidebar: true,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInlineError(String message) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF121216),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white10),
      ),
      child: Text(
        message,
        style: const TextStyle(color: Colors.white70, fontSize: 12),
      ),
    );
  }

  Widget _buildBadge(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        color: const Color(0xDD6A00FF),
        borderRadius: BorderRadius.circular(9),
      ),
      child: Text(
        text.toUpperCase(),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 9,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }

  BoxDecoration _panelDecoration({double radius = 22}) {
    return BoxDecoration(
      color: const Color(0xFF101216),
      borderRadius: BorderRadius.circular(radius),
      border: Border.all(color: Colors.white10),
      boxShadow: const [
        BoxShadow(
          color: Color(0x66000000),
          blurRadius: 18,
          offset: Offset(0, 8),
        ),
      ],
    );
  }

  Widget _buildFocusButton({
    required IconData icon,
    required String label,
    required VoidCallback onPressed,
    bool moveLeftToSidebar = false,
    FocusNode? focusNode,
  }) {
    return TvFocusable(
      focusNode: focusNode,
      onKeyEvent: _leftToSidebarKeyHandler(moveLeftToSidebar),
      onPressed: onPressed,
      onFocusChange: (focused) {
        if (focused) {
          _collapseSidebar();
        }
      },
      builder: (context, focused) => AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
        decoration: tvFocusDecoration(
          focused: focused,
          baseColor: focused ? Colors.white : const Color(0xFF6A00FF),
          radius: 14,
          focusedColor: const Color(0xFFB47CFF),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              color: focused ? const Color(0xFF6A00FF) : Colors.white,
              size: 18,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                color: focused ? const Color(0xFF6A00FF) : Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HeaderText extends TextStyle {
  const _HeaderText()
      : super(
          color: Colors.white54,
          fontSize: 10,
          fontWeight: FontWeight.w900,
        );
}
