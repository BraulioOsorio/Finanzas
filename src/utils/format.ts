export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Con decimales, estilo NEKO ($1.789.000,00). */
export function formatCurrencyFull(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatShortDate(iso: string): string {
  const normalized = iso.length === 10 ? `${iso}T12:00:00` : iso;
  return new Intl.DateTimeFormat('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(normalized));
}

/** Título corto del mes en calendario / historial (Nov 2026). */
export function formatNekoMonthTitle(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  if (!year || !month) {
    return monthKey;
  }
  return new Date(year, month - 1, 1).toLocaleDateString('en', {
    month: 'short',
    year: 'numeric',
  });
}

/** Encabezado de día en Historial (sin hora: el CSV no trae hora). */
export function formatHistorySectionTitle(dayIso: string): string {
  const normalized = dayIso.length === 10 ? `${dayIso}T12:00:00` : dayIso;
  return new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(normalized));
}

export function formatTransactionTimestamp(postedDate: string, createdAt: string): string {
  const iso = createdAt?.length > 10 ? createdAt : `${postedDate}T12:00:00`;
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
  const time = new Intl.DateTimeFormat('es', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
  return `${day} a las ${time}`;
}

/** Cifra compacta para celdas del calendario (619.000). */
export function formatCalendarCellAmount(amount: number, mode: 'balance' | 'flow'): string {
  if (mode === 'flow') {
    if (amount === 0) {
      return '—';
    }
    const abs = Math.abs(amount);
    const compact = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(abs);
    return `${amount > 0 ? '+' : '−'}${compact}`;
  }
  if (amount === 0) {
    return '0';
  }
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(amount);
}