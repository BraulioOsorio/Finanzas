import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DEFAULT_INICIO_FILTERS,
  DEFAULT_PROXIMO_FILTERS,
  type InicioDashboardFilters,
  type InicioTxFilterKey,
  type ProximoFilters,
  type ProximoPeriod,
  type TriState,
} from '../domain/dashboardFilters';

const KEY = '@finanzas/dashboard_filters_v1';

type Stored = {
  inicio?: Partial<InicioDashboardFilters>;
  proximo?: Partial<ProximoFilters>;
};

const TX_KEYS = new Set<InicioTxFilterKey>([
  'todos',
  'ingresos',
  'pagos',
  'transfer_in',
  'transfer_out',
  'card_pay',
  'gastos',
  'cashback',
]);

function parsePeriod(value: unknown): ProximoPeriod {
  if (value === 'month' || value === 'year' || value === 'days_30' || value === 'days_90') {
    return value;
  }
  return DEFAULT_PROXIMO_FILTERS.period;
}

function parseTri(value: unknown): TriState {
  if (value === 'yes' || value === 'no' || value === 'all') {
    return value;
  }
  return 'all';
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((x): x is string => typeof x === 'string');
}

function parseProximo(raw: Partial<ProximoFilters> | undefined): ProximoFilters {
  if (!raw) {
    return { ...DEFAULT_PROXIMO_FILTERS };
  }
  const account = typeof raw.account === 'string' ? raw.account : '';
  const accounts = parseStringArray(raw.accounts);
  if (!accounts.length && account) {
    accounts.push(account);
  }
  const nekoTypes = parseStringArray(raw.nekoTypes);
  return {
    period: parsePeriod(raw.period),
    account,
    accounts,
    nekoTypes: nekoTypes.length ? nekoTypes : ['Todos'],
    categoryGroups: parseStringArray(raw.categoryGroups),
    categoryPairs: parseStringArray(raw.categoryPairs),
    recurrent: parseTri(raw.recurrent),
    autoPay: parseTri(raw.autoPay),
    includeInactiveAccounts: Boolean(raw.includeInactiveAccounts),
  };
}

export async function loadDashboardFilters(): Promise<{
  inicio: InicioDashboardFilters;
  proximo: ProximoFilters;
}> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) {
      return { inicio: { ...DEFAULT_INICIO_FILTERS }, proximo: { ...DEFAULT_PROXIMO_FILTERS } };
    }
    const parsed = JSON.parse(raw) as Stored;
    const disabledAccounts = Array.isArray(parsed.inicio?.disabledAccounts)
      ? parsed.inicio!.disabledAccounts!.filter((a): a is string => typeof a === 'string')
      : [];
    const txRaw = parsed.inicio?.txFilters;
    const txFilters = Array.isArray(txRaw)
      ? txRaw.filter((k): k is InicioTxFilterKey => typeof k === 'string' && TX_KEYS.has(k as InicioTxFilterKey))
      : [...DEFAULT_INICIO_FILTERS.txFilters];
    return {
      inicio: {
        disabledAccounts,
        txFilters: txFilters.length ? txFilters : ['todos'],
      },
      proximo: parseProximo(parsed.proximo),
    };
  } catch {
    return { inicio: { ...DEFAULT_INICIO_FILTERS }, proximo: { ...DEFAULT_PROXIMO_FILTERS } };
  }
}

export async function saveDashboardFilters(payload: {
  inicio: InicioDashboardFilters;
  proximo: ProximoFilters;
}): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(payload));
}