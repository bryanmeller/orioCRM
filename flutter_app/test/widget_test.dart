// Basic widget test for ORIO PLAYER.

import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:streamflix_tv/main.dart';

void main() {
  testWidgets('Initial screen loads correctly', (WidgetTester tester) async {
    await tester.pumpWidget(const StreamFlixApp(initialRoute: '/'));

    expect(
      find.byWidgetPredicate(
        (widget) =>
            widget is Image &&
            widget.image is AssetImage &&
            (widget.image as AssetImage).assetName ==
                'assets/images/orio_logo.png',
      ),
      findsWidgets,
    );
    expect(find.text('JÁ TENHO LICENÇA'), findsOneWidget);
    expect(find.text('NÃO TENHO LICENÇA'), findsOneWidget);
  });
}
