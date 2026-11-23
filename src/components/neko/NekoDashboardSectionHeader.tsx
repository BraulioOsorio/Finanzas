import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, tokens } from '../../theme';

type Props = {
  title: string;
  onFilter?: () => void;
  filterLabel?: string;
  rightIcon?: ComponentProps<typeof Ionicons>['name'];
};

/** Fila de sección sobre la tarjeta (título + embudo), estilo NEKO Inicio. */
export function NekoDashboardSectionHeader({
  title,
  onFilter,
  filterLabel = 'Filtros',
  rightIcon = 'funnel-outline',
}: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {onFilter ? (
        <Pressable onPress={onFilter} hitSlop={12} accessibilityLabel={filterLabel}>
          <Ionicons name={rightIcon} size={20} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingRight: 2,
  },
  title: {
    ...tokens.font.section,
    color: colors.textMuted,
    fontSize: 14,
    letterSpacing: 0.2,
  },
});