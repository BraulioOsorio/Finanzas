import 'package:flutter/material.dart';

import '../theme/neko_theme.dart';
import '../widgets/neko_background.dart';

class HistoryScreen extends StatelessWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return NekoBackground(
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Padding(
              padding: EdgeInsets.all(16),
              child: Text('Historial', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w600)),
            ),
            Expanded(
              child: ListView.builder(
                itemCount: 8,
                itemBuilder: (_, i) {
                  return ListTile(
                    leading: const CircleAvatar(
                      backgroundColor: NekoColors.surface,
                      child: Icon(Icons.receipt_long_outlined, color: NekoColors.accent, size: 20),
                    ),
                    title: Text('Movimiento ${i + 1}'),
                    subtitle: const Text('23 nov 2026', style: TextStyle(color: NekoColors.textMuted)),
                    trailing: Text(
                      i.isEven ? '-\$ 45.000' : '+\$ 120.000',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: i.isEven ? NekoColors.expense : NekoColors.income,
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}