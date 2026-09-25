import 'package:flutter_test/flutter_test.dart';

import 'package:lumina_eco/main.dart';

void main() {
  testWidgets('renders the polished splash screen',
      (WidgetTester tester) async {
    await tester.pumpWidget(const LuminaEcoApp());

    expect(find.text('Lumina Eco'), findsOneWidget);
    expect(find.text('Banking yang berdampak baik'), findsOneWidget);
  });
}
