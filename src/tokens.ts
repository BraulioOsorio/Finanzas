/** Design tokens Finanzas (nuestro sistema visual, inspirado en Neko). */
export const tokens = {
  color: {
    background: '#0a0e14',
    surface: '#151c28',
    surfaceRaised: '#1e2736',
    border: '#2a3548',
    text: '#f0f4fa',
    textMuted: '#8b9bb3',
    accent: '#b57cff',
    accentMuted: 'rgba(181, 124, 255, 0.14)',
    income: '#2dd4a8',
    expense: '#ff5c6d',
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
  font: {
    title: { fontSize: 26, fontWeight: '800' as const },
    section: { fontSize: 15, fontWeight: '700' as const },
    body: { fontSize: 16, fontWeight: '600' as const },
    caption: { fontSize: 13, fontWeight: '600' as const },
  },
} as const;