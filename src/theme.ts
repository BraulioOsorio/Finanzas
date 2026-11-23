export const colors = {
  background: '#0f1419',
  surface: '#1a2332',
  surfaceAlt: '#243044',
  border: '#2d3a4f',
  text: '#f4f7fb',
  textMuted: '#9aa8bc',
  income: '#22c55e',
  incomeMuted: '#14532d',
  expense: '#ef4444',
  expenseMuted: '#7f1d1d',
  accent: '#3b82f6',
  white: '#ffffff',
};

export const expenseCategories = [
  'Comida',
  'Transporte',
  'Hogar',
  'Salud',
  'Ocio',
  'Educación',
  'Otros',
] as const;

export const incomeCategories = [
  'Salario',
  'Freelance',
  'Inversiones',
  'Otros ingresos',
] as const;