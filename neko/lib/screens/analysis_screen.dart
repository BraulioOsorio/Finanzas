import 'package:flutter/material.dart';

import '../theme/neko_theme.dart';
import '../widgets/neko_background.dart';

class AnalysisScreen extends StatelessWidget {
  const AnalysisScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return NekoBackground(
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text('Análisis', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w600)),
            const SizedBox(height: 20),
            _card('Patrimonio neto', '\$ 14.235.128'),
            _card('Gasto por categoría', 'Top: Hogar, Comida, Transporte'),
            _card('Tendencia 6 meses', 'Gráfico — conectar SQLite NEKO'),
          ],
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