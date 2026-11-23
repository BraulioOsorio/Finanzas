import { paymentDueForStatementClose, statementCloseContainingPurchase } from '../src/domain/credit/colombiaBilling';
import { installmentStatementCloseDates } from '../src/domain/credit/installmentBilling';
import type { AccountDef, InstallmentPlan } from '../src/types';

const rappi: AccountDef = {
  id: '1',
  name: 'RappiCard',
  kind: 'credit',
  liquid: false,
  notes: '',
  archived: false,
  statementCloseDay: 25,
  paymentDueDay: 10,
  paymentDueOffsetDays: 16,
  interestRateEA: 29.9,
  installmentInterestEA: 0,
};

const close = statementCloseContainingPurchase('2026-03-24', 25);
console.log('Compra 24-mar → corte en:', close);

const due = paymentDueForStatementClose(close, rappi);
console.log('Pago asociado:', due);

const plan: InstallmentPlan = {
  id: 'p1',
  title: 'Audífonos',
  totalAmount: 300000,
  installmentCount: 6,
  perInstallment: 50000,
  account: 'RappiCard',
  categoryGroup: '',
  category: '',
  startDate: '2026-03-24',
  purchaseDate: '2026-03-24',
  billingMode: 'card_statement',
  statementLagMonths: 1,
  active: true,
};

console.log('Cuotas en cortes:', installmentStatementCloseDates(plan, rappi));