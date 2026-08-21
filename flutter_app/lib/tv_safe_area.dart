import 'dart:math' as math;

import 'package:flutter/material.dart';

EdgeInsets tvOverscanPadding(BuildContext context) {
  final size = MediaQuery.of(context).size;
  final horizontal = (size.width * 0.016).clamp(14.0, 42.0).toDouble();
  final vertical = (size.height * 0.018).clamp(10.0, 28.0).toDouble();

  return EdgeInsets.fromLTRB(horizontal, vertical, horizontal, vertical);
}

class TvOverscanSafeArea extends StatelessWidget {
  final Widget child;
  final Color backgroundColor;

  const TvOverscanSafeArea({
    super.key,
    required this.child,
    this.backgroundColor = Colors.black,
  });

  @override
  Widget build(BuildContext context) {
    final mediaPadding = MediaQuery.of(context).padding;
    final overscanPadding = tvOverscanPadding(context);
    final safePadding = EdgeInsets.fromLTRB(
      math.max(mediaPadding.left, overscanPadding.left),
      math.max(mediaPadding.top, overscanPadding.top),
      math.max(mediaPadding.right, overscanPadding.right),
      math.max(mediaPadding.bottom, overscanPadding.bottom),
    );

    return ColoredBox(
      color: backgroundColor,
      child: Padding(
        padding: safePadding,
        child: child,
      ),
    );
  }
}
