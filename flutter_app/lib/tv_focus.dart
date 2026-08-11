import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class TvFocusable extends StatefulWidget {
  final Widget Function(BuildContext context, bool focused) builder;
  final VoidCallback? onPressed;
  final bool autofocus;
  final bool enabled;
  final ValueChanged<bool>? onFocusChange;

  const TvFocusable({
    super.key,
    required this.builder,
    this.onPressed,
    this.autofocus = false,
    this.enabled = true,
    this.onFocusChange,
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

  @override
  Widget build(BuildContext context) {
    return Shortcuts(
      shortcuts: const {
        SingleActivator(LogicalKeyboardKey.enter): ActivateIntent(),
        SingleActivator(LogicalKeyboardKey.select): ActivateIntent(),
        SingleActivator(LogicalKeyboardKey.gameButtonA): ActivateIntent(),
      },
      child: Actions(
        actions: {
          ActivateIntent: CallbackAction<ActivateIntent>(
            onInvoke: (_) {
              _activate();
              return null;
            },
          ),
        },
        child: FocusableActionDetector(
          autofocus: widget.autofocus,
          enabled: widget.enabled,
          mouseCursor:
              widget.enabled ? SystemMouseCursors.click : MouseCursor.defer,
          onFocusChange: _setFocused,
          onShowFocusHighlight: _setFocused,
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: widget.enabled ? _activate : null,
            child: widget.builder(context, _focused),
          ),
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
