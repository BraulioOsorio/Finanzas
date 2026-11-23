import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../cubit/neko_data_cubit.dart';
import '../theme/neko_theme.dart';
import '../utils/format_money.dart';
import '../widgets/neko_background.dart';

class AnalysisScreen extends StatelessWidget {
  const AnalysisScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return NekoBackground(
      child: SafeArea(
        child: BlocBuilder<NekoDataCubit, NekoDataState>(
          builder: (context, state) {
            final s = state.summary;
            if (!state.hasDb || s == null) {
              return const Center(child: Text('Importa Neko - My Data primero'));
            }
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                const Text('Análisis', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w600)),
                const SizedBox(height: 20),
                _card('Patrimonio neto', formatCop(s.netWorth)),
                _card('Líquido', formatCop(s.liquidTotal)),
                _card('Ahorros', formatCop(s.savingsTotal)),
                _card('Crédito / préstamos', formatCop(s.creditTotal)),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _card(String title, String subtitle) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: NekoColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: NekoColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
          const SizedBox(height: 6),
          Text(subtitle, style: const TextStyle(color: NekoColors.textMuted)),
        ],
      ),
    );
  }
}