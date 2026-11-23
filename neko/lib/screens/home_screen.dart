import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../cubit/neko_data_cubit.dart';
import '../screens/import_screen.dart';
import '../theme/neko_theme.dart';
import '../utils/format_money.dart';
import '../widgets/neko_background.dart';
import '../widgets/neko_section_header.dart';
import '../widgets/safe_to_spend_ring.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return NekoBackground(
      child: SafeArea(
        child: BlocBuilder<NekoDataCubit, NekoDataState>(
          builder: (context, state) {
            if (state.loading) {
              return const Center(child: CircularProgressIndicator(color: NekoColors.accent));
            }
            if (!state.hasDb) {
              return _needImport(context, state.error);
            }
            return CustomScrollView(
              slivers: [
                SliverAppBar(
                  floating: true,
                  title: const Text('Neko'),
                  actions: [
                    IconButton(onPressed: () {}, icon: const Icon(Icons.search_outlined)),
                    IconButton(
                      onPressed: () => Navigator.push(
                        context,
                        MaterialPageRoute<void>(builder: (_) => const ImportScreen()),
                      ),
                      icon: const Icon(Icons.menu_rounded),
                    ),
                  ],
                ),
                SliverToBoxAdapter(
                  child: SafeToSpendRing(
                    amount: state.safeToSpend,
                    percent: state.budgetPercent,
                  ),
                ),
                const SliverToBoxAdapter(child: NekoSectionHeader(title: 'Este mes')),
                SliverToBoxAdapter(
                  child: SizedBox(
                    height: 120,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      children: [
                        _MonthCard(label: 'Ingresos', value: formatSignedCop(state.monthIncome, inflow: true), positive: true),
                        _MonthCard(label: 'Gastos', value: formatSignedCop(state.monthExpense, inflow: false), positive: false),
                        _MonthCard(
                          label: 'Líquido',
                          value: formatCop(state.liquidTotal),
                          positive: state.liquidTotal >= 0,
                        ),
                      ],
                    ),
                  ),
                ),
                const SliverToBoxAdapter(
                  child: NekoSectionHeader(title: 'Últimos movimientos'),
                ),
                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, i) {
                      final t = state.transactions[i];
                      return ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 20),
                        title: Text(t.description, maxLines: 1, overflow: TextOverflow.ellipsis),
                        subtitle: Text(t.date, style: const TextStyle(color: NekoColors.textMuted, fontSize: 12)),
                        trailing: Text(
                          formatSignedCop(t.amount, inflow: t.isInflow),
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: t.isInflow ? NekoColors.income : NekoColors.text,
                          ),
                        ),
                      );
                    },
                    childCount: state.transactions.length.clamp(0, 12),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _needImport(BuildContext context, String? error) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.storage_outlined, size: 64, color: NekoColors.accent),
          const SizedBox(height: 16),
          const Text(
            'Importa tu backup NEKO',
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.w600),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            error ?? 'Exporta «Neko - My Data» en la app NEKO y impórtalo aquí.',
            textAlign: TextAlign.center,
            style: const TextStyle(color: NekoColors.textMuted),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute<void>(builder: (_) => const ImportScreen()),
            ),
            child: const Text('Importar ahora'),
          ),
        ],
      ),
    );
  }
}

class _MonthCard extends StatelessWidget {
  const _MonthCard({required this.label, required this.value, required this.positive});

  final String label;
  final String value;
  final bool positive;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 160,
      margin: const EdgeInsets.only(right: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: NekoColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: NekoColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: NekoColors.textMuted, fontSize: 12)),
          const Spacer(),
          Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 15,
              color: positive ? NekoColors.income : NekoColors.expense,
            ),
          ),
        ],
      ),
    );
  }
}