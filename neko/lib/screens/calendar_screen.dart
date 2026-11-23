import 'package:flutter/material.dart';

import '../theme/neko_theme.dart';
import '../widgets/neko_background.dart';

class CalendarScreen extends StatelessWidget {
  const CalendarScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return NekoBackground(
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Padding(
              padding: EdgeInsets.all(16),
              child: Text('Calendario', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w600)),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  _seg(context, 'Balance', true),
                  const SizedBox(width: 8),
                  _seg(context, 'Flujo', false),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: GridView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 7,
                  mainAxisSpacing: 6,
                  crossAxisSpacing: 6,
                ),
                itemCount: 35,
                itemBuilder: (_, i) {
                  final day = i - 2;
                  if (day < 1 || day > 30) return const SizedBox();
                  final selected = day == 23;
                  return Container(
                    decoration: BoxDecoration(
                      color: selected ? NekoColors.accent.withValues(alpha: 0.2) : NekoColors.surface,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: selected ? NekoColors.accent : NekoColors.border,
                      ),
                    ),
                    child: Center(
                      child: Text(
                        '$day',
                        style: TextStyle(
                          fontWeight: selected ? FontWeight.w700 : FontWeight.w400,
                          color: selected ? NekoColors.accent : NekoColors.text,
                        ),
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

  Widget _seg(BuildContext context, String label, bool on) {
    return Expanded(
      child: Material(
        color: on ? NekoColors.accent.withValues(alpha: 0.15) : NekoColors.surface,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: on ? NekoColors.accent : NekoColors.textMuted,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }
}