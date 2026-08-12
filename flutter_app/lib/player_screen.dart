import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:video_player/video_player.dart';

class PlayerScreen extends StatefulWidget {
  final String title;
  final String subtitle;
  final String category;
  final String videoUrl;
  final List<String> alternateVideoUrls;
  final String contentType;

  const PlayerScreen({
    super.key,
    required this.title,
    required this.subtitle,
    required this.category,
    required this.videoUrl,
    this.alternateVideoUrls = const [],
    this.contentType = '',
  });

  @override
  State<PlayerScreen> createState() => _PlayerScreenState();
}

class _PlayerScreenState extends State<PlayerScreen> {
  late final Future<void> _openMediaFuture;
  VideoPlayerController? _controller;
  Timer? _loadingTimer;
  Timer? _positionTimer;
  Timer? _reconnectTimer;
  Timer? _controlsTimer;
  final FocusNode _playerFocusNode = FocusNode();
  final FocusNode _rewindFocusNode = FocusNode();
  final FocusNode _playPauseFocusNode = FocusNode();
  final FocusNode _forwardFocusNode = FocusNode();
  final FocusNode _rendererFocusNode = FocusNode();
  final FocusNode _fullscreenFocusNode = FocusNode();

  String? _errorMessage;
  String _activeVideoUrl = '';
  String _activeRendererLabel = 'ExoPlayer PlatformView';
  String _loadingStatus = 'Preparando stream...';
  int _loadingSeconds = 0;
  int _reconnectAttempts = 0;
  bool _hasStartedPlayback = false;
  bool _isFullscreen = true;
  bool _controlsVisible = true;
  bool _progressFocused = false;
  Duration _lastPosition = Duration.zero;

  static const Map<String, String> _iptvHeaders = {
    'User-Agent':
        'Mozilla/5.0 (Linux; Android TV) AppleWebKit/537.36 OrioIPTV/1.0',
    'Accept': '*/*',
    'Connection': 'keep-alive',
  };

  static const List<_RendererMode> _rendererModes = [
    _RendererMode(
      label: 'ExoPlayer PlatformView',
      viewType: VideoViewType.platformView,
    ),
    _RendererMode(
      label: 'ExoPlayer TextureView',
      viewType: VideoViewType.textureView,
    ),
  ];

