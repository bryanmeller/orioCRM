import 'dart:async';

import 'package:flutter/material.dart';
import 'package:media_kit/media_kit.dart';
import 'package:media_kit_video/media_kit_video.dart';

class PlayerScreen extends StatefulWidget {
  final String title;
  final String subtitle;
  final String category;
  final String videoUrl;
  final List<String> alternateVideoUrls;

  const PlayerScreen({
    super.key,
    required this.title,
    required this.subtitle,
    required this.category,
    required this.videoUrl,
    this.alternateVideoUrls = const [],
  });

  @override
  State<PlayerScreen> createState() => _PlayerScreenState();
}

class _PlayerScreenState extends State<PlayerScreen> {
  late final Player _player;
  late final VideoController _videoController;
  late final Future<void> _openMediaFuture;
  late final StreamSubscription<String> _errorSubscription;
  late final StreamSubscription<Duration> _positionSubscription;
  late final StreamSubscription<bool> _playingSubscription;
  late final StreamSubscription<int?> _widthSubscription;
  late final StreamSubscription<int?> _heightSubscription;
  Timer? _startupTimer;

  String? _errorMessage;
  String _activeVideoUrl = '';
  bool _hasStartedPlayback = false;
  bool _isPlaying = false;
  Duration _lastPosition = Duration.zero;
  int? _videoWidth;
  int? _videoHeight;

  static const Map<String, String> _iptvHeaders = {
    'User-Agent':
        'Mozilla/5.0 (Linux; Android TV) AppleWebKit/537.36 OrioIPTV/1.0',
    'Accept': '*/*',
    'Connection': 'keep-alive',
  };

  @override
  void initState() {
    super.initState();
    _player = Player();
    _videoController = VideoController(
      _player,
      configuration: const VideoControllerConfiguration(
        vo: 'mediacodec_embed',
        hwdec: 'mediacodec',
        enableHardwareAcceleration: true,
        androidAttachSurfaceAfterVideoParameters: false,
      ),
    );
    _errorSubscription = _player.stream.error.listen((error) {
      if (mounted) {
        setState(() => _errorMessage = error);
      }
    });
    _positionSubscription = _player.stream.position.listen((position) {
      _lastPosition = position;
      if (position > Duration.zero && mounted) {
        _markPlaybackStarted();
      }
    });
    _playingSubscription = _player.stream.playing.listen((playing) {
      _isPlaying = playing;
      if (playing && mounted) {
        _markPlaybackStarted();
      }
    });
    _widthSubscription = _player.stream.width.listen((width) {
      _videoWidth = width;
      _checkVideoFrameStarted();
    });
    _heightSubscription = _player.stream.height.listen((height) {
      _videoHeight = height;
      _checkVideoFrameStarted();
    });
    _openMediaFuture = _openMedia();
  }

  void _checkVideoFrameStarted() {
    if ((_videoWidth ?? 0) > 0 && (_videoHeight ?? 0) > 0 && mounted) {
      _markPlaybackStarted();
    }
  }

  void _markPlaybackStarted() {
    if (!_hasStartedPlayback && mounted) {
      _startupTimer?.cancel();
      setState(() {
        _hasStartedPlayback = true;
        _errorMessage = null;
      });
    }
  }

  String _streamKind(Uri uri) {
    final path = uri.path.toLowerCase();
    if (path.endsWith('.m3u8')) {
      return 'hls';
    }
    if (path.endsWith('.ts')) {
      return 'mpegts';
    }
    if (path.endsWith('.mp4')) {
      return 'mp4';
    }
    if (path.endsWith('.mkv')) {
      return 'mkv';
    }
    return 'auto';
  }

  Future<void> _openMedia() async {
    final candidates = <String>[
      widget.videoUrl,
      ...widget.alternateVideoUrls,
    ].map((url) => url.trim()).where((url) => url.isNotEmpty).toSet().toList();

    if (candidates.isEmpty) {
      setState(() => _errorMessage = 'URL do video invalida.');
      return;
    }

    Object? lastError;
    for (var index = 0; index < candidates.length; index++) {
      final candidate = candidates[index];
      final ok = await _tryOpenCandidate(candidate, index, candidates.length);
      if (ok) {
        return;
      }
      lastError = _errorMessage;
    }

    if (mounted) {
      setState(() {
        _errorMessage = lastError?.toString() ??
            'Nenhuma URL de reproducao funcionou para este conteudo.';
      });
    }
  }

  Future<bool> _tryOpenCandidate(
    String url,
    int index,
    int total,
  ) async {
    final videoUri = Uri.tryParse(url);

    if (videoUri == null ||
        !videoUri.hasScheme ||
        !videoUri.hasAuthority ||
        !['http', 'https'].contains(videoUri.scheme.toLowerCase())) {
      setState(() => _errorMessage = 'URL do video invalida.');
      return false;
    }

    try {
      _startupTimer?.cancel();
      _hasStartedPlayback = false;
      _isPlaying = false;
      _lastPosition = Duration.zero;
      _videoWidth = null;
      _videoHeight = null;
      _activeVideoUrl = url;
      if (mounted) {
        setState(() {
          _errorMessage = null;
        });
      }

      final platform = _player.platform;
      if (platform is NativePlayer) {
        await platform.setProperty('cache', 'yes');
        await platform.setProperty('demuxer-readahead-secs', '8');
      }

      await _player
          .open(
            Media(
              url,
              httpHeaders: _iptvHeaders,
              extras: {
                'streamKind': _streamKind(videoUri),
              },
            ),
            play: true,
          )
          .timeout(const Duration(seconds: 20));

      final started = await _waitForFirstFrame(const Duration(seconds: 25));
      if (started) {
        return true;
      }

      if (_hasStartedPlayback || _lastPosition > Duration.zero || _isPlaying) {
        return true;
      }

      await _player.stop();
      if (mounted) {
        setState(() {
          _errorMessage =
              'Tentativa ${index + 1}/$total sem video. Testando proxima URL...';
        });
      }
      return false;
    } catch (error) {
      if (mounted) {
        setState(() => _errorMessage = 'Erro ao carregar o video: $error');
      }
      return false;
    }
  }

