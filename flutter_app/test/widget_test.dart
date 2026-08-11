// Basic widget test for StreamFlix TV.

import 'package:flutter_test/flutter_test.dart';
import 'package:streamflix_tv/main.dart';

void main() {
  testWidgets('Initial screen loads correctly', (WidgetTester tester) async {
    await tester.pumpWidget(const StreamFlixApp(initialRoute: '/'));

    expect(find.text('STREAMFLIX TV'), findsWidgets);
    expect(find.text('JÁ TENHO LICENÇA'), findsOneWidget);
    expect(find.text('NÃO TENHO LICENÇA'), findsOneWidget);
  });
}
