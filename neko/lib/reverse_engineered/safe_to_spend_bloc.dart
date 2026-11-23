import 'package:flutter_bloc/flutter_bloc.dart';

/// Inspirado en `SafeToSpendBloc` del binario NEKO — implementación tuya.
class SafeToSpendState {
  const SafeToSpendState({this.amount, this.percent, this.loading = false});
  final double? amount;
  final double? percent;
  final bool loading;
}

class SafeToSpendBloc extends Cubit<SafeToSpendState> {
  SafeToSpendBloc() : super(const SafeToSpendState(loading: true));

  Future<void> initialize() async {
    emit(const SafeToSpendState(loading: false));
  }

  void update() {}
}