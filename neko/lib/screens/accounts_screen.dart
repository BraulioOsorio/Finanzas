import 'package:flutter/material.dart';

import '../theme/neko_theme.dart';
import '../widgets/neko_background.dart';

class AccountsScreen extends StatelessWidget {
  const AccountsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return NekoBackground(
      child: SafeArea(
        child: Column(
          children: [
            const Padding(
              padding: EdgeInsets.all(16),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text('Cuentas', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w600)),
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: const [
                  _AccountRow(name: 'Efectivo', balance: '\$ 619.000', group: 'Líquido'),
                  _AccountRow(name: 'Tarjeta crédito', balance: '-\$ 13.535.128', group: 'Crédito'),
                  _AccountRow(name: 'Ahorros', balance: '\$ 2.100.000', group: 'Ahorro'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AccountRow extends StatelessWidget {
  const _AccountRow({required this.name, required this.balance, required this.group});

  final String name;
  final String balance;
  final String group;

  @override
  Widget build(BuildContext context) {
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
                Text(name, style: const TextStyle(fontWeight: FontWeight.w600)),
                Text(group, style: const TextStyle(color: NekoColors.textMuted, fontSize: 12)),
              ],
            ),
          ),
          Text(balance, style: const TextStyle(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}