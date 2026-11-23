import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { SafeToSpendHorizon } from '../../domain/safeToSpend';
import { colors } from '../../theme';
import { NekoBottomSheet } from './NekoBottomSheet';

const OPTIONS: { label: string; horizon: SafeToSpendHorizon }[] = [
  { label: 'Hoy', horizon: 'today' },
  { label: 'Este mes', horizon: 'month_end' },
  { label: 'Antes del próximo ingreso', horizon: 'until_payday' },
  { label: 'Próximos 14 días', horizon: 'days_14' },
];

type Props = {
  visible: boolean;
  current: SafeToSpendHorizon;
  onClose: () => void;
  onPick: (h: SafeToSpendHorizon) => void;
};

export function NekoPeriodSheet({ visible, current, onClose, onPick }: Props) {
  return (
    <NekoBottomSheet visible={visible} title="Período" onClose={onClose}>
      <View style={styles.card}>
        {OPTIONS.map((opt, i) => (
          <Pressable
            key={opt.horizon}
            style={[styles.row, i < OPTIONS.length - 1 && styles.rowBorder]}
            onPress={() => {
              onPick(opt.horizon);
              onClose();
            }}
          >
            <Text style={styles.rowText}>{opt.label}</Text>
            {current === opt.horizon ? (
              <Ionicons name="checkmark" size={22} color={colors.accent} />
            ) : null}
          </Pressable>
        ))}
      </View>
    </NekoBottomSheet>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowText: { color: colors.text, fontSize: 16, fontWeight: '500' },
});