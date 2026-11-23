import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../cubit/neko_data_cubit.dart';
import '../theme/neko_theme.dart';
import '../utils/format_money.dart';
import '../widgets/neko_background.dart';

class HistoryScreen extends StatelessWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return NekoBackground(
      child: SafeArea(
        child: BlocBuilder<NekoDataCubit, NekoDataState>(
          builder: (context, state) {
            if (!state.hasDb) {
              return const Center(child: Text('Importa Neko - My Data primero'));
            }
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Padding(
                  padding: EdgeInsets.all(16),
                  child: Text('Historial', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w600)),
                ),
                Expanded(
                  child: ListView.builder(
                    itemCount: state.transactions.length,
                    itemBuilder: (_, i) {
                      final t = state.transactions[i];
                      return ListTile(
                        leading: CircleAvatar(
                          backgroundColor: NekoColors.surface,
                          child: Icon(
                            t.isInflow ? Icons.arrow_downward : Icons.arrow_upward,
                            color: t.isInflow ? NekoColors.income : NekoColors.expense,
                            size: 20,
                          ),
                        ),
                        title: Text(t.description, maxLines: 2, overflow: TextOverflow.ellipsis),
                        subtitle: Text(t.date, style: const TextStyle(color: NekoColors.textMuted)),
                        trailing: Text(
                          formatSignedCop(t.amount, inflow: t.isInflow),
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: t.isInflow ? NekoColors.income : NekoColors.text,
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}