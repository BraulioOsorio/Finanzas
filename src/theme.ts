import { tokens } from './tokens';

export { tokens };

/** Alias de compatibilidad: usar `tokens` en pantallas nuevas. */
export const colors = {
  background: tokens.color.background,
  surface: tokens.color.surface,
  surfaceRaised: tokens.color.surfaceRaised,
  surfaceAlt: tokens.color.surfaceRaised,
  border: tokens.color.border,
  text: tokens.color.text,
  textMuted: tokens.color.textMuted,
  income: tokens.color.income,
  incomeMuted: '#0d3d32',
  expense: tokens.color.expense,
  expenseMuted: '#5c1a22',
  warn: tokens.color.warn,
  warnMuted: tokens.color.warnMuted,
  accent: tokens.color.accent,
  accentMuted: tokens.color.accentMuted,
  accentBorder: tokens.color.accentBorder,
  white: tokens.color.white,
};