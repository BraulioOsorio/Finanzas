import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../reverse_engineered/safe_to_spend_bloc.dart';
import '../theme/neko_theme.dart';
import '../widgets/neko_background.dart';
import '../widgets/neko_section_header.dart';
import '../widgets/safe_to_spend_ring.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return NekoBackground(
      child: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverAppBar(
              floating: true,
              title: const Text('Neko'),
              actions: [
                IconButton(
                  onPressed: () {},
                  icon: const Icon(Icons.search_outlined),
                ),
                IconButton(
                  onPressed: () {},
                  icon: const Icon(Icons.menu_rounded),
                ),
              ],
            ),
            SliverToBoxAdapter(
              child: BlocBuilder<SafeToSpendBloc, SafeToSpendState>(
                builder: (context, state) {
                  return SafeToSpendRing(
                    amount: state.amount ?? 619000,
                    percent: state.percent ?? 0.42,
                  );
                },
              ),
            ),
            const SliverToBoxAdapter(
              child: NekoSectionHeader(title: 'Este mes'),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 120,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: const [
                    _MonthCard(label: 'Ingresos', value: '+\$ 2.450.000', positive: true),
                    _MonthCard(label: 'Gastos', value: '-\$ 1.890.000', positive: false),
                    _MonthCard(label: 'Ahorro', value: '\$ 560.000', positive: true),
                  ],
                ),
              ),
            ),
            const SliverToBoxAdapter(
              child: NekoSectionHeader(
                title: 'Próximo',
                trailing: Icon(Icons.chevron_right, color: NekoColors.textMuted),
              ),
            ),
            SliverList(
              delegate: SliverChildListDelegate([
                _upcomingTile('Internet', 'Mañana', '-\$ 89.900'),
                _upcomingTile('Tarjeta crédito', '25 nov', '-\$ 1.253.512'),
                _upcomingTile('Salario', '30 nov', '+\$ 3.200.000'),
              ]),
            ),
          ],
        ),
      ),
    );
  }

  static Widget _upcomingTile(String title, String when, String amount) {
    final positive = amount.startsWith('+');
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w500)),
      subtitle: Text(when, style: const TextStyle(color: NekoColors.textMuted, fontSize: 12)),
      trailing: Text(
        amount,
        style: TextStyle(
          fontWeight: FontWeight.w600,
          color: positive ? NekoColors.income : NekoColors.text,
        ),
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
              fontSize: 16,
              color: positive ? NekoColors.income : NekoColors.expense,
            ),
          ),
        ],
      ),
    );
  }
}