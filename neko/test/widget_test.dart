import 'package:flutter_test/flutter_test.dart';
import 'package:neko/app.dart';

void main() {
  testWidgets('tabs NEKO visibles', (tester) async {
    await tester.pumpWidget(const NekoForkApp());
    await tester.pumpAndSettle();
    expect(find.text('Inicio'), findsWidgets);
    expect(find.text('Disponible para gastar'), findsOneWidget);
  });
}