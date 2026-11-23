import type { ScheduledPaymentDraft, Transaction } from '../types';

type Suggestion = ScheduledPaymentDraft & { reason: string };

const RECURRING_HINTS: { match: RegExp; frequency: ScheduledPaymentDraft['frequency']; kind: 'income' | 'expense' }[] = [
  { match: /pago quincenal/i, frequency: 'biweekly', kind: 'income' },
  { match: /netflix/i, frequency: 'monthly', kind: 'expense' },
  { match: /spotify/i, frequency: 'monthly', kind: 'expense' },
  { match: /youtube premium/i, frequency: 'monthly', kind: 'expense' },
  { match: /google one/i, frequency: 'monthly', kind: 'expense' },
  { match: /plan claro/i, frequency: 'monthly', kind: 'expense' },
  { match: /neko premium/i, frequency: 'monthly', kind: 'expense' },
  { match: /crunchyroll/i, frequency: 'monthly', kind: 'expense' },
];

function medianAmount(amounts: number[]): number {
  if (!amounts.length) {
    return 0;
  }
  const sorted = [...amounts].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

export function suggestRecurringFromTransactions(transactions: Transaction[]): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const existingTitles = new Set<string>();

  for (const hint of RECURRING_HINTS) {
    const matched = transactions.filter(
      (t) => t.kind !== 'transfer' && hint.match.test(t.description),
    );
    if (matched.length < 2) {
      continue;
    }
    const title = matched[0].description.trim() || hint.match.source;
    if (existingTitles.has(title.toLowerCase())) {
      continue;
    }
    existingTitles.add(title.toLowerCase());

    const sample = matched[0];
    const amount = medianAmount(matched.map((t) => t.amount));
    const startDate = [...matched].sort((a, b) => b.postedDate.localeCompare(a.postedDate))[0]
      .postedDate;

    suggestions.push({
      title,
      kind: hint.kind,
      amount,
      account: sample.account,
      nekoType: hint.kind === 'income' ? 'Ingreso' : 'Pago',
      categoryGroup:
        sample.categoryGroup ||
        (hint.kind === 'income' ? 'Ingreso Principal' : 'Hogar y Servicios'),
      category:
        sample.category || (hint.kind === 'income' ? 'Salario' : 'Suscripciones'),
      frequency: hint.frequency,
      startDate,
      active: true,
      reason: `${matched.length} apariciones en el historial`,
    });
  }

  return suggestions;
}