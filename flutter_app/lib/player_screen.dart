import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:media_kit/media_kit.dart' as media_kit;
import 'package:media_kit_video/media_kit_video.dart' as media_kit_video;
import 'package:video_player/video_player.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

import 'api_service.dart';
import 'tv_safe_area.dart';

class PlayerScreen extends StatefulWidget {
  final String title;
  final String subtitle;
  final String description;
  final String imageUrl;
  final String category;
  final String videoUrl;
  final List<String> alternateVideoUrls;
  final String contentType;
  final String contentId;
  final String favoriteId;
  final Duration initialPosition;
  final List<IptvContentItem> liveChannels;

  const PlayerScreen({
    super.key,
    required this.title,
    required this.subtitle,
    this.description = '',
    this.imageUrl = '',
    required this.category,
    required this.videoUrl,
    this.alternateVideoUrls = const [],
    this.contentType = '',
    this.contentId = '',
    this.favoriteId = '',
    this.initialPosition = Duration.zero,
    this.liveChannels = const [],
  });

  @override
  State<PlayerScreen> createState() => _PlayerScreenState();
}

class _PlayerScreenState extends State<PlayerScreen> {
  late final Future<void> _openMediaFuture;
  VideoPlayerController? _controller;
  media_kit.Player? _mediaKitPlayer;
  media_kit_video.VideoController? _mediaKitController;
  StreamSubscription<Duration>? _mediaKitPositionSubscription;
  StreamSubscription<Duration>? _mediaKitDurationSubscription;
  StreamSubscription<bool>? _mediaKitPlayingSubscription;
  StreamSubscription<String>? _mediaKitErrorSubscription;
  Timer? _loadingTimer;
  Timer? _positionTimer;
  Timer? _reconnectTimer;
  Timer? _controlsTimer;
  final FocusNode _playerFocusNode = FocusNode();
  final ScrollController _channelMenuScrollController = ScrollController();

  String? _errorMessage;
  String _activeVideoUrl = '';
  String _activeTitle = '';
  String _activeSubtitle = '';
  String _activeDescription = '';
  String _activeImageUrl = '';
  String _activeCategory = '';
  String _activeContentId = '';
  String _activeFavoriteId = '';
  String _activeRendererLabel = 'ExoPlayer TextureView';
  String _loadingStatus = 'Preparando stream...';
  int _loadingSeconds = 0;
  int _reconnectAttempts = 0;
  Duration _mediaKitDuration = Duration.zero;
  bool _mediaKitPlaying = false;
  bool _hasStartedPlayback = false;
  bool _isFullscreen = true;
  bool _controlsVisible = true;
  bool _isFavorite = false;
  bool _channelMenuVisible = false;
  bool _isSwitchingLiveChannel = false;
  String _focusedControl = 'progress';
  int _focusedLiveChannelIndex = 0;
  Duration _lastPosition = Duration.zero;
  int _lastSavedProgressSecond = -1;

  static const Map<String, String> _iptvHeaders = {
    'User-Agent':
        'Mozilla/5.0 (Linux; Android TV) AppleWebKit/537.36 OrioIPTV/1.0',
    'Accept': '*/*',
    'Connection': 'keep-alive',
  };

  static const List<_RendererMode> _rendererModes = [
    _RendererMode(
      label: 'ExoPlayer TextureView',
      viewType: VideoViewType.textureView,
    ),
  ];

