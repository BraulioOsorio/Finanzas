class NekoTransaction {
  const NekoTransaction({
    required this.id,
    required this.description,
    required this.amount,
    required this.date,
    required this.typeId,
  });

  final String id;
  final String description;
  final double amount;
  final String date;
  final int typeId;

  bool get isInflow =>
      typeId == 3 || typeId == 7;

  factory NekoTransaction.fromRow(Map<String, Object?> row) {
    return NekoTransaction(
      id: row['_id'] as String,
      description: (row['description'] as String?) ?? '',
      amount: (row['amount'] as num?)?.toDouble() ?? 0,
      date: (row['posted_date_str'] as String?) ?? '',
      typeId: (row['transaction_type_id'] as int?) ?? 0,
    );
  }
}