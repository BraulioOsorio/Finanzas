import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme';

type IonName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  icon: IonName;
  iconTint?: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  trailing?: 'chevron' | 'external';
};

/** Fila de menú NEKO: icono en recuadro, título, chevron. */
export function NekoListRow({
  icon,
  iconTint = colors.accent,
  title,
  subtitle,
  onPress,
  trailing = 'chevron',
}: Props) {
  return (
    <Pressable style={styles.row} onPress={onPress} accessibilityRole="button">
      <View style={[styles.iconBox, { backgroundColor: colors.accentMuted }]}>
        <Ionicons name={icon} size={20} color={iconTint} />
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text> : null}
      </View>
      <Ionicons
        name={trailing === 'external' ? 'open-outline' : 'chevron-forward'}
        size={18}
        color={colors.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { flex: 1, gap: 3 },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'HankenGrotesk-Medium',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'HankenGrotesk-Regular',
  },
});