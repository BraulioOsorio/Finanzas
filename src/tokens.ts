import { fontFamily } from './theme/typography';

/** Design tokens Finanzas (misma jerarquía que NEKO; acento morado #b57cff). */
export const tokens = {
  color: {
    background: '#0b1118',
    surface: '#151d28',
    surfaceRaised: '#1c2633',
    border: '#243041',
    text: '#f2f5fa',
    textMuted: '#8a9aad',
    /** Morado Finanzas (NEKO usa cian ~#5fd4ff; nosotros morado). */
    accent: '#b57cff',
    accentMuted: 'rgba(181, 124, 255, 0.22)',
    accentBorder: 'rgba(181, 124, 255, 0.45)',
    income: '#3dd9b4',
    expense: '#f07178',
    /** Día de calendario con sobregiro proyectado (NEKO usa amarillo/naranja). */
    warn: '#f5a623',
    warnMuted: 'rgba(245, 166, 35, 0.28)',
    transfer: '#94a3b8',
    white: '#ffffff',
  },
  radius: {
    sm: 10,
    md: 14,
    lg: 16,
    pill: 999,
  },
  space: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 20,
    xl: 24,
  },
  fontFamily,
  font: {
    title: { fontSize: 26, fontFamily: fontFamily.bold },
    section: { fontSize: 15, fontFamily: fontFamily.semibold },
    body: { fontSize: 16, fontFamily: fontFamily.medium },
    caption: { fontSize: 13, fontFamily: fontFamily.medium },
    money: { fontSize: 16, fontFamily: fontFamily.bold, letterSpacing: -0.25 },
    moneySmall: { fontSize: 14, fontFamily: fontFamily.bold },
    tab: { fontSize: 11, fontFamily: fontFamily.semibold },
  },
} as const;