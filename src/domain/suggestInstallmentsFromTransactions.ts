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

export function installmentFingerprint(
  title: string,
  account: string,
  purchaseDate: string,
): string {
  return `${normalizeTitle(title)}|${account.trim().toLowerCase()}|${purchaseDate}`;
}

function fingerprintFor(title: string, account: string, purchaseDate: string): string {
  return installmentFingerprint(title, account, purchaseDate);
}

function existingFingerprints(plans: InstallmentPlan[]): Set<string> {
  return new Set(
    plans.map((p) =>
      fingerprintFor(p.title, p.account, p.purchaseDate ?? p.startDate),
    ),
  );
}

export function hasInstallmentPlanForTransaction(
  plans: InstallmentPlan[],
  t: Transaction,
): boolean {
  const title = t.description.trim() || 'Compra a meses';
  const fp = fingerprintFor(title, t.account, t.postedDate);
  return existingFingerprints(plans).has(fp);
}

/** Un solo movimiento «Compra a meses» → borrador de plan (misma lógica que import masivo). */
export function buildInstallmentSuggestionFromTransaction(
  t: Transaction,
  accounts: AccountDef[],
): InstallmentSuggestion | null {
  if (!isCompraAMeses(t)) {
    return null;
  }

  const title = t.description.trim() || 'Compra a meses';
  const purchaseDate = t.postedDate;
  const fp = fingerprintFor(title, t.account, purchaseDate);

  const meta =
    t.installmentCountHint ??
    parseInstallmentCountFromText(t.installmentMeta ?? '') ??
    parseInstallmentCountFromText(t.notes) ??
    parseInstallmentCountFromText(t.description) ??
    parseInstallmentCountFromText(t.category);

  const totalAmount = Math.round(t.purchaseTotal ?? t.amount);
  const installmentCount = meta ?? guessInstallmentCount(totalAmount);
  const needsCuotaReview = meta == null;
  const initialPaidCount =
    t.installmentCurrent && t.installmentCurrent > 0 ? t.installmentCurrent - 1 : undefined;

  const def = accountDefByName(accounts, t.account);
  const onCredit = def?.kind === 'credit' && Boolean(def.statementCloseDay);
  const lag = def?.installmentStatementLagMonths ?? (onCredit ? 1 : 0);
  const ea = def?.installmentInterestEA ?? def?.interestRateEA ?? 0;
  const perInstallment = onCredit
    ? estimateInstallmentWithInterest(totalAmount, installmentCount, ea)
    : Math.round(totalAmount / installmentCount);

  const reason = t.installmentCountHint
    ? `CSV Finanzas: ${installmentCount} cuotas${t.installmentCurrent ? ` (va en ${t.installmentCurrent})` : ''}`
    : meta
      ? `Notas: ${installmentCount} cuotas`
      : `Sin dato de cuotas · estimamos ${installmentCount}`;

  return {
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
    cuotaSource: t.installmentCountHint ? 'csv_exact' : meta ? 'csv_inferred' : 'csv_inferred',
    initialPaidCount,
    reason,
    fingerprint: fp,
  };
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
    const purchaseDate = t.postedDate;
    if (purchaseDate < `${Number(today.slice(0, 4)) - 5}-01-01`) {
      continue;
    }

    const built = buildInstallmentSuggestionFromTransaction(t, accounts);
    if (!built) {
      continue;
    }
    if (fps.has(built.fingerprint) || seen.has(built.fingerprint)) {
      continue;
    }

    const bulkReason = built.needsCuotaReview
      ? `Neko puro sin cuotas · estimamos ${built.installmentCount} · confirma en Plan`
      : built.reason;
    suggestions.push({
      ...built,
      reason: built.needsCuotaReview ? bulkReason : built.reason,
    });
    seen.add(built.fingerprint);
  }

  return suggestions.slice(0, 40);
}