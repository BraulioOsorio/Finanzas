import { loanPaymentDatesInRange, typicalLoanPaymentAmount } from './debts/loanLedger';
import { paymentDueForStatementClose } from './credit/colombiaBilling';
import {
  installmentsInRange,
  installmentTitle,
  resolveInstallmentAccount,
  signedAmountForInstallment,
} from './installments';
import { allCardOutlooks } from './credit/statementProjection';
import { occurrencesInRange, signedAmountForScheduled } from './scheduleProjection';
import type { AccountDef, InstallmentPlan, ScheduledPayment, Transaction } from '../types';

export type UpcomingItem = {
  id: string;
  date: string;
  title: string;
  signedAmount: number;
  account: string;
  kind: 'plan' | 'installment' | 'card_due' | 'card_close' | 'loan_due';
  subtitle?: string;
};

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Próximos eventos en ventana (hoy … hoy+daysAhead). */
export function buildUpcoming(
  scheduled: ScheduledPayment[],
  installments: InstallmentPlan[],
  accounts: AccountDef[],
  transactions: Transaction[] = [],
  today = new Date().toISOString().slice(0, 10),
  daysAhead = 14,
): UpcomingItem[] {
  const rangeEnd = addDays(today, daysAhead);
  const out: UpcomingItem[] = [];

  for (const item of scheduled) {
    const dates = occurrencesInRange(item, today, rangeEnd);
    const signed = signedAmountForScheduled(item);
    for (const date of dates) {
      out.push({
        id: `sch-${item.id}-${date}`,
        date,
        title: item.title,
        signedAmount: signed,
        account: item.account,
        kind: 'plan',
      });
    }
  }

  for (const plan of installments) {
    if (!plan.active) {
      continue;
    }
    const acc = resolveInstallmentAccount(plan, accounts);
    const hits = installmentsInRange(plan, today, rangeEnd, acc);
    const signed = signedAmountForInstallment(plan, acc);
    for (const { date, index } of hits) {
      out.push({
        id: `ins-${plan.id}-${date}`,
        date,
        title: installmentTitle(plan, index, acc),
        signedAmount: signed,
        account: plan.account,
        kind: 'installment',
        subtitle: acc?.statementCloseDay ? 'Cuota en extracto' : undefined,
      });
    }
  }

  for (const outlook of allCardOutlooks(accounts, transactions, installments, today)) {
    if (outlook.nextClose >= today && outlook.nextClose <= rangeEnd) {
      out.push({
        id: `close-${outlook.account}-${outlook.nextClose}`,
        date: outlook.nextClose,
        title: `Corte de extracto · ${outlook.account}`,
        signedAmount: -outlook.estimatedStatement,
        account: outlook.account,
        kind: 'card_close',
        subtitle: `Compras periodo ~${outlook.purchasesInPeriod.toLocaleString('es-CO')} COP`,
      });
    }

    if (outlook.nextDue && outlook.nextDue >= today && outlook.nextDue <= rangeEnd) {
      const min = outlook.estimatedMinimum;
      const payFull = outlook.payInFullToZeroInterest;
      const useFull = payFull > 0 ? payFull : min;
      const intHint =
        outlook.estimatedInterestIfUnpaid > 0
          ? ` · interés si dejas saldo ~${outlook.estimatedInterestIfUnpaid.toLocaleString('es-CO')}`
          : '';
      const bizHint = outlook.dueOnBusinessDay ? ' · fecha en día hábil' : '';
      out.push({
        id: `due-${outlook.account}-${outlook.nextDue}`,
        date: outlook.nextDue,
        title: `Pago tarjeta · ${outlook.account}`,
        signedAmount: -useFull,
        account: outlook.account,
        kind: 'card_due',
        subtitle: `Paga extracto ~${payFull.toLocaleString('es-CO')} COP · mínimo ~${min.toLocaleString('es-CO')}${intHint}${bizHint}`,
      });
    }
  }

  for (const acc of accounts) {
    if (acc.archived || !acc.loanPaymentDay) {
      continue;
    }
    const loanAccount =
      acc.kind === 'loan' || /deuda|préstamo|prestamo/i.test(acc.name);
    if (!loanAccount) {
      continue;
    }
    const dates = loanPaymentDatesInRange(today, rangeEnd, acc.loanPaymentDay);
    const typical = typicalLoanPaymentAmount(transactions, acc.name);
    for (const date of dates) {
      out.push({
        id: `loan-${acc.id}-${date}`,
        date,
        title: `Abono préstamo · ${acc.name}`,
        signedAmount: typical > 0 ? -typical : 0,
        account: acc.name,
        kind: 'loan_due',
        subtitle:
          typical > 0
            ? `Últimos abonos ~${typical.toLocaleString('es-CO')} COP`
            : 'Configura el día en Cuentas → editar préstamo',
      });
    }
  }

  // Tarjetas sin periodo calculable pero con día de pago fijo
  for (const acc of accounts) {
    if (acc.archived || acc.kind !== 'credit' || acc.statementCloseDay) {
      continue;
    }
    if (!acc.paymentDueDay) {
      continue;
    }
    const due = legacyNextDue(today, acc.paymentDueDay);
    if (due >= today && due <= rangeEnd) {
      const already = out.some((x) => x.kind === 'card_due' && x.account === acc.name && x.date === due);
      if (!already) {
        out.push({
          id: `card-${acc.id}-${due}`,
          date: due,
          title: `Pago tarjeta · ${acc.name}`,
          signedAmount: 0,
          account: acc.name,
          kind: 'card_due',
          subtitle: 'Configura corte y EA en Cuentas para estimar el monto',
        });
      }
    }
  }

  return out.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}

function legacyNextDue(fromIso: string, dueDay: number): string {
  const d = new Date(`${fromIso}T12:00:00`);
  const year = d.getFullYear();
  const month = d.getMonth();
  let candidate = new Date(year, month, Math.min(dueDay, 28));
  if (candidate.toISOString().slice(0, 10) < fromIso) {
    candidate = new Date(year, month + 1, Math.min(dueDay, 28));
  }
  return candidate.toISOString().slice(0, 10);
}

export function nextDueForAccount(acc: AccountDef, closeIso: string): string | undefined {
  return paymentDueForStatementClose(closeIso, acc);
}