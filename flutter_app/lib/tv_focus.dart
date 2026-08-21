import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class TvFocusable extends StatefulWidget {
  final Widget Function(BuildContext context, bool focused) builder;
  final VoidCallback? onPressed;
  final bool autofocus;
  final bool enabled;
  final FocusNode? focusNode;
  final ValueChanged<bool>? onFocusChange;
  final FocusOnKeyEventCallback? onKeyEvent;

  const TvFocusable({
    super.key,
    required this.builder,
    this.onPressed,
    this.autofocus = false,
    this.enabled = true,
    this.focusNode,
    this.onFocusChange,
    this.onKeyEvent,
  });

  @override
  State<TvFocusable> createState() => _TvFocusableState();
}

class _TvFocusableState extends State<TvFocusable> {
  bool _focused = false;

  void _activate() {
    if (widget.enabled) {
      widget.onPressed?.call();
    }
  }

  void _setFocused(bool focused) {
    if (_focused == focused) {
      return;
    }
    setState(() => _focused = focused);
    widget.onFocusChange?.call(focused);
  }

  KeyEventResult _handleKeyEvent(FocusNode node, KeyEvent event) {
    if (event is! KeyDownEvent || !widget.enabled) {
      return KeyEventResult.ignored;
    }

    final key = event.logicalKey;
    final customResult = widget.onKeyEvent?.call(node, event);
    if (customResult == KeyEventResult.handled) {
      return KeyEventResult.handled;
    }

    if (key == LogicalKeyboardKey.enter ||
        key == LogicalKeyboardKey.select ||
        key == LogicalKeyboardKey.gameButtonA) {
      _activate();
      return KeyEventResult.handled;
    }

    return KeyEventResult.ignored;
  }

  @override
  Widget build(BuildContext context) {
    return Focus(
      focusNode: widget.focusNode,
      autofocus: widget.autofocus,
      canRequestFocus: widget.enabled,
      onFocusChange: _setFocused,
      onKeyEvent: _handleKeyEvent,
      child: MouseRegion(
        cursor: widget.enabled ? SystemMouseCursors.click : MouseCursor.defer,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: widget.enabled ? _activate : null,
          child: widget.builder(context, _focused),
        ),
      ),
    );
  }
}

BoxDecoration tvFocusDecoration({
  required bool focused,
  required Color baseColor,
  double radius = 16,
  Color borderColor = Colors.white10,
  Color? focusedColor,
}) {
  final glowColor = focusedColor ?? const Color(0xFFB47CFF);

  return BoxDecoration(
    color: baseColor,
    borderRadius: BorderRadius.circular(radius),
    border: Border.all(
      color: focused ? glowColor : borderColor,
      width: focused ? 2 : 1,
    ),
    boxShadow: focused
        ? [
            BoxShadow(
              color: glowColor.withOpacity(0.45),
              blurRadius: 22,
              spreadRadius: 1,
            ),
          ]
        : const [],
  );
}
