import 'package:flutter/material.dart';

import 'api_service.dart';
import 'tv_focus.dart';

class SeriesDetailsScreen extends StatefulWidget {
  final IptvContentItem series;

  const SeriesDetailsScreen({
    super.key,
    required this.series,
  });

  @override
  State<SeriesDetailsScreen> createState() => _SeriesDetailsScreenState();
}

class _SeriesDetailsScreenState extends State<SeriesDetailsScreen> {
  late final Future<IptvSeriesDetails> _detailsFuture;
  int _selectedSeasonIndex = 0;
  IptvContentItem? _selectedEpisode;

  @override
  void initState() {
    super.initState();
    _detailsFuture = ApiService.fetchSeriesDetails(widget.series);
  }

  void _openEpisode(IptvContentItem episode) {
    Navigator.of(context).pushNamed(
      '/player',
      arguments: {
        'title': '${widget.series.title} - ${episode.title}',
        'subtitle': episode.subtitle,
        'category': widget.series.category,
        'videoUrl': episode.streamUrl,
        'alternateVideoUrls': episode.alternateStreamUrls,
        'contentType': episode.type,
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: FutureBuilder<IptvSeriesDetails>(
          future: _detailsFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return _buildLoading();
            }

            if (snapshot.hasError || !snapshot.hasData) {
              return _buildError(snapshot.error);
            }

            return _buildDetails(snapshot.data!);
          },
        ),
      ),
    );
  }

  Widget _buildDetails(IptvSeriesDetails details) {
    final seasons = details.seasons;
    final seasonIndex = _selectedSeasonIndex.clamp(0, seasons.length - 1);
    final season = seasons[seasonIndex];
    final selectedEpisode = _selectedEpisode ?? season.episodes.first;

    return Row(
      children: [
        Container(
          width: 330,
          padding: const EdgeInsets.all(24),
          decoration: const BoxDecoration(
            color: Color(0xFF08090D),
            border: Border(right: BorderSide(color: Colors.white10)),
          ),
          child: LayoutBuilder(
            builder: (context, constraints) {
              final posterHeight = constraints.maxHeight < 620 ? 220.0 : 270.0;

              return SingleChildScrollView(
                child: ConstrainedBox(
                  constraints: BoxConstraints(minHeight: constraints.maxHeight),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _buildBackButton(),
                      const SizedBox(height: 18),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(18),
                        child: SizedBox(
                          height: posterHeight,
                          child: _buildImage(widget.series.imageUrl),
                        ),
                      ),
                      const SizedBox(height: 18),
                      Text(
                        widget.series.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        widget.series.subtitle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: Colors.white54),
                      ),
                      if (details.plot.isNotEmpty) ...[
                        const SizedBox(height: 14),
                        Text(
                          details.plot,
                          maxLines: constraints.maxHeight < 620 ? 3 : 5,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Colors.white60,
                            height: 1.35,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        selectedEpisode.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    _buildPlayButton(selectedEpisode),
                  ],
                ),
                const SizedBox(height: 16),
                _buildSeasonRail(seasons),
                const SizedBox(height: 16),
                Expanded(child: _buildEpisodes(season.episodes)),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSeasonRail(List<IptvSeriesSeason> seasons) {
    return SizedBox(
      height: 52,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: seasons.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (context, index) {
          final season = seasons[index];
          final active = index == _selectedSeasonIndex;
          return TvFocusable(
            onPressed: () {
              setState(() {
                _selectedSeasonIndex = index;
                _selectedEpisode = season.episodes.first;
              });
            },
            builder: (context, focused) => AnimatedContainer(
              duration: const Duration(milliseconds: 120),
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
              decoration: tvFocusDecoration(
                focused: focused,
                baseColor:
                    active ? const Color(0xFF6A00FF) : const Color(0xFF101216),
                radius: 14,
              ),
              child: Text(
                season.title,
                style: TextStyle(
                  color: active ? Colors.white : Colors.white70,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildEpisodes(List<IptvContentItem> episodes) {
    return ListView.separated(
      itemCount: episodes.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final episode = episodes[index];
        final selected = _selectedEpisode?.id == episode.id ||
            (_selectedEpisode == null && index == 0);
        return TvFocusable(
          autofocus: index == 0,
          onPressed: () => _openEpisode(episode),
          onFocusChange: (focused) {
            if (focused) {
              setState(() => _selectedEpisode = episode);
            }
          },
          builder: (context, focused) => AnimatedContainer(
            duration: const Duration(milliseconds: 120),
            padding: const EdgeInsets.all(14),
            decoration: tvFocusDecoration(
              focused: focused,
              baseColor:
                  selected ? const Color(0x336A00FF) : const Color(0xFF101216),
              radius: 14,
              borderColor: selected ? const Color(0xFF6A00FF) : Colors.white10,
              focusedColor: const Color(0xFFB47CFF),
            ),
            child: Row(
              children: [
                SizedBox(
                  width: 56,
                  child: Text(
                    '${index + 1}'.padLeft(2, '0'),
                    style: const TextStyle(
                      color: Color(0xFFB47CFF),
                      fontFamily: 'monospace',
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        episode.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 5),
                      Text(
                        episode.subtitle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white54,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.play_arrow, color: Colors.white70),
              ],
            ),
          ),
        );
      },
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

  Widget _buildPlayButton(IptvContentItem episode) {
    return TvFocusable(
      onPressed: () => _openEpisode(episode),
      builder: (context, focused) => AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
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

  Widget _buildLoading() {
    return const Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          CircularProgressIndicator(color: Color(0xFF6A00FF)),
          SizedBox(height: 16),
          Text(
            'Carregando temporadas...',
            style: TextStyle(color: Colors.white70),
          ),
        ],
      ),
    );
  }

  Widget _buildError(Object? error) {
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
              error?.toString().replaceAll('Exception: ', '') ??
                  'Falha ao carregar a serie.',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white70),
            ),
            const SizedBox(height: 16),
            _buildBackButton(),
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
        child: Icon(Icons.tv_rounded, color: Color(0xFF6A00FF), size: 42),
      ),
    );
  }
}
