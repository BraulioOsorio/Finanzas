import { accountDefByName } from './accounts/resolveAccounts';
import { estimateInstallmentWithInterest } from './credit/colombiaBilling';
import type { AccountDef, InstallmentPlan, InstallmentPlanDraft, Transaction } from '../types';

export type InstallmentSuggestion = InstallmentPlanDraft & {
  reason: string;
  fingerprint: string;
};

function normalizeTitle(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function parseInstallmentCountFromText(text: string): number | null {
  const blob = text.trim();
  if (!blob) {
    return null;
  }
  const frac = blob.match(/(\d+)\s*\/\s*(\d+)/);
  if (frac) {
    const total = Number(frac[2]);
    if (total >= 2 && total <= 72) {
      return total;
    }
  }
  const cuotas = blob.match(/(\d+)\s*cuotas?\b/i);
  if (cuotas) {
    const n = Number(cuotas[1]);
    if (n >= 2 && n <= 72) {
      return n;
    }
  }
  const xn = blob.match(/\bx\s*(\d+)\b/i);
  if (xn) {
    const n = Number(xn[1]);
    if (n >= 2 && n <= 72) {
      return n;
    }
  }
  return null;
}

function guessInstallmentCount(totalAmount: number): number {
  if (totalAmount >= 3_000_000) {
    return 36;
  }
  if (totalAmount >= 1_500_000) {
    return 24;
  }
  if (totalAmount >= 500_000) {
    return 12;
  }
  if (totalAmount >= 150_000) {
    return 6;
  }
  return 3;
}

function isCompraAMeses(t: Transaction): boolean {
  return t.nekoType.trim() === 'Compra a meses' && t.kind === 'expense';
}

function fingerprintFor(title: string, account: string, purchaseDate: string): string {
  return `${normalizeTitle(title)}|${account.trim().toLowerCase()}|${purchaseDate}`;
}

function existingFingerprints(plans: InstallmentPlan[]): Set<string> {
  return new Set(
    plans.map((p) =>
      fingerprintFor(p.title, p.account, p.purchaseDate ?? p.startDate),
    ),
  );
}

/** Si el mismo concepto aparece mes a mes, infiere cuotas observadas. */
function observeRepeatCounts(transactions: Transaction[]): Map<string, number> {
  const map = new Map<string, { dates: string[]; amounts: number[] }>();
  for (const t of transactions) {
    if (!isCompraAMeses(t)) {
      continue;
    }
    const key = `${t.account.trim().toLowerCase()}|${normalizeTitle(t.description)}`;
    const row = map.get(key) ?? { dates: [], amounts: [] };
    row.dates.push(t.postedDate);
    row.amounts.push(t.amount);
    map.set(key, row);
  }

  const counts = new Map<string, number>();
  for (const [key, row] of map) {
    if (row.dates.length < 2) {
      continue;
    }
    const uniqueMonths = new Set(row.dates.map((d) => d.slice(0, 7)));
    if (uniqueMonths.size >= 2) {
      counts.set(key, row.dates.length);
    }
  }
  return counts;
}

export function suggestInstallmentsFromTransactions(
  transactions: Transaction[],
  accounts: AccountDef[],
  existingPlans: InstallmentPlan[] = [],
  today = new Date().toISOString().slice(0, 10),
): InstallmentSuggestion[] {
  const fps = existingFingerprints(existingPlans);
  const repeats = observeRepeatCounts(transactions);
  const suggestions: InstallmentSuggestion[] = [];
  const seen = new Set<string>();

  const compras = transactions
    .filter(isCompraAMeses)
    .sort((a, b) => b.postedDate.localeCompare(a.postedDate));

  for (const t of compras) {
    const title = t.description.trim() || 'Compra a meses';
    const purchaseDate = t.postedDate;
    const fp = fingerprintFor(title, t.account, purchaseDate);
    if (fps.has(fp) || seen.has(fp)) {
      continue;
    }

    // Ignorar compras muy antiguas sin cuotas pendientes plausibles ( > 5 años )
    if (purchaseDate < `${Number(today.slice(0, 4)) - 5}-01-01`) {
      continue;
    }

    const meta =
      parseInstallmentCountFromText(t.notes) ??
      parseInstallmentCountFromText(t.description) ??
      parseInstallmentCountFromText(t.category);

    const repeatKey = `${t.account.trim().toLowerCase()}|${normalizeTitle(t.description)}`;
    const observed = repeats.get(repeatKey);

    const totalAmount = Math.round(t.amount);
    let installmentCount =
      meta ?? (observed && observed >= 2 ? Math.max(observed + 6, 12) : null) ?? guessInstallmentCount(totalAmount);

    if (observed && observed > installmentCount) {
      installmentCount = observed;
    }

    const def = accountDefByName(accounts, t.account);
    const onCredit = def?.kind === 'credit' && Boolean(def.statementCloseDay);
    const lag = def?.installmentStatementLagMonths ?? (onCredit ? 1 : 0);
    const ea = def?.installmentInterestEA ?? def?.interestRateEA ?? 0;
    const perInstallment = onCredit
      ? estimateInstallmentWithInterest(totalAmount, installmentCount, ea)
      : Math.round(totalAmount / installmentCount);

    const reason = meta
      ? `Notas/descr. indican ${installmentCount} cuotas`
      : observed
        ? `Vimos ${observed} cargos similares en el CSV`
        : `Total ${totalAmount.toLocaleString('es-CO')} → ~${installmentCount} cuotas (estimado)`;

    suggestions.push({
      title,
      totalAmount,
      installmentCount,
      perInstallment,
      account: t.account.trim(),
      categoryGroup: t.categoryGroup,
      category: t.category,
      startDate: purchaseDate,
      purchaseDate,
      billingMode: onCredit ? 'card_statement' : 'calendar',
      statementLagMonths: lag,
      active: true,
      reason,
      fingerprint: fp,
    });
    seen.add(fp);
  }

  return suggestions.slice(0, 40);
}