  @override
  void initState() {
    super.initState();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _playerFocusNode.requestFocus();
        _scheduleControlsHide();
      }
    });
    _openMediaFuture = _openMedia();
  }

  @override
  void dispose() {
    _stopLoadingTimer();
    _positionTimer?.cancel();
    _reconnectTimer?.cancel();
    _controlsTimer?.cancel();
    _playerFocusNode.dispose();
    _rewindFocusNode.dispose();
    _playPauseFocusNode.dispose();
    _forwardFocusNode.dispose();
    _rendererFocusNode.dispose();
    _fullscreenFocusNode.dispose();
    _controller?.removeListener(_onControllerChanged);
    _controller?.dispose();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  bool get _isLiveContent {
    final type = widget.contentType.toLowerCase();
    final url = _activeVideoUrl.isNotEmpty ? _activeVideoUrl : widget.videoUrl;
    final path = Uri.tryParse(url)?.path.toLowerCase() ?? '';
    return type == 'live' || path.contains('/live/');
  }

  bool get _canSeek {
    final controller = _controller;
    if (controller == null || !controller.value.isInitialized) {
      return false;
    }
    return !_isLiveContent && controller.value.duration > Duration.zero;
  }

  VideoFormat? _formatHint(Uri uri) {
    final path = uri.path.toLowerCase();
    if (path.endsWith('.m3u8')) {
      return VideoFormat.hls;
    }
    if (path.endsWith('.mpd')) {
      return VideoFormat.dash;
    }
    return null;
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
      for (final renderer in _rendererModes) {
        final ok = await _tryOpenCandidate(
          candidates[index],
          index,
          candidates.length,
          renderer: renderer,
        );
        if (ok) {
          return;
        }
        lastError = _errorMessage;
      }
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
    int total, {
    _RendererMode? renderer,
    Duration? resumePosition,
  }) async {
    final activeRenderer = renderer ?? _rendererModes.first;
    final uri = Uri.tryParse(url);
    if (uri == null ||
        !uri.hasScheme ||
        !uri.hasAuthority ||
        !['http', 'https'].contains(uri.scheme.toLowerCase())) {
      setState(() => _errorMessage = 'URL do video invalida.');
      return false;
    }

    _startLoadingTimer(
      total > 1
          ? 'Abrindo stream ${index + 1}/$total com ${activeRenderer.label}...'
          : 'Abrindo stream com ${activeRenderer.label}...',
    );
    _activeVideoUrl = url;
    _activeRendererLabel = activeRenderer.label;
    _hasStartedPlayback = false;
    _lastPosition = Duration.zero;
    if (mounted) {
      setState(() => _errorMessage = null);
    }

    VideoPlayerController? nextController;
    try {
      nextController = VideoPlayerController.networkUrl(
        uri,
        httpHeaders: _iptvHeaders,
        formatHint: _formatHint(uri),
        videoPlayerOptions: VideoPlayerOptions(mixWithOthers: false),
        viewType: activeRenderer.viewType,
      );

      _setLoadingStatus('Conectando ao servidor...');
      await nextController.initialize().timeout(const Duration(seconds: 25));

      final previous = _controller;
      previous?.removeListener(_onControllerChanged);
      _controller = nextController;
      _controller!.addListener(_onControllerChanged);
      await previous?.dispose();
      nextController = null;

      if (resumePosition != null &&
          resumePosition > const Duration(seconds: 3) &&
          !_isLiveContent) {
        await _controller!.seekTo(resumePosition);
      }

      _setLoadingStatus('Iniciando video...');
      await _controller!.play();
      final started = await _waitForVideoStart(const Duration(seconds: 12));
      if (started) {
        _markPlaybackStarted();
        _startPositionTicker();
        return true;
      }

      await _controller?.pause();
      if (mounted) {
        setState(() {
          _errorMessage = 'O video nao iniciou nesta URL.';
        });
      }
      return false;
    } catch (error) {
      await nextController?.dispose();
      if (mounted) {
        setState(() => _errorMessage = 'Erro ao carregar o video: $error');
      }
      return false;
    }
  }

  Future<bool> _waitForVideoStart(Duration timeout) async {
    final end = DateTime.now().add(timeout);
    while (DateTime.now().isBefore(end)) {
      final controller = _controller;
      if (controller == null) {
        return false;
      }
      final value = controller.value;
      if (value.hasError) {
        return false;
      }
      if (value.isInitialized &&
          value.size.width > 0 &&
          value.size.height > 0) {
        return true;
      }
      await Future.delayed(const Duration(milliseconds: 250));
    }
    return false;
  }

  void _onControllerChanged() {
    final controller = _controller;
    if (controller == null || !mounted) {
      return;
    }

    final value = controller.value;
    _lastPosition = value.position;

    if (value.hasError) {
      final error = value.errorDescription ?? 'Erro desconhecido no player.';
      if (_hasStartedPlayback && _isRecoverableReadError(error)) {
        _scheduleStreamRecovery(error);
        return;
      }
      setState(() => _errorMessage = error);
      return;
    }

    if (!_hasStartedPlayback &&
        value.isInitialized &&
        value.size.width > 0 &&
        value.size.height > 0 &&
        value.isPlaying) {
      _markPlaybackStarted();
      _startPositionTicker();
    }
  }

  bool _isRecoverableReadError(String error) {
    final lower = error.toLowerCase();
    return lower.contains('source error') ||
        lower.contains('behindlivewindow') ||
        lower.contains('timeout') ||
        lower.contains('connection') ||
        lower.contains('eof') ||
        lower.contains('read');
  }

  void _scheduleStreamRecovery(String error) {
    if (_reconnectAttempts >= 3 || _reconnectTimer != null) {
      setState(() => _errorMessage = error);
      return;
    }

    _reconnectAttempts += 1;
    _reconnectTimer = Timer(const Duration(seconds: 2), () async {
      _reconnectTimer = null;
      final url =
          _activeVideoUrl.isNotEmpty ? _activeVideoUrl : widget.videoUrl;
      if (!mounted || url.isEmpty) {
        return;
      }
      await _tryOpenCandidate(
        url,
        0,
        1,
        renderer: _activeRendererMode,
        resumePosition: _lastPosition,
      );
    });
  }

  void _startLoadingTimer(String status) {
    _loadingTimer?.cancel();
    _loadingSeconds = 0;
    _loadingStatus = status;
    _loadingTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted && !_hasStartedPlayback) {
        setState(() => _loadingSeconds += 1);
      }
    });
  }

  void _stopLoadingTimer() {
    _loadingTimer?.cancel();
    _loadingTimer = null;
  }

  void _setLoadingStatus(String status) {
    if (mounted && _loadingStatus != status) {
      setState(() => _loadingStatus = status);
    }
  }

  void _markPlaybackStarted() {
    if (!_hasStartedPlayback && mounted) {
      _stopLoadingTimer();
      setState(() {
        _hasStartedPlayback = true;
        _errorMessage = null;
      });
      if (_controlsVisible) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            _playPauseFocusNode.requestFocus();
          }
        });
      }
      _scheduleControlsHide();
    }
  }

  void _startPositionTicker() {
    _positionTimer?.cancel();
    _positionTimer = Timer.periodic(const Duration(milliseconds: 500), (_) {
      if (mounted) {
        setState(() {
          _lastPosition = _controller?.value.position ?? _lastPosition;
        });
      }
    });
  }

  void _togglePlayPause() {
    final controller = _controller;
    if (controller == null) {
      return;
    }
    controller.value.isPlaying ? controller.pause() : controller.play();
    setState(() {});
    _scheduleControlsHide();
  }

  void _toggleFullscreen() {
    setState(() {
      _isFullscreen = !_isFullscreen;
      _controlsVisible = true;
    });
    SystemChrome.setEnabledSystemUIMode(
      _isFullscreen ? SystemUiMode.immersiveSticky : SystemUiMode.edgeToEdge,
    );
    _scheduleControlsHide();
  }

  void _showControls({bool autoHide = true}) {
    final wasHidden = !_controlsVisible;
    if (mounted) {
      setState(() => _controlsVisible = true);
    }
    if (wasHidden) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          _playPauseFocusNode.requestFocus();
        }
      });
    }
    if (autoHide) {
      _scheduleControlsHide();
    }
  }

  void _scheduleControlsHide() {
    _controlsTimer?.cancel();
    if (!_isFullscreen || !_hasStartedPlayback) {
      return;
    }
    _controlsTimer = Timer(const Duration(seconds: 4), () {
      if (mounted && _isFullscreen && _hasStartedPlayback) {
        setState(() => _controlsVisible = false);
      }
    });
  }

  KeyEventResult _handlePlayerKey(FocusNode node, KeyEvent event) {
    if (event is! KeyDownEvent) {
      return KeyEventResult.ignored;
    }

    final wasHidden = !_controlsVisible;
    _showControls();
    return wasHidden ? KeyEventResult.handled : KeyEventResult.ignored;
  }

  Future<void> _seekBy(Duration delta) async {
    final controller = _controller;
    if (controller == null || !_canSeek) {
      return;
    }

    final duration = controller.value.duration;
    var target = controller.value.position + delta;
    if (target < Duration.zero) {
      target = Duration.zero;
    }
    if (duration > Duration.zero && target > duration) {
      target = duration;
    }
    await controller.seekTo(target);
    _scheduleControlsHide();
  }

  Future<void> _seekTo(Duration position) async {
    final controller = _controller;
    if (controller != null && _canSeek) {
      await controller.seekTo(position);
      _scheduleControlsHide();
    }
  }

  _RendererMode get _activeRendererMode {
    return _rendererModes.firstWhere(
      (renderer) => renderer.label == _activeRendererLabel,
      orElse: () => _rendererModes.first,
    );
  }

  _RendererMode get _nextRendererMode {
    final currentIndex = _rendererModes.indexWhere(
      (renderer) => renderer.label == _activeRendererLabel,
    );
    final nextIndex =
        currentIndex < 0 ? 0 : (currentIndex + 1) % _rendererModes.length;
    return _rendererModes[nextIndex];
  }

  Future<void> _switchRendererMode() async {
    final url = _activeVideoUrl.isNotEmpty ? _activeVideoUrl : widget.videoUrl;
    if (url.isEmpty) {
      return;
    }
    await _tryOpenCandidate(
      url,
      0,
      1,
      renderer: _nextRendererMode,
      resumePosition: _lastPosition,
    );
    _showControls();
  }

  String _formatTime(Duration duration) {
    final totalSeconds = duration.inSeconds;
    final hours = totalSeconds ~/ 3600;
    final minutes = (totalSeconds % 3600) ~/ 60;
    final seconds = totalSeconds % 60;
    if (hours > 0) {
      return '$hours:${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
    }
    return '$minutes:${seconds.toString().padLeft(2, '0')}';
  }

  Widget _buildLoadingOverlay() {
    return Container(
      color: Colors.black87,
      child: Center(
        child: Container(
          width: 360,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: const Color(0xFF101216),
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: const Color(0xFF6A00FF)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x886A00FF),
                blurRadius: 28,
                spreadRadius: 1,
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(
                width: 42,
                height: 42,
                child: CircularProgressIndicator(
                  color: Color(0xFFB47CFF),
                  strokeWidth: 4,
                ),
              ),
              const SizedBox(height: 18),
              const Text(
                'ORIO PLAYER',
                style: TextStyle(
                  color: Color(0xFFB47CFF),
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.4,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _loadingStatus,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Aguarde, o stream pode levar alguns segundos para iniciar.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white60, fontSize: 12),
              ),
              const SizedBox(height: 14),
              Text(
                '${_loadingSeconds}s | $_activeRendererLabel',
                style: const TextStyle(color: Colors.white38, fontSize: 11),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Focus(
        focusNode: _playerFocusNode,
        autofocus: true,
        onKeyEvent: _handlePlayerKey,
        child: SafeArea(
          child: Column(
            children: [
              if (!_isFullscreen) _buildHeader(),
              Expanded(
                child: Padding(
                  padding: EdgeInsets.all(_isFullscreen ? 0 : 24),
                  child: LayoutBuilder(
                    builder: (context, outerConstraints) {
                      final playerWidth = _isFullscreen
                          ? outerConstraints.maxWidth
                          : outerConstraints.maxWidth.clamp(0.0, 940.0);
                      final playerHeight = _isFullscreen
                          ? outerConstraints.maxHeight
                          : outerConstraints.maxHeight.clamp(0.0, 520.0);

                      return Center(
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 180),
                          width: playerWidth,
                          height: playerHeight,
                          clipBehavior: Clip.antiAlias,
                          decoration: BoxDecoration(
                            color: const Color(0xFF101216),
                            borderRadius: BorderRadius.circular(
                              _isFullscreen ? 0 : 28,
                            ),
                            border: _isFullscreen
                                ? null
                                : Border.all(color: Colors.white10),
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
                                    child: GestureDetector(
                                      behavior: HitTestBehavior.opaque,
                                      onTap: () {
                                        if (_isFullscreen &&
                                            !_controlsVisible) {
                                          _showControls();
                                          return;
                                        }
                                        _toggleFullscreen();
                                      },
                                      child: _buildVideo(),
                                    ),
                                  ),
                                  if (!_hasStartedPlayback)
                                    _buildLoadingOverlay(),
                                  if (!_isFullscreen || _controlsVisible)
                                    Positioned(
                                      bottom: 0,
                                      left: 0,
                                      right: 0,
                                      child: _buildControlsOverlay(),
                                    ),
                                ],
                              );
                            },
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildVideo() {
    final controller = _controller;
    if (controller == null || !controller.value.isInitialized) {
      return const ColoredBox(color: Colors.black);
    }

    return FittedBox(
      fit: BoxFit.contain,
      child: SizedBox(
        width: controller.value.size.width,
        height: controller.value.size.height,
        child: VideoPlayer(controller),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      height: 84,
      padding: const EdgeInsets.symmetric(horizontal: 32),
      decoration: const BoxDecoration(
        color: Color(0xFF090A0F),
        border: Border(bottom: BorderSide(color: Colors.white10)),
      ),
      child: Row(
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
                  style: const TextStyle(color: Colors.white54, fontSize: 13),
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
    );
  }

  Widget _buildControlsOverlay() {
    final controller = _controller;
    final duration = controller?.value.duration ?? Duration.zero;
    final position = controller?.value.position ?? _lastPosition;
    final canSeek = _canSeek && duration > Duration.zero;
    final isPlaying = controller?.value.isPlaying == true;

    return Container(
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 16),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Colors.transparent, Color(0xDD000000)],
        ),
      ),
      child: FocusTraversalGroup(
        policy: ReadingOrderTraversalPolicy(),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (canSeek) _buildProgressControl(position, duration),
            Row(
              children: [
                Expanded(
                  child: Text(
                    _canSeek
                        ? '${_formatTime(position)} / ${duration > Duration.zero ? _formatTime(duration) : '--:--'}'
                        : 'Ao vivo - ${widget.category}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                Text(
                  'Modo: $_activeRendererLabel',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white38,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(width: 8),
                if (canSeek)
                  IconButton(
                    focusNode: _rewindFocusNode,
                    icon: const Icon(
                      Icons.replay_10,
                      color: Colors.white,
                      size: 34,
                    ),
                    onPressed: () => _seekBy(const Duration(seconds: -10)),
                  ),
                IconButton(
                  focusNode: _playPauseFocusNode,
                  icon: Icon(
                    isPlaying
                        ? Icons.pause_circle_filled
                        : Icons.play_circle_filled,
                    color: Colors.white,
                    size: 42,
                  ),
                  onPressed: _togglePlayPause,
                ),
                if (canSeek)
                  IconButton(
                    focusNode: _forwardFocusNode,
                    icon: const Icon(
                      Icons.forward_10,
                      color: Colors.white,
                      size: 34,
                    ),
                    onPressed: () => _seekBy(const Duration(seconds: 10)),
                  ),
                IconButton(
                  focusNode: _rendererFocusNode,
                  tooltip: 'Trocar modo de video',
                  icon: const Icon(
                    Icons.tune,
                    color: Colors.white,
                    size: 30,
                  ),
                  onPressed: _switchRendererMode,
                ),
                IconButton(
                  focusNode: _fullscreenFocusNode,
                  icon: Icon(
                    _isFullscreen ? Icons.fullscreen_exit : Icons.fullscreen,
                    color: Colors.white,
                    size: 34,
                  ),
                  onPressed: _toggleFullscreen,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressControl(Duration position, Duration duration) {
    final progress = duration.inMilliseconds <= 0
        ? 0.0
        : (position.inMilliseconds / duration.inMilliseconds).clamp(0.0, 1.0);

    return FocusableActionDetector(
      mouseCursor: SystemMouseCursors.click,
      onFocusChange: (focused) => setState(() => _progressFocused = focused),
      shortcuts: const {
        SingleActivator(LogicalKeyboardKey.arrowLeft): _SeekIntent(-10),
        SingleActivator(LogicalKeyboardKey.arrowRight): _SeekIntent(10),
        SingleActivator(LogicalKeyboardKey.select): ActivateIntent(),
        SingleActivator(LogicalKeyboardKey.enter): ActivateIntent(),
        SingleActivator(LogicalKeyboardKey.gameButtonA): ActivateIntent(),
      },
      actions: {
        _SeekIntent: CallbackAction<_SeekIntent>(
          onInvoke: (intent) {
            _seekBy(Duration(seconds: intent.seconds));
            return null;
          },
        ),
        ActivateIntent: CallbackAction<ActivateIntent>(
          onInvoke: (_) {
            _togglePlayPause();
            return null;
          },
        ),
      },
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTapDown: (details) {
          final box = context.findRenderObject() as RenderBox?;
          if (box == null) {
            return;
          }
          final local = box.globalToLocal(details.globalPosition);
          final ratio = (local.dx / box.size.width).clamp(0.0, 1.0);
          _seekTo(Duration(
            milliseconds: (duration.inMilliseconds * ratio).round(),
          ));
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 120),
          height: 30,
          padding: const EdgeInsets.symmetric(vertical: 11),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color:
                  _progressFocused ? const Color(0xFFB47CFF) : Colors.white10,
              width: _progressFocused ? 2 : 1,
            ),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(3),
            child: Stack(
              fit: StackFit.expand,
              children: [
                Container(color: Colors.white24),
                FractionallySizedBox(
                  alignment: Alignment.centerLeft,
                  widthFactor: progress,
                  child: Container(color: const Color(0xFFB47CFF)),
                ),
              ],
            ),
          ),
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
              'Modo: $_activeRendererLabel | URL: $_activeVideoUrl\nPosicao: ${_lastPosition.inSeconds}s',
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

class _SeekIntent extends Intent {
  final int seconds;

  const _SeekIntent(this.seconds);
}

class _RendererMode {
  final String label;
  final VideoViewType viewType;

  const _RendererMode({
    required this.label,
    required this.viewType,
  });
}
