import '../models/account.dart';

/// Resumen estilo NEKO desde saldos en SQLite (misma fuente que la app oficial).
class NekoSummary {
  const NekoSummary({
    required this.liquidTotal,
    required this.creditTotal,
    required this.savingsTotal,
    required this.netWorth,
    required this.safeToSpend,
  });

  final double liquidTotal;
  final double creditTotal;
  final double savingsTotal;
  final double netWorth;
  final double safeToSpend;

  static NekoSummary fromAccounts(List<NekoAccount> accounts) {
    double liquid = 0, credit = 0, savings = 0;
    for (final a in accounts) {
      if (!a.includeInTotal) continue;
      final t = a.typeId;
      if (t == 1 || t == 2) {
        liquid += a.balance;
      } else if (t == 3) {
        savings += a.balance;
      } else if (t == 4 || t == 5 || t == 7) {
        credit += a.balance;
      } else {
        liquid += a.balance;
      }
    }
    final net = liquid + savings + credit;
    return NekoSummary(
      liquidTotal: liquid,
      creditTotal: credit,
      savingsTotal: savings,
      netWorth: net,
      safeToSpend: liquid,
    );
  }
}