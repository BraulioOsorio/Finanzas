import 'dart:io';

import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sqflite/sqflite.dart';

import '../models/account.dart';
import '../models/transaction.dart';

/// Abre el backup NEKO «Neko - My Data» copiado en la app (mismo SQLite que en el móvil).
class NekoDatabase {
  NekoDatabase._();
  static final instance = NekoDatabase._();

  Database? _db;
  static const _prefsKey = 'neko_db_filename';

  Future<bool> get hasDatabase async {
    final path = await _dbPath();
    return File(path).existsSync();
  }

  Future<String> _dbPath() async {
    final dir = await getApplicationDocumentsDirectory();
    final prefs = await SharedPreferences.getInstance();
    final name = prefs.getString(_prefsKey) ?? 'neko_data.db';
    return p.join(dir.path, name);
  }

  Future<void> importBackup(File source) async {
    final dest = await _dbPath();
    await source.copy(dest);
    await _db?.close();
    _db = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefsKey, p.basename(dest));
  }

  Future<Database> _open() async {
    if (_db != null) return _db!;
    final path = await _dbPath();
    if (!File(path).existsSync()) {
      throw StateError('Sin backup. Menú → Importar «Neko - My Data».');
    }
    _db = await openDatabase(path, readOnly: true);
    return _db!;
  }

  Future<List<NekoAccount>> loadAccounts() async {
    final db = await _open();
    final rows = await db.rawQuery('''
      SELECT _id, description, balance, account_type_id, is_include_in_total_balance
      FROM tbl_account
      WHERE IFNULL(is_deleted, 0) = 0
      ORDER BY description COLLATE NOCASE
    ''');
    return rows.map(NekoAccount.fromRow).toList();
  }

  Future<List<NekoTransaction>> loadRecentTransactions({int limit = 80}) async {
    final db = await _open();
    final rows = await db.rawQuery('''
      SELECT _id, description, amount, posted_date_str, transaction_type_id
      FROM tbl_transaction_entry
      WHERE IFNULL(is_deleted, 0) = 0 AND IFNULL(is_posted, 0) = 1
      ORDER BY posted_date_str DESC, _id DESC
      LIMIT ?
    ''', [limit]);
    return rows.map(NekoTransaction.fromRow).toList();
  }

  /// Suma saldos líquidos (tipos 1–3), estilo NEKO.
  Future<double> liquidBalanceTotal() async {
    final accounts = await loadAccounts();
    return accounts
        .where((a) => a.isLiquid && a.includeInTotal)
        .fold<double>(0, (s, a) => s + a.balance);
  }

  Future<double> monthExpenseTotal(String monthKey) async {
    final db = await _open();
    final rows = await db.rawQuery('''
      SELECT IFNULL(SUM(amount), 0) AS total
      FROM tbl_transaction_entry
      WHERE IFNULL(is_deleted, 0) = 0 AND IFNULL(is_posted, 0) = 1
        AND transaction_type_id IN (1, 2, 8)
        AND posted_date_str LIKE ?
    ''', ['$monthKey%']);
    return (rows.first['total'] as num?)?.toDouble() ?? 0;
  }

  Future<List<Map<String, Object?>>> loadRecurringPreview({int limit = 8}) async {
    final db = await _open();
    return db.rawQuery('''
      SELECT description, amount, scheduled_date_str AS when_date
      FROM tbl_recurring_transaction
      WHERE IFNULL(is_deleted, 0) = 0
      ORDER BY scheduled_date_str
      LIMIT ?
    ''', [limit]);
  }

  Future<double> monthIncomeTotal(String monthKey) async {
    final db = await _open();
    final rows = await db.rawQuery('''
      SELECT IFNULL(SUM(amount), 0) AS total
      FROM tbl_transaction_entry
      WHERE IFNULL(is_deleted, 0) = 0 AND IFNULL(is_posted, 0) = 1
        AND transaction_type_id IN (3, 7)
        AND posted_date_str LIKE ?
    ''', ['$monthKey%']);
    return (rows.first['total'] as num?)?.toDouble() ?? 0;
  }
}