import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { DayCalendarBreakdown } from '../../../domain/calendarDayBalances';
import { colors, tokens } from '../../../theme';
import { formatCurrencyFull } from '../../../utils/format';

type Props = {
  date: string;
  breakdown: DayCalendarBreakdown;
  expanded: boolean;
  onToggle: () => void;
  /** Si el calendario filtra solo débito o crédito, la otra columna queda en 0 a propósito. */
  scopeFilter?: 'all' | 'debit' | 'credit';
};

export function NekoCalendarBalanceCard({
  date,
  breakdown,
  expanded,
  onToggle,
  scopeFilter = 'all',
}: Props) {
  const debitMuted = scopeFilter === 'credit';
  const creditMuted = scopeFilter === 'debit';
  const shortDate = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' }).format(
    new Date(`${date}T12:00:00`),
  );

  return (
    <View style={styles.card}>
      <Pressable style={styles.topRow} onPress={onToggle}>
        <View style={styles.col}>
          <Text style={styles.label}>Balance al</Text>
          <Text style={styles.dateValue}>{shortDate}</Text>
        </View>
        <View style={[styles.col, styles.colCenter]}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Cuentas</Text>
            {breakdown.liquidTotal < 0 ? (
              <Ionicons name="warning" size={12} color={colors.warn} />
            ) : null}
          </View>
          <Text
            style={[
              styles.liquid,
              breakdown.liquidTotal < 0 && { color: colors.warn },
              debitMuted && styles.mutedCol,
            ]}
          >
            {debitMuted ? '—' : formatCurrencyFull(breakdown.liquidTotal)}
          </Text>
        </View>
        <View style={[styles.col, styles.colEnd]}>
          <Text style={[styles.label, creditMuted && styles.mutedCol]} numberOfLines={2}>
            Tarjetas de crédito
          </Text>
          <Text style={[styles.credit, creditMuted && styles.mutedCol]}>
            {creditMuted ? '—' : formatCurrencyFull(breakdown.creditTotal)}
          </Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textMuted}
          style={styles.chev}
        />
      </Pressable>

      {expanded ? (
        <View style={styles.details}>
          {scopeFilter !== 'credit' ? (
            <DetailBlock
              title="Cuentas de débito"
              total={breakdown.liquidTotal}
              rows={breakdown.debitAccounts}
              icon="business-outline"
              totalColor={colors.accent}
            />
          ) : null}
          {scopeFilter !== 'debit' ? (
            <DetailBlock
              title="Tarjetas de crédito"
              total={breakdown.creditTotal}
              rows={breakdown.creditAccounts}
              icon="card-outline"
              totalColor="#f5a05c"
            />
          ) : null}
          {scopeFilter !== 'credit' && breakdown.loanAccounts.length ? (
            <DetailBlock
              title="Préstamos"
              total={breakdown.loanAccounts.reduce((s, r) => s + r.balance, 0)}
              rows={breakdown.loanAccounts}
              icon="document-text-outline"
              totalColor={colors.textMuted}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function DetailBlock({
  title,
  total,
  rows,
  icon,
  totalColor,
}: {
  title: string;
  total: number;
  rows: { name: string; balance: number; accountId?: string }[];
  icon: keyof typeof Ionicons.glyphMap;
  totalColor: string;
}) {
  return (
    <View style={styles.block}>
      <View style={styles.blockHead}>
        <Ionicons name={icon} size={18} color={colors.textMuted} />
        <Text style={styles.blockTitle}>{title}</Text>
        <Text style={[styles.blockTotal, { color: totalColor }]}>{formatCurrencyFull(total)}</Text>
      </View>
      {rows.map((r, index) => {
        const negative = r.balance < 0;
        const rowKey = r.accountId ?? `${r.name}-${index}`;
        return (
          <View key={rowKey} style={styles.subRow}>
            <Text style={styles.subName} numberOfLines={1}>
              {r.name}
            </Text>
            <View style={styles.subBalWrap}>
              {negative ? <Ionicons name="warning" size={12} color={colors.warn} /> : null}
              <Text style={[styles.subBal, negative && styles.subBalNeg]}>
                {formatCurrencyFull(r.balance)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  col: { flex: 1, gap: 2 },
  colCenter: { alignItems: 'center' },
  colEnd: { alignItems: 'flex-end' },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateValue: { color: colors.text, fontSize: 14, fontWeight: '700', fontFamily: 'HankenGrotesk-Medium' },
  liquid: { color: colors.accent, fontSize: 14, fontWeight: '700', fontFamily: 'HankenGrotesk-Medium' },
  credit: { color: '#f5a05c', fontSize: 13, fontWeight: '700', textAlign: 'right' },
  chev: { marginTop: 8, marginLeft: 2 },
  details: { gap: 14, paddingTop: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  block: { gap: 6 },
  blockHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  blockTitle: { flex: 1, color: colors.text, fontWeight: '700', fontSize: 14 },
  blockTotal: { fontWeight: '700', fontSize: 14 },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 26, gap: 8 },
  subName: { flex: 1, color: colors.textMuted, fontSize: 13 },
  subBalWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  subBal: { color: colors.textMuted, fontSize: 13 },
  subBalNeg: { color: colors.expense, fontFamily: 'HankenGrotesk-Bold' },
  mutedCol: { color: colors.textMuted, opacity: 0.45 },
});