import 'dart:async';

import 'package:flutter/material.dart';

import 'api_service.dart';
import 'player_return_guard.dart';
import 'tv_focus.dart';
import 'tv_safe_area.dart';

class MovieDetailsScreen extends StatefulWidget {
  final IptvContentItem movie;
  final List<IptvContentItem> relatedMovies;

  const MovieDetailsScreen({
    super.key,
    required this.movie,
    this.relatedMovies = const [],
  });

  @override
  State<MovieDetailsScreen> createState() => _MovieDetailsScreenState();
}

class _MovieDetailsScreenState extends State<MovieDetailsScreen> {
  late IptvContentItem _movie;
  final ScrollController _wideInfoScrollController = ScrollController();
  final ScrollController _compactScrollController = ScrollController();
  bool _isFavorite = false;
  bool _favoriteLoaded = false;
  bool _detailsLoading = false;

  @override
  void initState() {
    super.initState();
    _movie = widget.movie;
    unawaited(_loadFavoriteState(_movie.id));
    unawaited(_loadMovieDetails(_movie));
  }

  @override
  void dispose() {
    _wideInfoScrollController.dispose();
    _compactScrollController.dispose();
    super.dispose();
  }

  Future<void> _loadFavoriteState(String movieId) async {
    final isFavorite = await ApiService.isFavorite(movieId);
    if (!mounted || _movie.id != movieId) {
      return;
    }
    setState(() {
      _isFavorite = isFavorite;
      _favoriteLoaded = true;
    });
  }

  Future<void> _loadMovieDetails(IptvContentItem movie) async {
    setState(() => _detailsLoading = true);
    try {
      final detailedMovie = await ApiService.fetchMovieDetails(movie);
      if (!mounted || _movie.id != movie.id) {
        return;
      }
      setState(() {
        _movie = _mergeMovieDetails(movie, detailedMovie);
        _detailsLoading = false;
      });
    } catch (_) {
      if (!mounted || _movie.id != movie.id) {
        return;
      }
      setState(() => _detailsLoading = false);
    }
  }

  IptvContentItem _mergeMovieDetails(
    IptvContentItem base,
    IptvContentItem details,
  ) {
    return IptvContentItem(
      id: details.id,
      epgChannelId: details.epgChannelId,
      title: details.title.isNotEmpty ? details.title : base.title,
      subtitle: details.subtitle.isNotEmpty ? details.subtitle : base.subtitle,
      category: details.category.isNotEmpty ? details.category : base.category,
      categoryId:
          details.categoryId.isNotEmpty ? details.categoryId : base.categoryId,
      streamUrl:
          details.streamUrl.isNotEmpty ? details.streamUrl : base.streamUrl,
      alternateStreamUrls: details.alternateStreamUrls.isNotEmpty
          ? details.alternateStreamUrls
          : base.alternateStreamUrls,
      imageUrl: details.imageUrl.isNotEmpty ? details.imageUrl : base.imageUrl,
      type: details.type.isNotEmpty ? details.type : base.type,
      nextShowing: details.nextShowing ?? base.nextShowing,
      rating: (details.rating ?? '').isNotEmpty ? details.rating : base.rating,
      year: (details.year ?? '').isNotEmpty ? details.year : base.year,
      description: details.description.isNotEmpty
          ? details.description
          : base.description,
      eventStartDateTime: details.eventStartDateTime ?? base.eventStartDateTime,
      liveEpgChecked: details.liveEpgChecked || base.liveEpgChecked,
    );
  }

