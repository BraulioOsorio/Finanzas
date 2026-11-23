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
  /** Días de gracia tras el corte hasta el pago (alternativa al día fijo; habitual en CO) */
  paymentDueOffsetDays?: number;
  /** Tasa EA % sobre saldo rotativo (compra corriente) */
  interestRateEA?: number;
  /** Tasa EA % en compras a cuotas (0 si promoción sin interés) */
  installmentInterestEA?: number;
  /** % mínimo de pago sobre extracto (orientativo) */
  minimumPaymentPercent?: number;
  /** Meses hasta la 1.ª cuota en extracto (RappiCard 1; algunos 0) */
  installmentStatementLagMonths?: number;
  /** Monto original del préstamo / deuda (para barra de amortización) */
  loanPrincipal?: number;
  /** Tasa nominal anual % sobre saldo deudor (capital vs interés en amortización) */
  loanInterestRateNA?: number;
  /** Día del mes recordatorio de abono (1–28) */
  loanPaymentDay?: number;
  /** Tipo de cuenta en NEKO (`tbl_account.account_type_id`) para calendario / import. */
  nekoAccountTypeId?: number;
  /** Apertura reconciliada con `tbl_account.balance` al importar SQLite. */
  nekoOpeningBalance?: number;
  /** `tbl_account._id` (misma clave que `Transaction.nekoAccountId`). */
  nekoSqliteId?: string;
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
  /** Fecha de compra (p. ej. primer cargo) */
  purchaseDate?: string;
  /** calendar = día fijo; card_statement = en cada corte de tarjeta */
  billingMode?: 'calendar' | 'card_statement';
  /** Meses hasta la 1.ª cuota en extracto (1 = extracto siguiente a la compra) */
  statementLagMonths?: number;
  active: boolean;
  /** El CSV de Neko no trae # de cuotas; hay que confirmar en Plan */
  needsCuotaReview?: boolean;
  cuotaSource?: 'manual' | 'csv_inferred' | 'csv_exact';
  /** Cuotas ya pagadas al importar (p. ej. columna Installment Current) */
  initialPaidCount?: number;
};

export type InstallmentPlanUpdate = Partial<
  Pick<
    InstallmentPlan,
    | 'title'
    | 'installmentCount'
    | 'totalAmount'
    | 'perInstallment'
    | 'active'
    | 'needsCuotaReview'
  >
>;

export type InstallmentPlanDraft = Omit<InstallmentPlan, 'id'>;

export type AccountDefDraft = Omit<AccountDef, 'id'> & {
  /** Solo durante import SQLite (luego se deriva `nekoOpeningBalance`). */
  nekoStoredBalance?: number;
  nekoSqliteId?: string;
};

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
  /** `tbl_account._id` cuando el movimiento viene del SQLite NEKO. */
  nekoAccountId?: string;
  categoryGroup: string;
  category: string;
  notes: string;
  source: TransactionSource;
  /** CSV extendido Finanzas: cuota actual/total en una celda (ej. 3/12) */
  installmentMeta?: string;
  purchaseTotal?: number;
  installmentCurrent?: number;
  installmentCountHint?: number;
};

export type TransactionDraft = Omit<Transaction, 'id' | 'createdAt'>;

/** Actualización de un movimiento existente (id y createdAt no cambian). */
export type TransactionUpdate = Omit<TransactionDraft, 'source'> & {
  source?: TransactionSource;
  createdAt?: string;
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
  installmentMeta?: string;
  purchaseTotal?: number;
  installmentCurrent?: number;
  installmentCountHint?: number;
};

export type ImportResult = {
  imported: number;
  skipped: number;
  errors: string[];
  /** Historial tras la importación (para sugerencias de Plan, etc.) */
  transactionsAfter: Transaction[];
};

export type NekoSqliteImportResult = ImportResult & {
  stats: {
    postedRows: number;
    transactionLines: number;
    accounts: number;
    installmentPlans: number;
    recurring: number;
  };
  accountsSaved: number;
  plansSaved: number;
  recurringSaved: number;
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
export type ScheduledPaymentUpdate = Partial<ScheduledPaymentDraft>;