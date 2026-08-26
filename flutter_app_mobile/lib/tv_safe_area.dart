import 'package:flutter/material.dart';

EdgeInsets tvOverscanPadding(BuildContext context) {
  return MediaQuery.of(context).padding;
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
    return ColoredBox(
      color: backgroundColor,
      child: SafeArea(
        child: child,
      ),
    );
  }
}
