import type { ComponentProps, ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme';

type IonName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  label: string;
  icon?: IonName;
  children?: ReactNode;
  value?: string;
  placeholder?: string;
};

/** Campo con etiqueta MAYÚSCULAS morada (formulario NEKO). */
export function NekoFormField({ label, icon, children, value, placeholder }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {icon ? <Ionicons name={icon} size={20} color={colors.textMuted} style={styles.icon} /> : null}
        {children ?? (
          <Text style={[styles.value, !value && styles.placeholder]} numberOfLines={2}>
            {value || placeholder || ''}
          </Text>
        )}
      </View>
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 12 },
  label: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    fontFamily: 'HankenGrotesk-Medium',
  },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 28, gap: 10 },
  icon: { width: 24 },
  value: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '600' },
  placeholder: { color: colors.textMuted, fontWeight: '500' },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginTop: 12,
  },
});