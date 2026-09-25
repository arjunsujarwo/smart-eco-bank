import 'package:flutter_test/flutter_test.dart';

import 'package:smart_eco_bank/main.dart';

void main() {
  testWidgets('renders the polished splash screen',
      (WidgetTester tester) async {
    await tester.pumpWidget(const SmartEcoBankApp());

    expect(find.text('Smart Eco Bank'), findsOneWidget);
    expect(find.text('Banking yang berdampak baik'), findsOneWidget);
  });
}
