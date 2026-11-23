import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/neko_theme.dart';

class SafeToSpendRing extends StatelessWidget {
  const SafeToSpendRing({
    super.key,
    required this.amount,
    required this.percent,
    this.currency = '\$',
  });

  final double amount;
  final double percent;
  final String currency;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 220,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CustomPaint(
            size: const Size(200, 200),
            painter: _RingPainter(percent.clamp(0, 1)),
          ),
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Disponible para gastar',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: NekoColors.textMuted,
                      fontSize: 14,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                '$currency${_formatMoney(amount)}',
                style: const TextStyle(
                  fontFamily: 'SpaceGrotesk',
                  fontSize: 36,
                  fontWeight: FontWeight.w600,
                  color: NekoColors.text,
                ),
              ),
              Text(
                '${(percent * 100).toStringAsFixed(0)}% del presupuesto',
                style: const TextStyle(
                  color: NekoColors.accent,
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _formatMoney(double v) {
    return v.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
      (m) => '${m[1]}.',
    );
  }
}

class _RingPainter extends CustomPainter {
  _RingPainter(this.fraction);
  final double fraction;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 12;
  final track = Paint()
      ..color = NekoColors.border
      ..style = PaintingStyle.stroke
      ..strokeWidth = 14
      ..strokeCap = StrokeCap.round;
    final progress = Paint()
      ..color = NekoColors.accent
      ..style = PaintingStyle.stroke
      ..strokeWidth = 14
      ..strokeCap = StrokeCap.round;
    canvas.drawCircle(center, radius, track);
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      2 * math.pi * fraction,
      false,
      progress,
    );
  }

  @override
  bool shouldRepaint(covariant _RingPainter old) => old.fraction != fraction;
}