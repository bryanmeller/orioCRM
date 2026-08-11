import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'api_service.dart';
import 'tv_focus.dart';

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
  IptvContentItem? _selectedItem;

  IptvCatalog _liveCatalog = const IptvCatalog(categories: [], items: []);
  IptvCatalog _movieCatalog = const IptvCatalog(categories: [], items: []);
  IptvCatalog _seriesCatalog = const IptvCatalog(categories: [], items: []);
  final Set<String> _favorites = {};

  @override
  void initState() {
    super.initState();
    _loadHome();
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

      final catalogs = await Future.wait([
        ApiService.fetchLiveCatalog(),
        ApiService.fetchMoviesCatalog(),
        ApiService.fetchSeriesCatalog(),
      ]);

      if (!mounted) {
        return;
      }

      setState(() {
        _serverName = server?.name ??
            prefs.getString('selected_server_name') ??
            'Servidor Desconhecido';
        _liveCatalog = catalogs[0];
        _movieCatalog = catalogs[1];
        _seriesCatalog = catalogs[2];
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
        _errorMessage = error.toString().replaceAll('Exception: ', '');
      });
    }
  }

  Future<void> _handleLogout() async {
    await ApiService.logout();
    if (!mounted) {
      return;
    }
    Navigator.of(context).pushReplacementNamed('/');
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
    final items = _activeCatalog.items;
    if (_selectedCategory == 'todos') {
      return items;
    }
    return items.where((item) => item.categoryId == _selectedCategory).toList();
  }

  void _selectSection(HomeSection section) {
    setState(() {
      _activeSection = section;
      _selectedCategory = 'todos';
      final catalog = _activeCatalog;
      _selectedItem = catalog.items.isNotEmpty ? catalog.items.first : null;
    });
  }

  void _selectCategory(String categoryId) {
    setState(() {
      _selectedCategory = categoryId;
      final items = _activeCatalog.items;
      final filteredItems = categoryId == 'todos'
          ? items
          : items.where((item) => item.categoryId == categoryId).toList();
      _selectedItem = filteredItems.isNotEmpty ? filteredItems.first : null;
    });
  }

  Future<void> _toggleFavorite(IptvContentItem item) async {
    setState(() {
      if (_favorites.contains(item.id)) {
        _favorites.remove(item.id);
      } else {
        _favorites.add(item.id);
      }
    });

    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList('favorites', _favorites.toList());
  }

  Future<void> _playItem(IptvContentItem item) async {
    try {
      var playable = item;
      if (item.type == 'series') {
        setState(() => _errorMessage = null);
        playable = await ApiService.fetchFirstSeriesEpisode(item);
      }

      if (playable.streamUrl.isEmpty) {
        throw Exception('Este conteudo nao possui URL de reproducao.');
      }

      if (!mounted) {
        return;
      }

      Navigator.of(context).pushNamed(
        '/player',
        arguments: {
          'title': playable.title,
          'subtitle': playable.subtitle,
          'category': playable.category,
          'videoUrl': playable.streamUrl,
          'alternateVideoUrls': playable.alternateStreamUrls,
        },
      );
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
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Row(
          children: [
            _buildSidebar(),
            Expanded(
              child: Container(
                height: size.height,
                color: const Color(0xFF070708),
                child: Column(
                  children: [
                    _buildTopBar(),
                    Expanded(
                      child: _loading
                          ? _buildLoading()
                          : _errorMessage != null && _selectedItem == null
                              ? _buildError()
                              : _buildContent(),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSidebar() {
    return Container(
      width: 270,
      color: const Color(0xFF0C0D11),
      padding: const EdgeInsets.fromLTRB(18, 24, 18, 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFF121216),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white10),
            ),
            child: const Row(
              children: [
                Icon(Icons.tv_rounded, color: Color(0xFF6A00FF), size: 22),
                SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'ORIO PLAYER',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                ...HomeSection.values.map((section) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _buildMenuItem(section),
                  );
                }),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF101217),
                    borderRadius: BorderRadius.circular(16),
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
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItem(HomeSection section) {
    final active = _activeSection == section;
    return TvFocusable(
      onPressed: () => _selectSection(section),
      builder: (context, focused) => AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 14),
        decoration: tvFocusDecoration(
          focused: focused,
          baseColor: active ? const Color(0xFF18191F) : const Color(0x00000000),
          radius: 16,
          borderColor: active ? const Color(0xFF6A00FF) : Colors.transparent,
        ),
        child: Row(
          children: [
            Icon(
              section.icon,
              color: active ? const Color(0xFF6A00FF) : Colors.white54,
              size: 20,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                section.label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: active ? Colors.white : Colors.white54,
                  fontSize: 14,
                  fontWeight: active ? FontWeight.bold : FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopBar() {
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
          Column(
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
                style: const TextStyle(color: Colors.white54, fontSize: 13),
              ),
            ],
          ),
          Row(
            children: [
              TvFocusable(
                onPressed: _loadHome,
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
                onPressed: _handleLogout,
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
          _buildCatalogSummary(),
          const SizedBox(height: 12),
          _buildCategoryRail(_activeCatalog.categories),
          const SizedBox(height: 12),
          Expanded(child: _buildCatalogList(_filteredItems)),
        ],
      ),
    );
  }

  Widget _buildHomeDashboard() {
    final livePreview = _liveCatalog.items.take(8).toList();
    final moviesPreview = _movieCatalog.items.take(10).toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _buildHero(_selectedItem),
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

  Widget _buildHero(IptvContentItem? item) {
    if (item == null) {
      return Container(
        height: 210,
        alignment: Alignment.center,
        decoration: _panelDecoration(),
        child: const Text(
          'Nenhum conteudo encontrado neste servidor.',
          style: TextStyle(color: Colors.white70),
        ),
      );
    }

    return Container(
      height: 220,
      clipBehavior: Clip.antiAlias,
      decoration: _panelDecoration(),
      child: Stack(
        fit: StackFit.expand,
        children: [
          _buildImage(item.imageUrl),
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
                colors: [
                  Color(0xEE070708),
                  Color(0x99070708),
                  Colors.transparent
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(22),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    _buildBadge(
                        item.type == 'live' ? 'AO VIVO' : item.category),
                    if (item.rating != null && item.rating!.isNotEmpty) ...[
                      const SizedBox(width: 8),
                      _buildBadge('Nota ${item.rating}'),
                    ],
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      item.subtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        _buildFocusButton(
                          icon: Icons.play_arrow,
                          label: 'ASSISTIR',
                          onPressed: () => _playItem(item),
                        ),
                        const SizedBox(width: 12),
                        TvFocusable(
                          onPressed: () => _toggleFavorite(item),
                          builder: (context, focused) => AnimatedContainer(
                            duration: const Duration(milliseconds: 120),
                            width: 48,
                            height: 48,
                            decoration: tvFocusDecoration(
                              focused: focused,
                              baseColor: const Color(0xFF101216),
                              radius: 14,
                            ),
                            child: Icon(
                              _favorites.contains(item.id)
                                  ? Icons.favorite
                                  : Icons.favorite_border,
                              color: _favorites.contains(item.id)
                                  ? const Color(0xFFB47CFF)
                                  : Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
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
          return ChoiceChip(
            selected: active,
            label: Text(category.label),
            onSelected: (_) => _selectCategory(category.id),
            selectedColor: const Color(0xFF6A00FF),
            backgroundColor: const Color(0xFF101216),
            labelStyle: TextStyle(
              color: active ? Colors.white : Colors.white60,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
            side: BorderSide(
              color: active ? const Color(0xFFB47CFF) : Colors.white10,
            ),
          );
        },
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
            ),
        ],
      ),
    );
  }

  Widget _buildCatalogList(List<IptvContentItem> items) {
    if (_errorMessage != null) {
      return _buildError();
    }

    if (items.isEmpty) {
      return const Center(
        child: Text(
          'Nenhum conteudo encontrado nesta categoria.',
          style: TextStyle(color: Colors.white70),
        ),
      );
    }

    if (_activeSection == HomeSection.live) {
      return _buildLiveRows(items);
    }

    return GridView.builder(
      padding: EdgeInsets.zero,
      gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
        maxCrossAxisExtent: 178,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 0.78,
      ),
      itemCount: items.length,
      itemBuilder: (context, index) => _buildPosterCard(items[index]),
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
                  onPressed: () {
                    setState(() => _selectedItem = item);
                    _playItem(item);
                  },
                  onFocusChange: (focused) {
                    if (focused) {
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
          return compact ? _buildCompactCard(item) : _buildPosterCard(item);
        },
      ),
    );
  }

  Widget _buildCompactCard(IptvContentItem item) {
    return TvFocusable(
      onPressed: () => _playItem(item),
      onFocusChange: (focused) {
        if (focused) {
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
          ],
        ),
      ),
    );
  }

  Widget _buildPosterCard(IptvContentItem item) {
    return TvFocusable(
      onPressed: () => _playItem(item),
      onFocusChange: (focused) {
        if (focused) {
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
                  if (_favorites.contains(item.id))
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
          _buildInlineError('Servidor ativo: $_serverName'),
          const SizedBox(height: 20),
          _buildFocusButton(
            icon: Icons.exit_to_app,
            label: 'Sair da Conta',
            onPressed: _handleLogout,
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
  }) {
    return TvFocusable(
      onPressed: onPressed,
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
