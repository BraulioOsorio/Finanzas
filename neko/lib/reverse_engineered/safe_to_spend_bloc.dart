import 'package:flutter_bloc/flutter_bloc.dart';

class SafeToSpendState {
  const SafeToSpendState({this.amount, this.percent, this.loading = false});
  final double? amount;
  final double? percent;
  final bool loading;
}

class SafeToSpendBloc extends Cubit<SafeToSpendState> {
  SafeToSpendBloc() : super(const SafeToSpendState(loading: true));

  Future<void> initialize() async {
    emit(const SafeToSpendState(amount: 619000, percent: 0.42, loading: false));
  }

  void update() {}
}