  @override
  void initState() {
    super.initState();
    WakelockPlus.enable();
    _activeTitle = widget.title;
    _activeSubtitle = widget.subtitle;
    _activeDescription = widget.description.trim().isNotEmpty
        ? widget.description.trim()
        : widget.subtitle.trim();
    _activeImageUrl = widget.imageUrl;
    _activeCategory = widget.category;
    _activeContentId = widget.contentId;
    _activeFavoriteId = widget.favoriteId;
    _focusedLiveChannelIndex = _initialLiveChannelIndex();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _playerFocusNode.requestFocus();
        _scheduleControlsHide();
      }
    });
    _openMediaFuture = _openMedia();
    _loadFavoriteState();
  }

  Future<void> _loadFavoriteState() async {
    if (_activeFavoriteId.isEmpty) {
      return;
    }
    final isFavorite = await ApiService.isFavorite(_activeFavoriteId);
    if (mounted) {
      setState(() => _isFavorite = isFavorite);
    }
  }

  @override
  void dispose() {
    _saveFinalPlaybackProgress();
    _stopLoadingTimer();
    _positionTimer?.cancel();
    _reconnectTimer?.cancel();
    _controlsTimer?.cancel();
    _channelMenuScrollController.dispose();
    _playerFocusNode.dispose();
    unawaited(_disposeMediaKitPlayer());
    _controller?.removeListener(_onControllerChanged);
    _controller?.dispose();
    WakelockPlus.disable();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  void _saveFinalPlaybackProgress() {
    final mediaPlayer = _mediaKitPlayer;
    if (mediaPlayer != null) {
      if (_activeContentId.isEmpty ||
          _isLiveContent ||
          _mediaKitDuration <= Duration.zero) {
        return;
      }

      unawaited(
        _saveCurrentPlaybackProgress(
          mediaPlayer.state.position,
          _mediaKitDuration,
        ),
      );
      return;
    }

    final controller = _controller;
    if (controller == null ||
        _activeContentId.isEmpty ||
        _isLiveContent ||
        !controller.value.isInitialized ||
        controller.value.duration <= Duration.zero) {
      return;
    }

    unawaited(
      _saveCurrentPlaybackProgress(
        controller.value.position,
        controller.value.duration,
      ),
    );
  }

  Future<void> _saveCurrentPlaybackProgress(
    Duration position,
    Duration duration,
  ) {
    return ApiService.savePlaybackProgress(
      contentId: _activeContentId,
      position: position,
      duration: duration,
      title: _activeTitle,
      subtitle: _activeSubtitle,
      category: _activeCategory,
      streamUrl: _activeVideoUrl.isNotEmpty ? _activeVideoUrl : widget.videoUrl,
      alternateStreamUrls: widget.alternateVideoUrls,
      imageUrl: _activeImageUrl,
      type: widget.contentType,
      description: _activeDescription,
    );
  }

  bool get _isLiveContent {
    final type = widget.contentType.toLowerCase();
    final url = _activeVideoUrl.isNotEmpty ? _activeVideoUrl : widget.videoUrl;
    final path = Uri.tryParse(url)?.path.toLowerCase() ?? '';
    return type == 'live' || path.contains('/live/');
  }

  List<IptvContentItem> get _liveChannels {
    if (widget.liveChannels.isNotEmpty) {
      return widget.liveChannels;
    }
    return [
      IptvContentItem(
        id: _activeFavoriteId.isNotEmpty ? _activeFavoriteId : 'active-live',
        title: _activeTitle,
        subtitle: _activeSubtitle,
        category: _activeCategory,
        categoryId: '',
        streamUrl:
            _activeVideoUrl.isNotEmpty ? _activeVideoUrl : widget.videoUrl,
        alternateStreamUrls: widget.alternateVideoUrls,
        imageUrl: '',
        type: 'live',
        nextShowing: '',
      ),
    ];
  }

  int _initialLiveChannelIndex() {
    final channels = widget.liveChannels;
    if (channels.isEmpty) {
      return 0;
    }
    final byFavorite =
        channels.indexWhere((item) => item.id == widget.favoriteId);
    if (byFavorite >= 0) {
      return byFavorite;
    }
    final byUrl =
        channels.indexWhere((item) => item.streamUrl == widget.videoUrl);
    return byUrl >= 0 ? byUrl : 0;
  }

  bool get _canSeek {
    if (_mediaKitPlayer != null) {
      return !_isLiveContent && _mediaKitDuration > Duration.zero;
    }

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

  Map<String, String> get _mediaKitHeaders => _iptvHeaders;

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
          resumePosition: widget.initialPosition,
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
    _lastPosition = resumePosition ?? Duration.zero;
    if (mounted) {
      setState(() => _errorMessage = null);
    }

    VideoPlayerController? nextController;
    var assignedController = false;
    try {
      await _disposeMediaKitPlayer();
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
      assignedController = true;
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
      await _stopActivePlayback();
      if (mounted) {
        setState(() {
          _errorMessage = 'O video nao iniciou nesta URL.';
        });
      }
      return false;
    } catch (error) {
      await nextController?.dispose();
      if (assignedController) {
        await _stopActivePlayback();
      }
      if (mounted) {
        setState(() => _errorMessage = 'Erro ao carregar o video: $error');
      }
      if (_isUnsupportedCodecError(error)) {
        return _tryOpenMediaKitCandidate(
          url,
          index,
          total,
          resumePosition: resumePosition,
        );
      }
      return _tryOpenMediaKitCandidate(
        url,
        index,
        total,
        resumePosition: resumePosition,
      );
    }
  }

  bool _isUnsupportedCodecError(Object error) {
    final lower = error.toString().toLowerCase();
    return lower.contains('unsupported') ||
        lower.contains('decoder init failed') ||
        lower.contains('format_unsupported') ||
        lower.contains('mediacodecvideorenderer') ||
        lower.contains('hevc') ||
        lower.contains('hvc1');
  }

  Future<bool> _tryOpenMediaKitCandidate(
    String url,
    int index,
    int total, {
    Duration? resumePosition,
  }) async {
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
          ? 'Abrindo stream ${index + 1}/$total com MediaKit...'
          : 'Abrindo stream com MediaKit...',
    );
    _activeVideoUrl = url;
    _activeRendererLabel = 'MediaKit';
    _hasStartedPlayback = false;
    _lastPosition = resumePosition ?? Duration.zero;
    _mediaKitDuration = Duration.zero;
    _mediaKitPlaying = false;
    if (mounted) {
      setState(() => _errorMessage = null);
    }

    try {
      await _stopActivePlayback();

      final player = media_kit.Player();
      final controller = media_kit_video.VideoController(player);
      _mediaKitPlayer = player;
      _mediaKitController = controller;
      _bindMediaKitStreams(player);

      _setLoadingStatus('Conectando ao servidor...');
      await player.open(
        media_kit.Media(
          url,
          httpHeaders: _mediaKitHeaders,
        ),
        play: false,
      );

      if (resumePosition != null &&
          resumePosition > const Duration(seconds: 3) &&
          !_isLiveContent) {
        await player.seek(resumePosition);
      }

      _setLoadingStatus('Iniciando video...');
      await player.play();
      final started = await _waitForMediaKitStart(const Duration(seconds: 12));
      if (started) {
        _markPlaybackStarted();
        _startPositionTicker();
        return true;
      }

      await _stopActivePlayback();
      if (mounted) {
        setState(() => _errorMessage = 'O video nao iniciou com MediaKit.');
      }
      return false;
    } catch (error) {
      await _stopActivePlayback();
      if (mounted) {
        setState(() => _errorMessage = 'Erro ao carregar com MediaKit: $error');
      }
      return false;
    }
  }

  void _bindMediaKitStreams(media_kit.Player player) {
    _mediaKitPositionSubscription?.cancel();
    _mediaKitDurationSubscription?.cancel();
    _mediaKitPlayingSubscription?.cancel();
    _mediaKitErrorSubscription?.cancel();

    _mediaKitPositionSubscription = player.stream.position.listen((position) {
      _lastPosition = position;
    });
    _mediaKitDurationSubscription = player.stream.duration.listen((duration) {
      if (mounted) {
        setState(() => _mediaKitDuration = duration);
      } else {
        _mediaKitDuration = duration;
      }
    });
    _mediaKitPlayingSubscription = player.stream.playing.listen((playing) {
      if (mounted) {
        setState(() => _mediaKitPlaying = playing);
      } else {
        _mediaKitPlaying = playing;
      }
    });
    _mediaKitErrorSubscription = player.stream.error.listen((error) {
      if (mounted) {
        setState(() => _errorMessage = error);
      }
    });
  }

  Future<bool> _waitForMediaKitStart(Duration timeout) async {
    final end = DateTime.now().add(timeout);
    while (DateTime.now().isBefore(end)) {
      final player = _mediaKitPlayer;
      if (player == null) {
        return false;
      }
      final duration = player.state.duration;
      final position = player.state.position;
      if (duration > Duration.zero ||
          position > Duration.zero ||
          _mediaKitPlaying) {
        return true;
      }
      await Future.delayed(const Duration(milliseconds: 250));
    }
    return false;
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

  Future<void> _stopActivePlayback() async {
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
    _positionTimer?.cancel();
    _positionTimer = null;
    await _disposeMediaKitPlayer();

    final current = _controller;
    if (current == null) {
      return;
    }

    _controller = null;
    current.removeListener(_onControllerChanged);
    try {
      if (current.value.isInitialized) {
        await current.pause();
      }
    } catch (_) {
      // The native player may already be tearing down; disposal below is enough.
    }
    await current.dispose();
  }

  Future<void> _disposeMediaKitPlayer() async {
    await _mediaKitPositionSubscription?.cancel();
    await _mediaKitDurationSubscription?.cancel();
    await _mediaKitPlayingSubscription?.cancel();
    await _mediaKitErrorSubscription?.cancel();
    _mediaKitPositionSubscription = null;
    _mediaKitDurationSubscription = null;
    _mediaKitPlayingSubscription = null;
    _mediaKitErrorSubscription = null;

    final player = _mediaKitPlayer;
    _mediaKitPlayer = null;
    _mediaKitController = null;
    _mediaKitDuration = Duration.zero;
    _mediaKitPlaying = false;
    await player?.dispose();
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
        if (_isLiveContent) {
          _controlsVisible = false;
        }
      });
      _scheduleControlsHide();
    }
  }

  void _startPositionTicker() {
    _positionTimer?.cancel();
    _positionTimer = Timer.periodic(const Duration(milliseconds: 500), (_) {
      if (mounted) {
        setState(() {
          _lastPosition = _mediaKitPlayer?.state.position ??
              _controller?.value.position ??
              _lastPosition;
        });
        _savePlaybackProgressIfNeeded();
      }
    });
  }

  void _savePlaybackProgressIfNeeded() {
    final mediaPlayer = _mediaKitPlayer;
    if (mediaPlayer != null) {
      if (!_canSeek || _activeContentId.isEmpty) {
        return;
      }

      final position = mediaPlayer.state.position;
      final duration = _mediaKitDuration;
      final second = position.inSeconds;
      if (second == _lastSavedProgressSecond || second % 5 != 0) {
        return;
      }

      _lastSavedProgressSecond = second;
      unawaited(
        _saveCurrentPlaybackProgress(position, duration),
      );
      return;
    }

    final controller = _controller;
    if (controller == null ||
        !_canSeek ||
        _activeContentId.isEmpty ||
        !controller.value.isInitialized) {
      return;
    }

    final position = controller.value.position;
    final duration = controller.value.duration;
    final second = position.inSeconds;
    if (second == _lastSavedProgressSecond || second % 5 != 0) {
      return;
    }

    _lastSavedProgressSecond = second;
    unawaited(
      _saveCurrentPlaybackProgress(position, duration),
    );
  }

  void _togglePlayPause() {
    final mediaPlayer = _mediaKitPlayer;
    if (mediaPlayer != null) {
      _mediaKitPlaying ? mediaPlayer.pause() : mediaPlayer.play();
      setState(() {});
      _scheduleControlsHide();
      return;
    }

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
    if (_isLiveContent) {
      _controlsTimer?.cancel();
      if (mounted && _controlsVisible) {
        setState(() => _controlsVisible = false);
      }
      _playerFocusNode.requestFocus();
      return;
    }

    if (mounted) {
      setState(() {
        _controlsVisible = true;
        if (!_canSeek && _focusedControl == 'progress') {
          _focusedControl = 'play';
        }
      });
    }
    _playerFocusNode.requestFocus();
    if (autoHide) {
      _scheduleControlsHide();
    }
  }

  void _scheduleControlsHide() {
    _controlsTimer?.cancel();
    if (_isLiveContent || !_isFullscreen || !_hasStartedPlayback) {
      return;
    }
    _controlsTimer = Timer(const Duration(seconds: 4), () {
      if (mounted && _isFullscreen && _hasStartedPlayback) {
        setState(() => _controlsVisible = false);
        _playerFocusNode.requestFocus();
      }
    });
  }

  KeyEventResult _handlePlayerKey(FocusNode node, KeyEvent event) {
    if (event is! KeyDownEvent) {
      return KeyEventResult.ignored;
    }

    if (_channelMenuVisible) {
      return _handleChannelMenuKey(event.logicalKey);
    }

    final key = event.logicalKey;
    if (_isLiveContent &&
        (key == LogicalKeyboardKey.enter ||
            key == LogicalKeyboardKey.select ||
            key == LogicalKeyboardKey.gameButtonA)) {
      _openChannelMenu();
      return KeyEventResult.handled;
    }

    if (_isLiveContent) {
      if (key == LogicalKeyboardKey.arrowUp) {
        unawaited(_zapLiveChannel(-1));
        return KeyEventResult.handled;
      }
      if (key == LogicalKeyboardKey.arrowDown) {
        unawaited(_zapLiveChannel(1));
        return KeyEventResult.handled;
      }
      return KeyEventResult.handled;
    }

    final wasHidden = !_controlsVisible;
    _showControls();
    if (wasHidden) {
      return KeyEventResult.handled;
    }

    if (key == LogicalKeyboardKey.arrowLeft ||
        key == LogicalKeyboardKey.arrowRight ||
        key == LogicalKeyboardKey.arrowUp ||
        key == LogicalKeyboardKey.arrowDown ||
        key == LogicalKeyboardKey.enter ||
        key == LogicalKeyboardKey.select ||
        key == LogicalKeyboardKey.gameButtonA) {
      _handleControlKey(key);
      return KeyEventResult.handled;
    }

    return KeyEventResult.handled;
  }

  KeyEventResult _handleChannelMenuKey(LogicalKeyboardKey key) {
    final channels = _liveChannels;
    if (key == LogicalKeyboardKey.goBack ||
        key == LogicalKeyboardKey.escape ||
        key == LogicalKeyboardKey.arrowLeft) {
      _closeChannelMenu();
      return KeyEventResult.handled;
    }

    if (key == LogicalKeyboardKey.arrowUp) {
      _moveFocusedLiveChannel(-1, channels);
      return KeyEventResult.handled;
    }

    if (key == LogicalKeyboardKey.arrowDown) {
      _moveFocusedLiveChannel(1, channels);
      return KeyEventResult.handled;
    }

    if (key == LogicalKeyboardKey.enter ||
        key == LogicalKeyboardKey.select ||
        key == LogicalKeyboardKey.gameButtonA) {
      if (channels.isNotEmpty && !_isSwitchingLiveChannel) {
        unawaited(_playLiveChannel(channels[_focusedLiveChannelIndex]));
      }
      return KeyEventResult.handled;
    }

    return KeyEventResult.handled;
  }

  void _openChannelMenu() {
    if (!_isLiveContent) {
      return;
    }
    final channels = _liveChannels;
    final activeIndex = channels.indexWhere((item) {
      final activeUrl =
          _activeVideoUrl.isNotEmpty ? _activeVideoUrl : widget.videoUrl;
      return item.id == _activeFavoriteId || item.streamUrl == activeUrl;
    });
    setState(() {
      _channelMenuVisible = true;
      _controlsVisible = false;
      _focusedLiveChannelIndex = activeIndex >= 0 ? activeIndex : 0;
    });
    _controlsTimer?.cancel();
    _playerFocusNode.requestFocus();
    _scrollFocusedLiveChannelIntoView();
  }

  void _closeChannelMenu() {
    setState(() => _channelMenuVisible = false);
    _playerFocusNode.requestFocus();
  }

  void _moveFocusedLiveChannel(int delta, List<IptvContentItem> channels) {
    if (channels.isEmpty) {
      return;
    }
    final nextIndex =
        (_focusedLiveChannelIndex + delta).clamp(0, channels.length - 1);
    setState(() => _focusedLiveChannelIndex = nextIndex);
    _scrollFocusedLiveChannelIntoView();
  }

  int _activeLiveChannelIndex(List<IptvContentItem> channels) {
    if (channels.isEmpty) {
      return -1;
    }

    final activeUrl =
        _activeVideoUrl.isNotEmpty ? _activeVideoUrl : widget.videoUrl;
    final byFavorite =
        channels.indexWhere((item) => item.id == _activeFavoriteId);
    if (byFavorite >= 0) {
      return byFavorite;
    }

    final byUrl = channels.indexWhere((item) {
      return item.streamUrl == activeUrl ||
          item.alternateStreamUrls.contains(activeUrl);
    });
    if (byUrl >= 0) {
      return byUrl;
    }

    return _focusedLiveChannelIndex.clamp(0, channels.length - 1);
  }

  Future<void> _zapLiveChannel(int delta) async {
    if (_isSwitchingLiveChannel) {
      return;
    }

    final channels = _liveChannels;
    if (channels.length < 2) {
      return;
    }

    final activeIndex = _activeLiveChannelIndex(channels);
    if (activeIndex < 0) {
      return;
    }

    final nextIndex = (activeIndex + delta).clamp(0, channels.length - 1);
    if (nextIndex == activeIndex) {
      return;
    }

    setState(() => _focusedLiveChannelIndex = nextIndex);
    await _playLiveChannel(channels[nextIndex]);
  }

  void _scrollFocusedLiveChannelIntoView() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || !_channelMenuScrollController.hasClients) {
        return;
      }
      const itemExtent = 86.0;
      final target = (_focusedLiveChannelIndex * itemExtent).clamp(
        0.0,
        _channelMenuScrollController.position.maxScrollExtent,
      );
      _channelMenuScrollController.animateTo(
        target,
        duration: const Duration(milliseconds: 160),
        curve: Curves.easeOutCubic,
      );
    });
  }

  Future<void> _playLiveChannel(IptvContentItem channel) async {
    if (_isSwitchingLiveChannel) {
      return;
    }

    final candidates = _liveChannelCandidates(channel);
    if (candidates.isEmpty) {
      return;
    }

    final currentUrl =
        _activeVideoUrl.isNotEmpty ? _activeVideoUrl : widget.videoUrl;
    if (channel.id == _activeFavoriteId || candidates.contains(currentUrl)) {
      _closeChannelMenu();
      return;
    }

    setState(() {
      _isSwitchingLiveChannel = true;
      _activeTitle = channel.title;
      _activeSubtitle = channel.subtitle;
      _activeDescription = channel.description;
      _activeImageUrl = channel.imageUrl;
      _activeCategory = channel.category;
      _activeContentId = ApiService.playbackContentId(channel);
      _activeFavoriteId = channel.id;
      _channelMenuVisible = false;
      _controlsVisible = false;
      _isFavorite = false;
      _reconnectAttempts = 0;
      _lastPosition = Duration.zero;
      _hasStartedPlayback = false;
      _errorMessage = null;
    });
    unawaited(_loadFavoriteState());

    await _stopActivePlayback();
    if (!mounted) {
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
          resumePosition: Duration.zero,
        );
        if (ok) {
          if (mounted) {
            setState(() => _isSwitchingLiveChannel = false);
          }
          return;
        }
        lastError = _errorMessage;
      }
    }

    if (mounted) {
      setState(() {
        _isSwitchingLiveChannel = false;
        _errorMessage =
            lastError?.toString() ?? 'Nao foi possivel abrir este canal.';
      });
    }
  }

  List<String> _liveChannelCandidates(IptvContentItem channel) {
    final candidates = [
      channel.streamUrl,
      ...channel.alternateStreamUrls,
    ].map((url) => url.trim()).where((url) => url.isNotEmpty).toSet().toList();

    final extra = <String>[];
    for (final url in candidates) {
      final lower = url.toLowerCase();
      if (lower.endsWith('.ts')) {
        extra.add('${url.substring(0, url.length - 3)}.m3u8');
      } else if (lower.endsWith('.m3u8')) {
        extra.add('${url.substring(0, url.length - 5)}.ts');
      }
    }

    return [...candidates, ...extra]
        .map((url) => url.trim())
        .where((url) => url.isNotEmpty)
        .toSet()
        .toList();
  }

  void _handleControlKey(LogicalKeyboardKey key) {
    final canSeek = _canSeek;
    final controls = _visibleControlIds(canSeek);

    if (key == LogicalKeyboardKey.arrowUp && canSeek) {
      setState(() => _focusedControl = 'progress');
      _scheduleControlsHide();
      return;
    }

    if (key == LogicalKeyboardKey.arrowDown) {
      setState(() {
        if (_focusedControl == 'progress' ||
            !controls.contains(_focusedControl)) {
          _focusedControl = 'play';
        }
      });
      _scheduleControlsHide();
      return;
    }

    if (key == LogicalKeyboardKey.arrowLeft) {
      if (_focusedControl == 'progress' && canSeek) {
        _seekBy(const Duration(seconds: -10));
        return;
      }
      _moveFocusedControl(-1, controls);
      return;
    }

    if (key == LogicalKeyboardKey.arrowRight) {
      if (_focusedControl == 'progress' && canSeek) {
        _seekBy(const Duration(seconds: 10));
        return;
      }
      _moveFocusedControl(1, controls);
      return;
    }

    if (key == LogicalKeyboardKey.enter ||
        key == LogicalKeyboardKey.select ||
        key == LogicalKeyboardKey.gameButtonA) {
      _activateFocusedControl();
    }
  }

  List<String> _visibleControlIds(bool canSeek) {
    return [
      if (canSeek) 'rewind',
      'play',
      if (canSeek) 'forward',
      if (_activeFavoriteId.isNotEmpty) 'favorite',
      'renderer',
      'fullscreen',
    ];
  }

  void _moveFocusedControl(int delta, List<String> controls) {
    if (controls.isEmpty) {
      return;
    }
    var index = controls.indexOf(_focusedControl);
    if (index < 0) {
      index = controls.indexOf('play');
    }
    final nextIndex = (index + delta).clamp(0, controls.length - 1);
    setState(() => _focusedControl = controls[nextIndex]);
    _scheduleControlsHide();
  }

  void _activateFocusedControl() {
    switch (_focusedControl) {
      case 'progress':
      case 'play':
        _togglePlayPause();
        break;
      case 'rewind':
        _seekBy(const Duration(seconds: -10));
        break;
      case 'forward':
        _seekBy(const Duration(seconds: 10));
        break;
      case 'favorite':
        _toggleFavorite();
        break;
      case 'renderer':
        _switchRendererMode();
        break;
      case 'fullscreen':
        _toggleFullscreen();
        break;
    }
  }

  Future<void> _toggleFavorite() async {
    if (_activeFavoriteId.isEmpty) {
      return;
    }
    final isFavorite = await ApiService.toggleFavorite(_activeFavoriteId);
    if (mounted) {
      setState(() => _isFavorite = isFavorite);
      _scheduleControlsHide();
    }
  }

  Future<void> _seekBy(Duration delta) async {
    final mediaPlayer = _mediaKitPlayer;
    if (mediaPlayer != null) {
      if (!_canSeek) {
        return;
      }
      final duration = _mediaKitDuration;
      var target = mediaPlayer.state.position + delta;
      if (target < Duration.zero) {
        target = Duration.zero;
      }
      if (duration > Duration.zero && target > duration) {
        target = duration;
      }
      await mediaPlayer.seek(target);
      _scheduleControlsHide();
      return;
    }

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
    final mediaPlayer = _mediaKitPlayer;
    if (mediaPlayer != null && _canSeek) {
      await mediaPlayer.seek(position);
      _scheduleControlsHide();
      return;
    }

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
    return PopScope(
      canPop: !_channelMenuVisible,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop && _channelMenuVisible) {
          _closeChannelMenu();
        }
      },
      child: Scaffold(
        backgroundColor: Colors.black,
        body: Focus(
          focusNode: _playerFocusNode,
          autofocus: true,
          onKeyEvent: _handlePlayerKey,
          child: _isFullscreen
              ? _buildPlayerSurface()
              : SafeArea(
                  child: Column(
                    children: [
                      _buildHeader(),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Center(
                            child: ConstrainedBox(
                              constraints: const BoxConstraints(
                                maxWidth: 940,
                                maxHeight: 520,
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(28),
                                child: DecoratedBox(
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF101216),
                                    border: Border.all(color: Colors.white10),
                                  ),
                                  child: _buildPlayerSurface(),
                                ),
                              ),
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

  Widget _buildPlayerSurface() {
    return FutureBuilder<void>(
      future: _openMediaFuture,
      builder: (context, snapshot) {
        final hasError = _errorMessage != null || snapshot.hasError;
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
                  if (_channelMenuVisible) {
                    _closeChannelMenu();
                    return;
                  }
                  if (_isLiveContent) {
                    _openChannelMenu();
                    return;
                  }
                  if (_controlsVisible) {
                    if (_isFullscreen) {
                      setState(() => _controlsVisible = false);
                      _playerFocusNode.requestFocus();
                    }
                    return;
                  }
                  _showControls();
                },
                child: _buildVideo(),
              ),
            ),
            if (!_hasStartedPlayback) _buildLoadingOverlay(),
            if (_channelMenuVisible)
              Positioned.fill(
                child: _buildChannelMenu(),
              ),
            if (!_isLiveContent && (!_isFullscreen || _controlsVisible)) ...[
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                child: Padding(
                  padding: tvOverscanPadding(context).copyWith(bottom: 0),
                  child: _buildContentInfoOverlay(),
                ),
              ),
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Padding(
                  padding: tvOverscanPadding(context).copyWith(top: 0),
                  child: _buildControlsOverlay(),
                ),
              ),
            ],
          ],
        );
      },
    );
  }

  Widget _buildVideo() {
    final mediaKitController = _mediaKitController;
    if (mediaKitController != null) {
      return ColoredBox(
        color: Colors.black,
        child: SizedBox.expand(
          child: media_kit_video.Video(controller: mediaKitController),
        ),
      );
    }

    final controller = _controller;
    if (controller == null || !controller.value.isInitialized) {
      return const ColoredBox(color: Colors.black);
    }

    return ColoredBox(
      color: Colors.black,
      child: SizedBox.expand(
        child: VideoPlayer(controller),
      ),
    );
  }

  Widget _buildChannelMenu() {
    final channels = _liveChannels;
    final padding = tvOverscanPadding(context);

    return Container(
      color: const Color(0x33000000),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Padding(
          padding: EdgeInsets.fromLTRB(
            padding.left,
            padding.top,
            0,
            padding.bottom,
          ),
          child: Container(
            width: 390,
            decoration: BoxDecoration(
              color: const Color(0xB808090D),
              border: Border.all(color: Colors.white12),
              boxShadow: const [
                BoxShadow(
                  color: Color(0xAA000000),
                  blurRadius: 28,
                  offset: Offset(10, 0),
                ),
              ],
            ),
            child: Column(
              children: [
                Container(
                  height: 70,
                  padding: const EdgeInsets.symmetric(horizontal: 18),
                  alignment: Alignment.centerLeft,
                  decoration: const BoxDecoration(
                    border: Border(bottom: BorderSide(color: Colors.white10)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.live_tv, color: Color(0xFFB47CFF), size: 22),
                      SizedBox(width: 10),
                      Text(
                        'TV ao Vivo',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 17,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: channels.isEmpty
                      ? const Center(
                          child: Text(
                            'Nenhum canal disponivel.',
                            style: TextStyle(color: Colors.white70),
                          ),
                        )
                      : ListView.builder(
                          controller: _channelMenuScrollController,
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          itemCount: channels.length,
                          itemBuilder: (context, index) {
                            return _buildChannelMenuItem(
                              channels[index],
                              index,
                            );
                          },
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildChannelMenuItem(IptvContentItem channel, int index) {
    final focused = index == _focusedLiveChannelIndex;
    final active = channel.id == _activeFavoriteId ||
        (channel.streamUrl.isNotEmpty && channel.streamUrl == _activeVideoUrl);

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () {
        if (_isSwitchingLiveChannel) {
          return;
        }
        setState(() => _focusedLiveChannelIndex = index);
        unawaited(_playLiveChannel(channel));
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        height: 86,
        margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: focused
              ? const Color(0xAA6A00FF)
              : active
                  ? const Color(0x4418191F)
                  : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: focused
                ? const Color(0xFFB47CFF)
                : active
                    ? const Color(0x886A00FF)
                    : Colors.transparent,
            width: focused ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: SizedBox(
                width: 64,
                height: 54,
                child: _buildChannelImage(channel.imageUrl),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    channel.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    channel.subtitle.isNotEmpty
                        ? channel.subtitle
                        : 'Programacao Ao Vivo',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: focused ? Colors.white70 : Colors.white54,
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

  Widget _buildChannelImage(String url) {
    if (url.isEmpty) {
      return _buildChannelImageFallback();
    }

    return Image.network(
      url,
      fit: BoxFit.contain,
      errorBuilder: (_, __, ___) => _buildChannelImageFallback(),
      loadingBuilder: (context, child, loadingProgress) {
        if (loadingProgress == null) {
          return child;
        }
        return _buildChannelImageFallback();
      },
    );
  }

  Widget _buildChannelImageFallback() {
    return Container(
      color: const Color(0xFF15161D),
      child: const Icon(Icons.live_tv, color: Color(0xFFB47CFF), size: 28),
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
                  _activeTitle,
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
                  _activeSubtitle,
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
    final duration = _mediaKitPlayer != null
        ? _mediaKitDuration
        : controller?.value.duration ?? Duration.zero;
    final position = _mediaKitPlayer?.state.position ??
        controller?.value.position ??
        _lastPosition;
    final canSeek = _canSeek && duration > Duration.zero;
    final isPlaying = _mediaKitPlayer != null
        ? _mediaKitPlaying
        : controller?.value.isPlaying == true;

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
                        : 'Ao vivo - $_activeCategory',
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
                  _buildOverlayIconButton(
                    id: 'rewind',
                    icon: const Icon(
                      Icons.replay_10,
                      color: Colors.white,
                      size: 34,
                    ),
                    onPressed: () => _seekBy(const Duration(seconds: -10)),
                  ),
                _buildOverlayIconButton(
                  id: 'play',
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
                  _buildOverlayIconButton(
                    id: 'forward',
                    icon: const Icon(
                      Icons.forward_10,
                      color: Colors.white,
                      size: 34,
                    ),
                    onPressed: () => _seekBy(const Duration(seconds: 10)),
                  ),
                if (_activeFavoriteId.isNotEmpty)
                  _buildOverlayIconButton(
                    id: 'favorite',
                    icon: Icon(
                      _isFavorite ? Icons.favorite : Icons.favorite_border,
                      color:
                          _isFavorite ? const Color(0xFFB47CFF) : Colors.white,
                      size: 30,
                    ),
                    onPressed: _toggleFavorite,
                  ),
                _buildOverlayIconButton(
                  id: 'renderer',
                  icon: const Icon(
                    Icons.tune,
                    color: Colors.white,
                    size: 30,
                  ),
                  onPressed: _switchRendererMode,
                ),
                _buildOverlayIconButton(
                  id: 'fullscreen',
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

  Widget _buildContentInfoOverlay() {
    final description = _activeDescription.trim();

    return IgnorePointer(
      child: Container(
        padding: const EdgeInsets.fromLTRB(22, 18, 22, 36),
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xDD000000), Colors.transparent],
          ),
        ),
        child: Align(
          alignment: Alignment.topLeft,
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 860),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildContentCover(),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _activeTitle,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      if (description.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Text(
                          description,
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 14,
                            height: 1.35,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildContentCover() {
    return ClipRRect(
      borderRadius: BorderRadius.circular(10),
      child: Container(
        width: 92,
        height: 92,
        color: const Color(0xFF14151C),
        child: _activeImageUrl.isEmpty
            ? _buildContentCoverFallback()
            : Image.network(
                _activeImageUrl,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => _buildContentCoverFallback(),
                loadingBuilder: (context, child, loadingProgress) {
                  if (loadingProgress == null) {
                    return child;
                  }
                  return _buildContentCoverFallback();
                },
              ),
      ),
    );
  }

  Widget _buildContentCoverFallback() {
    return const Center(
      child: Icon(
        Icons.movie_creation_rounded,
        color: Color(0xFFB47CFF),
        size: 34,
      ),
    );
  }

  Widget _buildOverlayIconButton({
    required String id,
    required Widget icon,
    required VoidCallback onPressed,
  }) {
    final focused = _focusedControl == id;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () {
        setState(() => _focusedControl = id);
        onPressed();
        _scheduleControlsHide();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        width: 50,
        height: 50,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: focused
              ? Border.all(color: const Color(0xFFB47CFF), width: 2)
              : null,
          boxShadow: focused
              ? const [
                  BoxShadow(
                    color: Color(0x996A00FF),
                    blurRadius: 18,
                  ),
                ]
              : const [],
        ),
        child: Center(child: icon),
      ),
    );
  }

  Widget _buildProgressControl(Duration position, Duration duration) {
    final progress = duration.inMilliseconds <= 0
        ? 0.0
        : (position.inMilliseconds / duration.inMilliseconds).clamp(0.0, 1.0);

    final focused = _focusedControl == 'progress';

    return MouseRegion(
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => setState(() => _focusedControl = 'progress'),
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
              color: focused ? const Color(0xFFB47CFF) : Colors.white10,
              width: focused ? 2 : 1,
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

class _RendererMode {
  final String label;
  final VideoViewType viewType;

  const _RendererMode({
    required this.label,
    required this.viewType,
  });
}
