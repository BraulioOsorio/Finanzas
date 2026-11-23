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
    const current = Number(frac[1]);
    const total = Number(frac[2]);
    if (total >= 2 && total <= 72) {
      return total;
    }
    if (current >= 2 && current <= 72) {
      return current;
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

/** Solo cuando Neko no dice nada: heurística por monto (no confiable en Nu, montos pequeños). */
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

/**
 * El export Neko trae una fila por compra: tipo, monto, fecha, cuenta.
 * No incluye cuotas totales, cuota actual ni pendientes (confirmado en CSV de usuario).
 */
export function suggestInstallmentsFromTransactions(
  transactions: Transaction[],
  accounts: AccountDef[],
  existingPlans: InstallmentPlan[] = [],
  today = new Date().toISOString().slice(0, 10),
): InstallmentSuggestion[] {
  const fps = existingFingerprints(existingPlans);
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

    if (purchaseDate < `${Number(today.slice(0, 4)) - 5}-01-01`) {
      continue;
    }

    const meta =
      parseInstallmentCountFromText(t.notes) ??
      parseInstallmentCountFromText(t.description) ??
      parseInstallmentCountFromText(t.category);

    const totalAmount = Math.round(t.amount);
    const installmentCount = meta ?? guessInstallmentCount(totalAmount);
    const needsCuotaReview = meta == null;

    const def = accountDefByName(accounts, t.account);
    const onCredit = def?.kind === 'credit' && Boolean(def.statementCloseDay);
    const lag = def?.installmentStatementLagMonths ?? (onCredit ? 1 : 0);
    const ea = def?.installmentInterestEA ?? def?.interestRateEA ?? 0;
    const perInstallment = onCredit
      ? estimateInstallmentWithInterest(totalAmount, installmentCount, ea)
      : Math.round(totalAmount / installmentCount);

    const reason = meta
      ? `CSV/notas: ${installmentCount} cuotas`
      : `Neko no indica cuotas (ej. Nu). Estimamos ${installmentCount} por monto · confirma en Plan`;

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
      needsCuotaReview,
      cuotaSource: 'csv_inferred',
      reason,
      fingerprint: fp,
    });
    seen.add(fp);
  }

  return suggestions.slice(0, 40);
}