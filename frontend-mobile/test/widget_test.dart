import 'package:flutter_test/flutter_test.dart';

import 'package:lumina_eco/main.dart';

void main() {
  testWidgets('renders the login screen', (WidgetTester tester) async {
    await tester.pumpWidget(const LuminaEcoApp());

    expect(find.text('Masuk ke Akun Anda'), findsOneWidget);
    expect(find.text('Lumina Eco'), findsOneWidget);
    expect(find.text('Masuk'), findsOneWidget);
  });
}
