import 'package:flutter_bloc/flutter_bloc.dart';

import '../domain/neko_summary.dart';
import '../models/account.dart';
import '../models/transaction.dart';
import '../services/neko_database.dart';

class NekoDataState {
  const NekoDataState({
    this.loading = false,
    this.hasDb = false,
    this.error,
    this.accounts = const [],
    this.transactions = const [],
    this.liquidTotal = 0,
    this.monthExpense = 0,
    this.monthIncome = 0,
    this.safeToSpend = 0,
    this.summary,
  });

  final bool loading;
  final bool hasDb;
  final String? error;
  final List<NekoAccount> accounts;
  final List<NekoTransaction> transactions;
  final double liquidTotal;
  final double monthExpense;
  final double monthIncome;
  final double safeToSpend;
  final NekoSummary? summary;

  double get budgetPercent {
    if (monthIncome <= 0) return 0;
    final left = safeToSpend.clamp(0, double.infinity);
    return (left / monthIncome).clamp(0, 1);
  }

  NekoDataState copyWith({
    bool? loading,
    bool? hasDb,
    String? error,
    List<NekoAccount>? accounts,
    List<NekoTransaction>? transactions,
    double? liquidTotal,
    double? monthExpense,
    double? monthIncome,
    double? safeToSpend,
    NekoSummary? summary,
  }) {
    return NekoDataState(
      loading: loading ?? this.loading,
      hasDb: hasDb ?? this.hasDb,
      error: error,
      accounts: accounts ?? this.accounts,
      transactions: transactions ?? this.transactions,
      liquidTotal: liquidTotal ?? this.liquidTotal,
      monthExpense: monthExpense ?? this.monthExpense,
      monthIncome: monthIncome ?? this.monthIncome,
      safeToSpend: safeToSpend ?? this.safeToSpend,
      summary: summary ?? this.summary,
    );
  }
}

class NekoDataCubit extends Cubit<NekoDataState> {
  NekoDataCubit() : super(const NekoDataState(loading: true)) {
    refresh();
  }

  final _db = NekoDatabase.instance;

  Future<void> refresh() async {
    emit(state.copyWith(loading: true, error: null));
    try {
      final has = await _db.hasDatabase;
      if (!has) {
        emit(const NekoDataState(loading: false, hasDb: false));
        return;
      }
      final accounts = await _db.loadAccounts();
      final tx = await _db.loadRecentTransactions();
      final summary = NekoSummary.fromAccounts(accounts);
      final month = DateTime.now().toIso8601String().substring(0, 7);
      final expense = await _db.monthExpenseTotal(month);
      final income = await _db.monthIncomeTotal(month);
      emit(
        NekoDataState(
          loading: false,
          hasDb: true,
          accounts: accounts,
          transactions: tx,
          liquidTotal: summary.liquidTotal,
          monthExpense: expense,
          monthIncome: income,
          safeToSpend: summary.safeToSpend,
          summary: summary,
        ),
      );
    } catch (e) {
      emit(NekoDataState(loading: false, hasDb: false, error: e.toString()));
    }
  }
}