  Future<void> _toggleFavorite() async {
    final isFavorite = await ApiService.toggleFavorite(_movie.id);
    if (!mounted) {
      return;
    }
    setState(() => _isFavorite = isFavorite);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          isFavorite
              ? 'Filme adicionado aos favoritos.'
              : 'Filme removido dos favoritos.',
        ),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  Future<void> _playMovie() async {
    if (_movie.streamUrl.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Este conteudo nao possui URL de reproducao.'),
          duration: Duration(seconds: 2),
        ),
      );
      return;
    }

    final resumePosition = await _askResumePositionIfNeeded();
    if (!mounted) {
      return;
    }

    Navigator.of(context).pushNamed(
      '/player',
      arguments: {
        'title': _movie.title,
        'subtitle': _movie.subtitle,
        'description': _movie.description,
        'imageUrl': _movie.imageUrl,
        'category': _movie.category,
        'videoUrl': _movie.streamUrl,
        'alternateVideoUrls': _movie.alternateStreamUrls,
        'contentType': _movie.type,
        'contentId': ApiService.playbackContentId(_movie),
        'favoriteId': _movie.id,
        'resumePositionMs': resumePosition?.inMilliseconds ?? 0,
      },
    );
  }

  Future<Duration?> _askResumePositionIfNeeded() async {
    final position = await ApiService.getSavedPlaybackPosition(
      ApiService.playbackContentId(_movie),
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

  List<IptvContentItem> get _sameCategoryMovies {
    return widget.relatedMovies
        .where((item) {
          if (item.id == _movie.id || item.type != 'movie') {
            return false;
          }

          if (_movie.categoryId.isNotEmpty) {
            return item.categoryId == _movie.categoryId;
          }

          return item.category == _movie.category && item.category.isNotEmpty;
        })
        .take(20)
        .toList();
  }

  void _selectRelatedMovie(IptvContentItem movie) {
    setState(() {
      _movie = movie;
      _isFavorite = false;
      _favoriteLoaded = false;
      _detailsLoading = true;
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _scrollToSelectedMovieDetails(_wideInfoScrollController);
      _scrollToSelectedMovieDetails(_compactScrollController);
    });
    unawaited(_loadFavoriteState(movie.id));
    unawaited(_loadMovieDetails(movie));
  }

  void _scrollToSelectedMovieDetails(ScrollController controller) {
    if (!controller.hasClients) {
      return;
    }
    controller.animateTo(
      0,
      duration: const Duration(milliseconds: 220),
      curve: Curves.easeOutCubic,
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

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop || PlayerReturnGuard.consumeIfActive()) {
          return;
        }
        Navigator.of(context).pop();
      },
      child: Scaffold(
        backgroundColor: Colors.black,
        body: TvOverscanSafeArea(
          backgroundColor: Colors.black,
          child: LayoutBuilder(
            builder: (context, constraints) {
              final compact = constraints.maxWidth < 820;
              return compact ? _buildCompactLayout() : _buildWideLayout();
            },
          ),
        ),
      ),
    );
  }

  Widget _buildWideLayout() {
    return Row(
      children: [
        Container(
          width: 360,
          padding: const EdgeInsets.all(24),
          decoration: const BoxDecoration(
            color: Color(0xFF08090D),
            border: Border(right: BorderSide(color: Colors.white10)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildBackButton(),
              const SizedBox(height: 18),
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(18),
                  child: _buildImage(_movie.imageUrl),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: SingleChildScrollView(
              controller: _wideInfoScrollController,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _buildInfoPanel(maxSynopsisLines: 6),
                  const SizedBox(height: 26),
                  _buildSameCategorySection(),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCompactLayout() {
    return SingleChildScrollView(
      controller: _compactScrollController,
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _buildBackButton(),
          const SizedBox(height: 18),
          SizedBox(
            height: 310,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(18),
              child: _buildImage(_movie.imageUrl),
            ),
          ),
          const SizedBox(height: 22),
          _buildInfoPanel(maxSynopsisLines: 7),
          const SizedBox(height: 26),
          _buildSameCategorySection(),
        ],
      ),
    );
  }

  Widget _buildInfoPanel({required int maxSynopsisLines}) {
    final meta = [
      if ((_movie.year ?? '').isNotEmpty) _movie.year!,
      if ((_movie.rating ?? '').isNotEmpty) _movie.rating!,
      if (_movie.category.isNotEmpty) _movie.category,
    ];
    final synopsis = _movie.description.trim();
    final synopsisText = synopsis.isNotEmpty
        ? synopsis
        : _detailsLoading
            ? 'Carregando sinopse...'
            : 'Sinopse indisponivel.';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          _movie.title,
          maxLines: 3,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 32,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 10),
        if (meta.isNotEmpty)
          Text(
            meta.join('  |  '),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Color(0xFFD8C6FF),
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          )
        else if (_movie.subtitle.isNotEmpty)
          Text(
            _movie.subtitle,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(color: Color(0xFFD8C6FF), fontSize: 14),
          ),
        const SizedBox(height: 24),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            _buildPlayButton(),
            _buildFavoriteButton(),
          ],
        ),
        const SizedBox(height: 28),
        const Text(
          'Sinopse',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 10),
        ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 44),
          child: Text(
            synopsisText,
            maxLines: maxSynopsisLines,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 15,
              height: 1.45,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSameCategorySection() {
    final movies = _sameCategoryMovies;
    if (movies.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Filmes da mesma categoria',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 205,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: movies.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, index) => _buildRelatedMovieCard(
              movies[index],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildRelatedMovieCard(IptvContentItem movie) {
    return TvFocusable(
      onPressed: () => _selectRelatedMovie(movie),
      builder: (context, focused) => AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        width: 142,
        clipBehavior: Clip.antiAlias,
        decoration: tvFocusDecoration(
          focused: focused,
          baseColor: const Color(0xFF101216),
          radius: 14,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(child: _buildImage(movie.imageUrl)),
            SizedBox(
              height: 46,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(9, 7, 9, 7),
                child: Text(
                  movie.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    height: 1.15,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBackButton() {
    return TvFocusable(
      onPressed: () => Navigator.of(context).pop(),
      builder: (context, focused) => AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        height: 46,
        padding: const EdgeInsets.symmetric(horizontal: 14),
        decoration: tvFocusDecoration(
          focused: focused,
          baseColor: const Color(0xFF101216),
          radius: 14,
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.arrow_back, color: Colors.white70, size: 20),
            SizedBox(width: 10),
            Text(
              'Voltar',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlayButton() {
    return TvFocusable(
      autofocus: true,
      onPressed: _playMovie,
      builder: (context, focused) => AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
        decoration: tvFocusDecoration(
          focused: focused,
          baseColor: const Color(0xFF6A00FF),
          radius: 14,
          focusedColor: const Color(0xFFB47CFF),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.play_arrow, color: Colors.white),
            SizedBox(width: 8),
            Text(
              'Assistir',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFavoriteButton() {
    return TvFocusable(
      enabled: _favoriteLoaded,
      onPressed: _toggleFavorite,
      builder: (context, focused) => AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 15),
        decoration: tvFocusDecoration(
          focused: focused,
          baseColor: const Color(0xFF101216),
          radius: 14,
          focusedColor: const Color(0xFFB47CFF),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              _isFavorite ? Icons.favorite : Icons.favorite_border,
              color: _isFavorite ? const Color(0xFFB47CFF) : Colors.white,
            ),
            const SizedBox(width: 8),
            Text(
              _isFavorite ? 'Favorito' : 'Favoritar',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
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
        child: Icon(
          Icons.movie_creation_rounded,
          color: Color(0xFF6A00FF),
          size: 48,
        ),
      ),
    );
  }
}
