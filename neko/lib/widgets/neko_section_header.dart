import 'package:flutter/material.dart';

import '../theme/neko_theme.dart';

class NekoSectionHeader extends StatelessWidget {
  const NekoSectionHeader({super.key, required this.title, this.trailing});

  final String title;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 12, 4),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: NekoColors.text,
              ),
            ),
          ),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}