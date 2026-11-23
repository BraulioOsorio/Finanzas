export type TransactionKind = 'income' | 'expense' | 'transfer';

/** Compatibilidad con registros manuales antiguos */
export type TransactionType = 'income' | 'expense';

export type TransactionSource = 'manual' | 'neko';

/** Icono en listas de movimientos y plan */
export type IconDisplayMode = 'category' | 'description' | 'account';

/** Dónde vive el dinero (como en Neko: banco, efectivo, tarjeta, préstamo…). */
export type AccountKind = 'bank' | 'cash' | 'savings' | 'credit' | 'loan' | 'fintech';

export type AccountDef = {
  id: string;
  name: string;
  kind: AccountKind;
  /** Incluir en «Disponible para gastar» */
  liquid: boolean;
  notes: string;
  archived: boolean;
  /** Tarjeta de crédito (opcional) */
  creditLimit?: number;
  /** Día de cierre de extracto (1–28) */
  statementCloseDay?: number;
  /** Día límite de pago (1–28) */
  paymentDueDay?: number;
};

/** Presupuesto mensual por grupo o categoría Neko */
export type CategoryBudget = {
  id: string;
  categoryGroup: string;
  /** Vacío = todo el grupo */
  category: string;
  monthlyLimit: number;
  active: boolean;
};

export type CategoryBudgetDraft = Omit<CategoryBudget, 'id'>;

/** Compra a meses: cuotas proyectadas en calendario */
export type InstallmentPlan = {
  id: string;
  title: string;
  totalAmount: number;
  installmentCount: number;
  perInstallment: number;
  account: string;
  categoryGroup: string;
  category: string;
  startDate: string;
  active: boolean;
};

export type InstallmentPlanDraft = Omit<InstallmentPlan, 'id'>;

export type AccountDefDraft = Omit<AccountDef, 'id'>;

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

/** Actualización de un movimiento existente (id y createdAt no cambian). */
export type TransactionUpdate = Omit<TransactionDraft, 'source'> & {
  source?: TransactionSource;
};

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
  /** Historial tras la importación (para sugerencias de Plan, etc.) */
  transactionsAfter: Transaction[];
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