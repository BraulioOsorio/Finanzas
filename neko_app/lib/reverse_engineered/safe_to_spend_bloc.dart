// Reimplementación editable — inspirado en SafeToSpendBloc de NEKO (libapp.so).
library;

/// Excluir cuentas del cálculo (como `safeToSpend.excludedAccountsIds` en NEKO).
class SafeToSpendBloc {
  SafeToSpendBloc({this.excludedAccountIds = const {}});

  final Set<String> excludedAccountIds;

  Future<void> initialize() async {}

  void update() {}

  /// TODO: portar fórmula desde `src/domain/safeToSpend.ts` (TypeScript ya en repo).
  double? safeToSpendPercent;
}