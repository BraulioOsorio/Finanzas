import 'package:flutter/material.dart';

import '../screens/accounts_screen.dart';
import '../screens/analysis_screen.dart';
import '../screens/calendar_screen.dart';
import '../screens/history_screen.dart';
import '../screens/home_screen.dart';
import '../theme/neko_theme.dart';

class NekoShell extends StatefulWidget {
  const NekoShell({super.key});

  @override
  State<NekoShell> createState() => _NekoShellState();
}

class _NekoShellState extends State<NekoShell> {
  int _index = 0;

  static const _screens = [
    HomeScreen(),
    CalendarScreen(),
    AnalysisScreen(),
    AccountsScreen(),
    HistoryScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _index, children: _screens),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddSheet,
        child: const Icon(Icons.add, size: 30),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      bottomNavigationBar: NavigationBar(
        height: 68,
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Inicio'),
          NavigationDestination(icon: Icon(Icons.calendar_month_outlined), selectedIcon: Icon(Icons.calendar_month), label: 'Calendario'),
          NavigationDestination(icon: Icon(Icons.pie_chart_outline), selectedIcon: Icon(Icons.pie_chart), label: 'Análisis'),
          NavigationDestination(icon: Icon(Icons.account_balance_wallet_outlined), selectedIcon: Icon(Icons.account_balance_wallet), label: 'Cuentas'),
          NavigationDestination(icon: Icon(Icons.list_alt_outlined), selectedIcon: Icon(Icons.list_alt), label: 'Historial'),
        ],
      ),
    );
  }

  void _showAddSheet() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: NekoColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Agregar transacción',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            _typeTile(Icons.remove_circle_outline, 'Gasto', NekoColors.expense),
            _typeTile(Icons.add_circle_outline, 'Ingreso', NekoColors.income),
            _typeTile(Icons.swap_horiz, 'Transferencia', NekoColors.accent),
            _typeTile(Icons.credit_card, 'Pago tarjeta', NekoColors.text),
          ],
        ),
      ),
    );
  }

  Widget _typeTile(IconData icon, String label, Color color) {
    return ListTile(
      leading: Icon(icon, color: color),
      title: Text(label),
      trailing: const Icon(Icons.chevron_right, color: NekoColors.textMuted),
      onTap: () => Navigator.pop(context),
    );
  }
}