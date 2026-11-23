import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../cubit/neko_data_cubit.dart';
import '../theme/neko_theme.dart';
import '../utils/format_money.dart';
import '../widgets/neko_background.dart';

class AccountsScreen extends StatelessWidget {
  const AccountsScreen({super.key});

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
              children: [
                const Padding(
                  padding: EdgeInsets.all(16),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Text('Cuentas', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w600)),
                  ),
                ),
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: state.accounts.length,
                    itemBuilder: (_, i) {
                      final a = state.accounts[i];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: NekoColors.surface,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: NekoColors.border),
                        ),
                        child: Row(
                          children: [
                            CircleAvatar(
                              backgroundColor: NekoColors.accent.withValues(alpha: 0.2),
                              child: const Icon(Icons.account_balance_wallet_outlined, color: NekoColors.accent, size: 20),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(a.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                                  Text(a.groupLabel, style: const TextStyle(color: NekoColors.textMuted, fontSize: 12)),
                                ],
                              ),
                            ),
                            Text(formatCop(a.balance), style: const TextStyle(fontWeight: FontWeight.w600)),
                          ],
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