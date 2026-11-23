import { StyleSheet, Text } from 'react-native';

import { colors } from '../../theme';

/** Encabezado de sección estilo NEKO (GENERAL, HERRAMIENTAS…). */
export function NekoSectionLabel({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'HankenGrotesk-Medium',
  },
});