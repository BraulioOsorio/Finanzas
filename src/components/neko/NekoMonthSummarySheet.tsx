import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  buildMonthNekoReport,
  formatReportTotal,
  monthReportTitle,
  type MonthReportSection,
} from '../../domain/calendarMonthReport';
import type { Transaction } from '../../types';
import { colors, tokens } from '../../theme';
import { formatCurrencyFull } from '../../utils/format';
import { NekoBottomSheet } from './NekoBottomSheet';

type Props = {
  visible: boolean;
  monthKey: string;
  transactions: Transaction[];
  onClose: () => void;
};

function sectionIcon(section: MonthReportSection): keyof typeof Ionicons.glyphMap {
  switch (section.icon) {
    case 'income':
      return 'cash-outline';
    case 'transfer_in':
      return 'arrow-down-outline';
    case 'card':
      return 'card-outline';
    default:
      return 'bag-handle-outline';
  }
}

export function NekoMonthSummarySheet({ visible, monthKey, transactions, onClose }: Props) {
  const sections = buildMonthNekoReport(transactions, monthKey);

  return (
    <NekoBottomSheet visible={visible} title={monthReportTitle(monthKey)} onClose={onClose}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {sections.map((section) => (
          <View key={section.id} style={styles.section}>
            <View style={styles.sectionHead}>
              <Ionicons name={sectionIcon(section)} size={18} color={colors.textMuted} />
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text
                style={[
                  styles.sectionTotal,
                  section.signed === 'positive' ? styles.positive : styles.negative,
                ]}
              >
                {formatReportTotal(section)}
              </Text>
            </View>
            {section.lines.map((line) => (
              <View key={line.label} style={styles.line}>
                <Text style={styles.lineLabel} numberOfLines={1}>
                  {line.label}
                </Text>
                <Text style={styles.lineAmount}>{formatCurrencyFull(line.amount)}</Text>
              </View>
            ))}
          </View>
        ))}
        {!sections.length ? (
          <Text style={styles.empty}>Sin movimientos este mes.</Text>
        ) : null}
      </ScrollView>
    </NekoBottomSheet>
  );
}

const styles = StyleSheet.create({
  scroll: { maxHeight: 480, marginBottom: 8 },
  section: { marginBottom: 20, gap: 8 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'HankenGrotesk-Medium',
  },
  sectionTotal: { fontSize: 15, fontWeight: '700', fontFamily: 'HankenGrotesk-Medium' },
  positive: { color: colors.income },
  negative: { color: colors.text },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingLeft: 26,
  },
  lineLabel: { flex: 1, color: colors.textMuted, fontSize: 14 },
  lineAmount: { color: colors.text, fontSize: 14, fontWeight: '500' },
  empty: { color: colors.textMuted, textAlign: 'center', paddingVertical: 24 },
});