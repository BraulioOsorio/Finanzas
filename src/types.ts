export type TransactionKind = 'income' | 'expense' | 'transfer';

/** Compatibilidad con registros manuales antiguos */
export type TransactionType = 'income' | 'expense';

export type TransactionSource = 'manual' | 'neko';

export type Transaction = {
  id: string;
  kind: TransactionKind;
  /** Campo legado; coincide con kind salvo en transferencias */
  type: TransactionType;
  /** Magnitud positiva para ingresos/gastos */
  amount: number;
  /** Monto firmado del export (Neko) */
  signedAmount: number;
  postedDate: string;
  createdAt: string;
  nekoType: string;
  description: string;
  account: string;
  categoryGroup: string;
  category: string;
  notes: string;
  source: TransactionSource;
};

export type TransactionDraft = Omit<Transaction, 'id' | 'createdAt'>;

export type NekoCsvRow = {
  postedDate: string;
  transactionType: string;
  description: string;
  amount: number;
  account: string;
  categoryGroup: string;
  category: string;
  notes: string;
};

export type ImportResult = {
  imported: number;
  skipped: number;
  errors: string[];
};

export type ScheduleFrequency = 'once' | 'weekly' | 'biweekly' | 'monthly';

/** Pagos o ingresos programados (quincena, suscripciones, etc.) */
export type ScheduledPayment = {
  id: string;
  title: string;
  kind: 'income' | 'expense';
  amount: number;
  account: string;
  nekoType: string;
  categoryGroup: string;
  category: string;
  frequency: ScheduleFrequency;
  /** Primer día (o próxima fecha) YYYY-MM-DD */
  startDate: string;
  endDate?: string;
  active: boolean;
};

export type ScheduledPaymentDraft = Omit<ScheduledPayment, 'id'>;