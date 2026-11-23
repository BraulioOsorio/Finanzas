import 'package:flutter_test/flutter_test.dart';
import 'package:neko/app.dart';

void main() {
  testWidgets('app smoke', (tester) async {
    await tester.pumpWidget(const NekoForkApp());
    expect(find.text('Disponible para gastar'), findsOneWidget);
  });
}