  Future<bool> _waitForFirstFrame(Duration timeout) async {
    final completer = Completer<bool>();
    Timer? timer;
    late final StreamSubscription<int?> widthSub;
    late final StreamSubscription<int?> heightSub;

    void completeIfReady() {
      final hasVideoSize = (_videoWidth ?? 0) > 0 && (_videoHeight ?? 0) > 0;
      final hasPlaybackProgress = _lastPosition > Duration.zero || _isPlaying;
      if (hasVideoSize || hasPlaybackProgress) {
        if (!completer.isCompleted) {
          completer.complete(true);
        }
      }
    }

    widthSub = _player.stream.width.listen((width) {
      _videoWidth = width;
      completeIfReady();
    });
    heightSub = _player.stream.height.listen((height) {
      _videoHeight = height;
      completeIfReady();
    });
    timer = Timer(timeout, () {
      if (!completer.isCompleted) {
        completer.complete(false);
      }
    });

    completeIfReady();
    final result = await completer.future;
    timer.cancel();
    await widthSub.cancel();
    await heightSub.cancel();
    return result;
  }

  @override
  void dispose() {
    _startupTimer?.cancel();
    _errorSubscription.cancel();
    _positionSubscription.cancel();
    _playingSubscription.cancel();
    _widthSubscription.cancel();
    _heightSubscription.cancel();
    _player.dispose();
    super.dispose();
  }

  void _togglePlayPause() {
    _player.playOrPause();
  }

  Widget _buildLoadingOverlay() {
    return Container(
      color: Colors.black54,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircularProgressIndicator(color: Color(0xFF6A00FF)),
            const SizedBox(height: 16),
            const Text(
              'Carregando stream...',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'video ${_videoWidth ?? 0}x${_videoHeight ?? 0} | ${_lastPosition.inSeconds}s',
              style: const TextStyle(color: Colors.white54, fontSize: 11),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Column(
          children: [
            Container(
              height: 88,
              padding: const EdgeInsets.symmetric(horizontal: 24),
              decoration: const BoxDecoration(
                color: Color(0xFF090A0F),
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
                          widget.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          widget.subtitle,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Colors.white54,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: () => Navigator.of(context).pop(),
                  )
                ],
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Center(
                  child: Container(
                    width: 940,
                    height: 520,
                    clipBehavior: Clip.antiAlias,
                    decoration: BoxDecoration(
                      color: const Color(0xFF101216),
                      borderRadius: BorderRadius.circular(28),
                      border: Border.all(color: Colors.white10),
                    ),
                    child: FutureBuilder<void>(
                      future: _openMediaFuture,
                      builder: (context, snapshot) {
                        final hasError =
                            _errorMessage != null || snapshot.hasError;

                        if (hasError) {
                          return _buildErrorMessage(snapshot.error);
                        }

                        return Stack(
                          alignment: Alignment.center,
                          children: [
                            Positioned.fill(
                              child: LayoutBuilder(
                                builder: (context, constraints) {
                                  return Video(
                                    controller: _videoController,
                                    width: constraints.maxWidth,
                                    height: constraints.maxHeight,
                                    fit: BoxFit.contain,
                                    fill: Colors.black,
                                    controls: (state) =>
                                        const SizedBox.shrink(),
                                  );
                                },
                              ),
                            ),
                            StreamBuilder<bool>(
                              stream: _player.stream.buffering,
                              initialData: _player.state.buffering,
                              builder: (context, bufferingSnapshot) {
                                if (_hasStartedPlayback) {
                                  return const SizedBox.shrink();
                                }

                                return _buildLoadingOverlay();
                              },
                            ),
                            Positioned(
                              bottom: 24,
                              left: 24,
                              right: 24,
                              child: Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      widget.category,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        color: Colors.white70,
                                        fontSize: 14,
                                      ),
                                    ),
                                  ),
                                  StreamBuilder<bool>(
                                    stream: _player.stream.playing,
                                    initialData: _player.state.playing,
                                    builder: (context, playingSnapshot) {
                                      final isPlaying =
                                          playingSnapshot.data == true;

                                      return IconButton(
                                        icon: Icon(
                                          isPlaying
                                              ? Icons.pause_circle_filled
                                              : Icons.play_circle_filled,
                                          color: Colors.white,
                                          size: 40,
                                        ),
                                        onPressed: _togglePlayPause,
                                      );
                                    },
                                  ),
                                ],
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorMessage(Object? snapshotError) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              _errorMessage ??
                  snapshotError?.toString() ??
                  'Erro ao carregar o video.',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white70),
            ),
            const SizedBox(height: 14),
            Text(
              'URL: $_activeVideoUrl\nDimensao: ${_videoWidth ?? 0}x${_videoHeight ?? 0} | Posicao: ${_lastPosition.inSeconds}s',
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white38, fontSize: 11),
            ),
          ],
        ),
      ),
    );
  }
}
