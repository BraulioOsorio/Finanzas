class NekoAccount {
  const NekoAccount({
    required this.id,
    required this.name,
    required this.balance,
    required this.typeId,
    this.includeInTotal = true,
  });

  final String id;
  final String name;
  final double balance;
  final int typeId;
  final bool includeInTotal;

  bool get isLiquid => typeId == 1 || typeId == 2 || typeId == 3;

  String get groupLabel {
    switch (typeId) {
      case 1:
        return 'Efectivo';
      case 2:
        return 'Banco';
      case 3:
        return 'Ahorro';
      case 4:
        return 'Tarjeta de crédito';
      case 5:
      case 7:
        return 'Préstamo';
      default:
        return 'Cuenta';
    }
  }

  factory NekoAccount.fromRow(Map<String, Object?> row) {
    return NekoAccount(
      id: row['_id'] as String,
      name: (row['description'] as String?) ?? 'Cuenta',
      balance: (row['balance'] as num?)?.toDouble() ?? 0,
      typeId: (row['account_type_id'] as int?) ?? 0,
      includeInTotal: (row['is_include_in_total_balance'] as int?) != 0,
    );
  }
}