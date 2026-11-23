import 'package:flutter/material.dart';

class NekoBackground extends StatelessWidget {
  const NekoBackground({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        color: Color(0xFF0B0C10),
        image: DecorationImage(
          image: AssetImage('assets/apk/images/background_dark.png'),
          fit: BoxFit.cover,
          opacity: 0.32,
        ),
      ),
      child: child,
    );
  }
}