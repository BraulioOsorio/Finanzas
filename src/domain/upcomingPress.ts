import type { UpcomingItem } from './upcoming';

export type UpcomingPressAction =
  | { type: 'edit_scheduled'; scheduledId: string }
  | { type: 'edit_installment'; planId: string }
  | {
      type: 'add_payment';
      nekoType: string;
      account: string;
      amount?: number;
      postedDate: string;
    }
  | { type: 'edit_account'; accountName: string }
  | { type: 'none' };

function stripDateSuffix(id: string, dayIso: string): string | null {
  const suffix = `-${dayIso}`;
  if (!id.endsWith(suffix)) {
    return null;
  }
  return id.slice(0, -suffix.length);
}

/** Qué hacer al tocar un ítem de Próximo (plan, cuota, TC, préstamo). */
export function resolveUpcomingPressAction(item: UpcomingItem): UpcomingPressAction {
  const day = item.date.slice(0, 10);

  if (item.kind === 'plan') {
    const scheduledId = stripDateSuffix(item.id, day);
    if (scheduledId) {
      return { type: 'edit_scheduled', scheduledId };
    }
  }

  if (item.kind === 'installment' && item.id.startsWith('ins-')) {
    const planId = stripDateSuffix(item.id.slice(4), day);
    if (planId) {
      return { type: 'edit_installment', planId };
    }
  }

  if (item.kind === 'card_due') {
    return {
      type: 'add_payment',
      nekoType: 'Pago de Tarjeta',
      account: item.account,
      amount: item.signedAmount ? Math.abs(item.signedAmount) : undefined,
      postedDate: day,
    };
  }

  if (item.kind === 'loan_due') {
    return {
      type: 'add_payment',
      nekoType: 'Pago de Préstamo',
      account: item.account,
      amount: item.signedAmount ? Math.abs(item.signedAmount) : undefined,
      postedDate: day,
    };
  }

  if (item.kind === 'card_close') {
    return { type: 'edit_account', accountName: item.account };
  }

  return { type: 'none' };
}