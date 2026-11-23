import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NekoBalanceStrip } from '../components/neko/NekoBalanceStrip';
import { NekoProximoFiltersSheet } from '../components/neko/NekoProximoFiltersSheet';
import { NekoProximoList } from '../components/neko/NekoProximoList';
import { NekoScreenHeader } from '../components/neko/NekoScreenHeader';
import {
  filterProximoList,
  filterUpcomingByDashboard,
  periodLabel,
} from '../domain/dashboardFilters';
import { buildUpcoming } from '../domain/upcoming';
import { useDashboardFilters } from '../hooks/useDashboardFilters';
import { useTransactions } from '../context/TransactionsContext';
import { TAB_BAR_BOTTOM_INSET } from '../constants/layout';
import { colors, tokens } from '../theme';
import { AccountEditorModal } from '../components/AccountEditorModal';
import { InstallmentPlanEditorModal } from '../components/InstallmentPlanEditorModal';
import { ScheduledPaymentEditorModal } from '../components/ScheduledPaymentEditorModal';
import { useNekoUpcomingPress } from '../hooks/useNekoUpcomingPress';
import { formatCurrencyFull } from '../utils/format';

export function ProximoScreen() {
  const navigation = useNavigation();
  const {
    accounts,
    transactions,
    scheduledPayments,
    installmentPlans,
    accountBalances,
    categoryTree,
    nekoSummary,
  } = useTransactions();
  const { inicioFilters, proximoFilters, setProximoFilters } = useDashboardFilters();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const upcomingPress = useNekoUpcomingPress();

  const allUpcoming = useMemo(
    () =>
      buildUpcoming(
        scheduledPayments,
        installmentPlans,
        accounts,
        transactions,
        new Date().toISOString().slice(0, 10),
        400,
      ),
    [scheduledPayments, installmentPlans, accounts, transactions],
  );

  const items = useMemo(() => {
    const byAccount = filterUpcomingByDashboard(allUpcoming, inicioFilters);
    return filterProximoList(byAccount, proximoFilters);
  }, [allUpcoming, inicioFilters, proximoFilters]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    let transfers = 0;
    for (const item of items) {
      const nt = item.nekoType?.trim().toLowerCase() ?? '';
      if (nt.includes('transferencia')) {
        transfers += Math.abs(item.signedAmount);
        continue;
      }
      if (item.signedAmount > 0) {
        income += item.signedAmount;
      } else if (item.signedAmount < 0) {
        expense += Math.abs(item.signedAmount);
      }
    }
    return { income, expense, transfers };
  }, [items]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerPad}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityLabel="Volver" style={styles.back}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <NekoScreenHeader
          title="Próximo"
          actions={[
            {
              icon: 'funnel-outline',
              accessibilityLabel: 'Filtros',
              onPress: () => setFiltersOpen(true),
            },
          ]}
        />
        {nekoSummary ? <NekoBalanceStrip summary={nekoSummary} /> : null}
      </View>

      <Pressable style={styles.filterBar} onPress={() => setFiltersOpen(true)}>
        <Ionicons name="calendar-outline" size={16} color={colors.accent} />
        <Text style={styles.filterPillText}>{periodLabel(proximoFilters.period)}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </Pressable>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_BOTTOM_INSET + 120 }]}
      >
        <NekoProximoList
          items={items}
          accountBalances={accountBalances}
          onPressItem={upcomingPress.onPressItem}
        />
      </ScrollView>

      <View style={styles.footer}>
        <FooterRow label="Ingreso" value={totals.income} positive />
        <FooterRow label="Egreso" value={totals.expense} />
        <FooterRow label="Total Transferencias" value={totals.transfers} muted />
      </View>

      <NekoProximoFiltersSheet
        visible={filtersOpen}
        accounts={accounts}
        transactions={transactions}
        categoryTree={categoryTree}
        value={proximoFilters}
        onClose={() => setFiltersOpen(false)}
        onApply={(next) => void setProximoFilters(next)}
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

function FooterRow({
  label,
  value,
  positive,
  muted,
}: {
  label: string;
  value: number;
  positive?: boolean;
  muted?: boolean;
}) {
  return (
    <View style={styles.footerRow}>
      <Text style={styles.footerLabel}>{label}</Text>
      <Text
        style={[
          styles.footerValue,
          positive && { color: colors.income },
          muted && value === 0 && { color: colors.textMuted },
        ]}
      >
        {formatCurrencyFull(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerPad: { paddingHorizontal: 16, paddingTop: 4, gap: 12 },
  back: { marginBottom: -4 },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterPillText: { color: colors.accent, fontWeight: '600', fontSize: 13 },
  content: { paddingHorizontal: 20, paddingTop: 4 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: TAB_BAR_BOTTOM_INSET,
    backgroundColor: colors.surfaceRaised,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 6,
  },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLabel: { color: colors.textMuted, fontSize: 14 },
  footerValue: { color: colors.text, fontSize: 15, fontWeight: '700', fontFamily: 'HankenGrotesk-Medium' },
});