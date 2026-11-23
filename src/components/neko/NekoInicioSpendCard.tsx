import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { SafeToSpendSnapshot } from '../../domain/safeToSpend';
import { NekoEntrance } from './NekoEntrance';
import { NekoSpendRing } from './NekoSpendRing';
import { colors, tokens } from '../../theme';
import { formatCurrencyFull } from '../../utils/format';

type Props = {
  snapshot: SafeToSpendSnapshot;
  periodLabel: string;
  onOpenPeriod: () => void;
  onOpenDetail?: () => void;
  loading?: boolean;
};

/** Tarjeta «Disponible para gastar» al estilo NEKO Inicio (morado). */
export function NekoInicioSpendCard({
  snapshot,
  periodLabel,
  onOpenPeriod,
  onOpenDetail,
  loading,
}: Props) {
  const gastoProyectado = snapshot.nekoGastoProyectado ?? snapshot.projectedOutflows;
  /** NEKO: balance proyectado = líquido + ingresos planeados − gasto proyectado (sin pagos TC). */
  const projectedBalance =
    snapshot.liquidNow + snapshot.projectedInflows - gastoProyectado;
  const spentRatio =
    projectedBalance > 0
      ? Math.min(1, Math.max(0, 1 - snapshot.safeToSpend / projectedBalance))
      : 0;

  return (
    <NekoEntrance>
    <View style={styles.card}>
      <View style={styles.bodyRow}>
        <View style={styles.metrics}>
          <Metric label="Balance Actual" value={snapshot.liquidNow} loading={loading} />
          <Metric label="Balance Proyectado" value={projectedBalance} loading={loading} />
          <Metric label="Gasto Proyectado" value={gastoProyectado} loading={loading} />
        </View>
        <Pressable style={styles.ringWrap} onPress={onOpenDetail} disabled={!onOpenDetail}>
          <NekoSpendRing
            value={snapshot.safeToSpend}
            spentRatio={spentRatio}
            loading={loading}
          />
        </Pressable>
      </View>

      <Pressable style={styles.periodPill} onPress={onOpenPeriod}>
        <Text style={styles.periodPillText}>{periodLabel}</Text>
      </Pressable>
    </View>
    </NekoEntrance>
  );
}

function Metric({
  label,
  value,
  loading,
}: {
  label: string;
  value: number;
  loading?: boolean;
}) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{loading ? '…' : formatCurrencyFull(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    paddingVertical: 18,
  },
  bodyRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  metrics: { flex: 1, gap: 12 },
  metric: { gap: 3 },
  metricLabel: {
    ...tokens.font.caption,
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 0.15,
  },
  metricValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'HankenGrotesk-Medium',
    letterSpacing: -0.25,
  },
  ringWrap: { width: 132, alignItems: 'center' },
  periodPill: {
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  periodPillText: { color: colors.accent, fontWeight: '700', fontSize: 13 },
});