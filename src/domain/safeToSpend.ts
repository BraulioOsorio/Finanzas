import { accountDefByName, isAccountLiquid } from './accounts/resolveAccounts';
import { daysInMonth } from './calendar';
import type { UpcomingItem } from './upcoming';
import type { AccountDef } from '../types';
import type { AccountBalance } from './summaries';

export type SafeToSpendHorizon = 'today' | 'month_end' | 'days_14';

export type SafeToSpendLine = {
  id: string;
  date: string;
  title: string;
  account: string;
  signedAmount: number;
  bucket: 'outflow' | 'inflow' | 'card_payment';
};

export type SafeToSpendSnapshot = {
  horizon: SafeToSpendHorizon;
  horizonLabel: string;
  throughDate: string;
  liquidNow: number;
  projectedInflows: number;
  projectedOutflows: number;
  safeToSpend: number;
  lines: SafeToSpendLine[];
  byLiquidAccount: { account: string; balance: number; afterPlanned: number }[];
};

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function horizonThroughDate(
  horizon: SafeToSpendHorizon,
  today = new Date().toISOString().slice(0, 10),
): string {
  if (horizon === 'today') {
    return today;
  }
  if (horizon === 'days_14') {
    return addDays(today, 14);
  }
  const monthKey = today.slice(0, 7);
  const last = daysInMonth(monthKey);
  return `${monthKey}-${String(last).padStart(2, '0')}`;
}

export function horizonLabel(horizon: SafeToSpendHorizon): string {
  switch (horizon) {
    case 'today':
      return 'Hoy';
    case 'month_end':
      return 'Fin de mes';
    case 'days_14':
      return '14 días';
  }
}

/** ¿Este evento compromete dinero líquido (banco/efectivo), estilo NEKO? */
export function upcomingAffectsLiquidPool(
  item: UpcomingItem,
  accounts: AccountDef[],
): boolean {
  if (item.kind === 'card_due' || item.kind === 'loan_due') {
    return true;
  }
  if (item.kind === 'card_close') {
    return false;
  }
  if (item.kind === 'plan' || item.kind === 'installment') {
    if (isAccountLiquid(accounts, item.account)) {
      return true;
    }
    const def = accountDefByName(accounts, item.account);
    if (def?.kind === 'credit' && item.kind === 'installment') {
      return false;
    }
    return def?.kind === 'loan';
  }
  return false;
}

export function computeSafeToSpend(
  horizon: SafeToSpendHorizon,
  accounts: AccountDef[],
  balances: AccountBalance[],
  upcoming: UpcomingItem[],
  today = new Date().toISOString().slice(0, 10),
): SafeToSpendSnapshot {
  const throughDate = horizonThroughDate(horizon, today);
  const liquidRows = balances.filter((b) => isAccountLiquid(accounts, b.account));
  const liquidNow = liquidRows.reduce((s, b) => s + b.balance, 0);

  let projectedInflows = 0;
  let projectedOutflows = 0;
  const lines: SafeToSpendLine[] = [];

  for (const item of upcoming) {
    if (item.date < today || item.date > throughDate) {
      continue;
    }
    if (!upcomingAffectsLiquidPool(item, accounts)) {
      continue;
    }
    const signed = item.signedAmount;
    if (signed > 0) {
      projectedInflows += signed;
      lines.push({
        id: item.id,
        date: item.date,
        title: item.title,
        account: item.account,
        signedAmount: signed,
        bucket: 'inflow',
      });
    } else if (signed < 0) {
      const magnitude = Math.abs(signed);
      projectedOutflows += magnitude;
      lines.push({
        id: item.id,
        date: item.date,
        title: item.title,
        account: item.account,
        signedAmount: signed,
        bucket: item.kind === 'card_due' ? 'card_payment' : 'outflow',
      });
    } else if (item.kind === 'card_due' || item.kind === 'loan_due') {
      lines.push({
        id: item.id,
        date: item.date,
        title: item.title,
        account: item.account,
        signedAmount: 0,
        bucket: item.kind === 'card_due' ? 'card_payment' : 'outflow',
      });
    }
  }

  lines.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));

  const netPlanned = projectedInflows - projectedOutflows;
  const safeToSpend = liquidNow + netPlanned;

  const outByAccount = new Map<string, number>();
  for (const line of lines) {
    if (line.signedAmount >= 0) {
      continue;
    }
    if (isAccountLiquid(accounts, line.account)) {
      outByAccount.set(
        line.account,
        (outByAccount.get(line.account) ?? 0) + Math.abs(line.signedAmount),
      );
    }
  }

  const cardPayTotal = lines
    .filter((l) => l.bucket === 'card_payment' && l.signedAmount < 0)
    .reduce((s, l) => s + Math.abs(l.signedAmount), 0);

  const byLiquidAccount = liquidRows.map((row) => {
    const direct = outByAccount.get(row.account) ?? 0;
    const share = liquidRows.length > 0 ? (cardPayTotal * row.balance) / Math.max(liquidNow, 1) : 0;
    const committed = direct + (cardPayTotal > 0 ? share : 0);
    return {
      account: row.account,
      balance: row.balance,
      afterPlanned: row.balance - committed + (lines.filter(
        (l) => l.account === row.account && l.signedAmount > 0,
      ).reduce((s, l) => s + l.signedAmount, 0)),
    };
  });

  return {
    horizon,
    horizonLabel: horizonLabel(horizon),
    throughDate,
    liquidNow,
    projectedInflows,
    projectedOutflows,
    safeToSpend,
    lines,
    byLiquidAccount,
  };
}