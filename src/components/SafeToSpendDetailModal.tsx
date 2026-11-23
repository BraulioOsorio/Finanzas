import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { SafeToSpendSnapshot } from '../domain/safeToSpend';
import { colors } from '../theme';
import { formatCurrency, formatShortDate } from '../utils/format';

type Props = {
  visible: boolean;
  snapshot: SafeToSpendSnapshot;
  onClose: () => void;
};

export function SafeToSpendDetailModal({ visible, snapshot, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Desglose disponible</Text>
          <Text style={styles.meta}>
            {snapshot.horizonLabel} · hasta {formatShortDate(snapshot.throughDate)}
          </Text>
          <Text style={styles.hero}>{formatCurrency(snapshot.safeToSpend)}</Text>

          <Row label="Líquido hoy" value={formatCurrency(snapshot.liquidNow)} />
          <Row label="Entra (Plan)" value={`+${formatCurrency(snapshot.projectedInflows)}`} positive />
          <Row label="Comprometido" value={`−${formatCurrency(snapshot.projectedOutflows)}`} negative />

          <Text style={styles.section}>Cuentas líquidas</Text>
          {snapshot.byLiquidAccount.map((a, index) => (
            <View key={`${a.account}-${index}`} style={styles.accountRow}>
              <Text style={styles.accountName}>{a.account}</Text>
              <Text style={styles.accountVal}>
                {formatCurrency(a.balance)} → {formatCurrency(a.afterPlanned)}
              </Text>
            </View>
          ))}

          <Text style={styles.section}>Compromisos</Text>
          <ScrollView style={styles.scroll}>
            {snapshot.lines.length === 0 ? (
              <Text style={styles.empty}>Nada programado en este horizonte.</Text>
            ) : (
              snapshot.lines.map((line) => (
                <Text key={line.id} style={styles.line}>
                  {formatShortDate(line.date)} · {line.title} ({line.account})
                  {line.signedAmount !== 0
                    ? ` · ${line.signedAmount > 0 ? '+' : '−'}${formatCurrency(Math.abs(line.signedAmount))}`
                    : ''}
                </Text>
              ))
            )}
          </ScrollView>

          <Pressable style={styles.btn} onPress={onClose}>
            <Text style={styles.btnText}>Cerrar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Row({
  label,
  value,
  positive,
  negative,
}: {
  label: string;
  value: string;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, positive && styles.pos, negative && styles.neg]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
    gap: 8,
  },
  title: { color: colors.text, fontSize: 20, fontWeight: '700', fontFamily: 'HankenGrotesk-Regular' },
  meta: { color: colors.textMuted, fontSize: 12 },
  hero: { color: colors.text, fontSize: 32, fontWeight: '700', fontFamily: 'HankenGrotesk-Regular', marginVertical: 4 },
  section: { color: colors.text, fontSize: 14, fontWeight: '700', marginTop: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { color: colors.textMuted, fontSize: 13 },
  rowValue: { color: colors.text, fontSize: 13, fontWeight: '700' },
  pos: { color: colors.income },
  neg: { color: colors.expense },
  accountRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  accountName: { color: colors.text, fontSize: 12, flex: 1 },
  accountVal: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  scroll: { maxHeight: 160 },
  line: { color: colors.text, fontSize: 11, marginBottom: 6, lineHeight: 15 },
  empty: { color: colors.textMuted, fontSize: 12 },
  btn: {
    marginTop: 12,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: { color: colors.white, fontWeight: '700', fontFamily: 'HankenGrotesk-Regular' },
});