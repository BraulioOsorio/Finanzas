import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OverdraftAlertList } from '../components/OverdraftAlertList';
import { SafeToSpendDetailModal } from '../components/SafeToSpendDetailModal';
import { NekoBalanceStrip } from '../components/neko/NekoBalanceStrip';
import { NekoDashboardSectionHeader } from '../components/neko/NekoDashboardSectionHeader';
import { useRootNav } from '../navigation/useRootNav';
import { NekoInicioFiltersSheet } from '../components/neko/NekoInicioFiltersSheet';
import { NekoInicioSpendCard } from '../components/neko/NekoInicioSpendCard';
import { NekoMonthPeek } from '../components/neko/NekoMonthPeek';
import { NekoPeriodSheet } from '../components/neko/NekoPeriodSheet';
import { NekoScreenHeader } from '../components/neko/NekoScreenHeader';
import { NekoUpcomingSection } from '../components/neko/NekoUpcomingSection';
import { TAB_BAR_BOTTOM_INSET } from '../constants/layout';
import {
  filterBalancesByDashboard,
  filterUpcomingByDashboard,
  isAccountEnabledInDashboard,
  transactionPassesTxFilters,
} from '../domain/dashboardFilters';
import { horizonLabel } from '../domain/safeToSpend';
import { AccountEditorModal } from '../components/AccountEditorModal';
import { InstallmentPlanEditorModal } from '../components/InstallmentPlanEditorModal';
import { ScheduledPaymentEditorModal } from '../components/ScheduledPaymentEditorModal';
import { useDashboardFilters } from '../hooks/useDashboardFilters';
import { useNekoUpcomingPress } from '../hooks/useNekoUpcomingPress';
import type { InicioStackParamList } from '../navigation/inicioTypes';
import type { MainTabParamList } from '../navigation/tabTypes';
import { usePreferences } from '../context/PreferencesContext';
import { nekoSummaryToday } from '../domain/nekoDisplay';
import { computeSafeToSpend } from '../domain/safeToSpend';
import { useTransactions } from '../context/TransactionsContext';
import { colors } from '../theme';

type HomeNav = CompositeNavigationProp<
  NativeStackNavigationProp<InicioStackParamList, 'InicioHome'>,
  BottomTabNavigationProp<MainTabParamList>
>;

export function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const {
    loading,
    monthFlow,
    upcomingItems,
    overdraftAlerts,
    accounts,
    scheduledPayments,
    accountBalances,
    transactions,
    nekoSummary,
  } = useTransactions();
  const { safeToSpendHorizon, setSafeToSpendHorizon } = usePreferences();
  const { inicioFilters, setInicioFilters } = useDashboardFilters();
  const [detailOpen, setDetailOpen] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { openMas } = useRootNav();
  const upcomingPress = useNekoUpcomingPress();

  const filteredBalances = useMemo(
    () => filterBalancesByDashboard(accountBalances, inicioFilters),
    [accountBalances, inicioFilters],
  );

  const filteredUpcoming = useMemo(
    () => filterUpcomingByDashboard(upcomingItems, inicioFilters),
    [upcomingItems, inicioFilters],
  );

  const filteredTransactions = useMemo(
    () =>
      transactions.filter(
        (t) =>
          isAccountEnabledInDashboard(inicioFilters, t.account) &&
          transactionPassesTxFilters(t, inicioFilters),
      ),
    [transactions, inicioFilters],
  );

  const safeSnapshot = useMemo(
    () =>
      computeSafeToSpend(
        safeToSpendHorizon,
        accounts,
        filteredBalances,
        filteredUpcoming,
        undefined,
        scheduledPayments,
      ),
    [safeToSpendHorizon, accounts, filteredBalances, filteredUpcoming, scheduledPayments],
  );

  const periodLabel =
    safeToSpendHorizon === 'month_end' ? 'Este mes' : horizonLabel(safeToSpendHorizon);

  const spendSnapshot = useMemo(() => {
    if (!nekoSummary) {
      return safeSnapshot;
    }
    return { ...safeSnapshot, liquidNow: nekoSummary.liquidTotal };
  }, [safeSnapshot, nekoSummary]);

  const stripSummary = useMemo(
    () => nekoSummary ?? nekoSummaryToday(transactions, accounts),
    [nekoSummary, transactions, accounts],
  );

  const showLocalDataInfo = () => {
    Alert.alert(
      'Datos en el teléfono',
      'Tus movimientos y cuentas viven solo en este dispositivo. Exporta «Neko - My Data» desde NEKO para respaldo.',
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_BOTTOM_INSET + 56 }]}>
        <NekoScreenHeader
          title="Inicio"
          actions={[
            {
              icon: 'cloud-done-outline',
              accessibilityLabel: 'Datos en el teléfono',
              onPress: showLocalDataInfo,
            },
            {
              icon: 'menu-outline',
              accessibilityLabel: 'Más',
              onPress: () => openMas(),
            },
          ]}
        />

        <NekoBalanceStrip summary={stripSummary} dateLabel="hoy" />

        <NekoDashboardSectionHeader
          title="Disponible para gastar"
          onFilter={() => setFiltersOpen(true)}
        />
        <NekoInicioSpendCard
          snapshot={spendSnapshot}
          periodLabel={periodLabel}
          onOpenPeriod={() => setPeriodOpen(true)}
          onOpenDetail={() => setDetailOpen(true)}
          loading={loading}
        />

        <NekoMonthPeek
          monthKey={monthFlow.monthKey}
          monthFlow={monthFlow}
          transactions={filteredTransactions}
          accounts={accounts}
          scheduledPayments={scheduledPayments}
          upcomingItems={filteredUpcoming}
        />

        <NekoUpcomingSection
          items={filteredUpcoming}
          title="Próximo"
          accountBalances={accountBalances}
          onPressItem={upcomingPress.onPressItem}
          onOpenFull={() => navigation.navigate('Proximo')}
        />

        <OverdraftAlertList items={overdraftAlerts} />

        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 16 }} />
        ) : null}
      </ScrollView>

      <NekoPeriodSheet
        visible={periodOpen}
        current={safeToSpendHorizon}
        onClose={() => setPeriodOpen(false)}
        onPick={(h) => void setSafeToSpendHorizon(h)}
      />

      <NekoInicioFiltersSheet
        visible={filtersOpen}
        accounts={accounts}
        value={inicioFilters}
        onClose={() => setFiltersOpen(false)}
        onApply={(next) => void setInicioFilters(next)}
      />

      <SafeToSpendDetailModal
        visible={detailOpen}
        snapshot={safeSnapshot}
        onClose={() => setDetailOpen(false)}
      />

      <ScheduledPaymentEditorModal
        visible={upcomingPress.scheduledEdit !== null}
        payment={upcomingPress.scheduledEdit}
        onClose={() => upcomingPress.setScheduledEdit(null)}
      />
      <InstallmentPlanEditorModal
        visible={upcomingPress.installmentEdit !== null}
        plan={upcomingPress.installmentEdit}
        onClose={() => upcomingPress.setInstallmentEdit(null)}
      />
      <AccountEditorModal
        visible={upcomingPress.accountEdit !== null}
        editing={upcomingPress.accountEdit}
        onClose={() => upcomingPress.setAccountEdit(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 4, gap: 16 },
});