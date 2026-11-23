import 'package:intl/intl.dart';

final _cop = NumberFormat.currency(locale: 'es_CO', symbol: '\$', decimalDigits: 0);

String formatCop(double v) => _cop.format(v);

String formatSignedCop(double v, {required bool inflow}) {
  final s = formatCop(v.abs());
  return inflow ? '+$s' : '-$s';
}