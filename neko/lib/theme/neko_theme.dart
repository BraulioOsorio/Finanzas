import 'package:flutter/material.dart';

/// Colores NEKO 8.8.2 (APK + capturas).
abstract final class NekoColors {
  static const accent = Color(0xFF5CE1E6);
  static const background = Color(0xFF0B0C10);
  static const surface = Color(0xFF16171D);
  static const border = Color(0xFF2A2D35);
  static const text = Color(0xFFF4F4F5);
  static const textMuted = Color(0xFF9CA3AF);
  static const expense = Color(0xFFFF6B6B);
  static const income = Color(0xFF4ADE80);
}

ThemeData buildNekoTheme() {
  const font = 'HankenGrotesk';
  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: NekoColors.background,
    colorScheme: const ColorScheme.dark(
      primary: NekoColors.accent,
      surface: NekoColors.surface,
      onSurface: NekoColors.text,
    ),
    fontFamily: font,
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: NekoColors.surface,
      indicatorColor: NekoColors.accent.withValues(alpha: 0.18),
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return TextStyle(
          fontFamily: font,
          fontSize: 11,
          fontWeight: FontWeight.w500,
          color: selected ? NekoColors.accent : NekoColors.textMuted,
        );
      }),
      iconTheme: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return IconThemeData(
          color: selected ? NekoColors.accent : NekoColors.textMuted,
          size: 24,
        );
      }),
    ),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: NekoColors.accent,
      foregroundColor: NekoColors.background,
      elevation: 6,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.transparent,
      elevation: 0,
      titleTextStyle: TextStyle(
        fontFamily: font,
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: NekoColors.text,
      ),
    ),
  );
}