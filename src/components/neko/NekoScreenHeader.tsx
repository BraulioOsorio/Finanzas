import type { ComponentProps, ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, tokens } from '../../theme';

type IonName = ComponentProps<typeof Ionicons>['name'];

type Action = { icon: IonName; onPress: () => void; accessibilityLabel: string };

/** Cabecera estilo NEKO: título grande a la izquierda e iconos de acción. */
export function NekoScreenHeader({
  title,
  subtitle,
  actions,
  left,
}: {
  title: string;
  subtitle?: string;
  actions?: Action[];
  left?: ReactNode;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        {left}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {actions?.length ? (
          <View style={styles.actions}>
            {actions.map((a) => (
              <Pressable
                key={a.accessibilityLabel}
                onPress={a.onPress}
                style={styles.actionBtn}
                accessibilityRole="button"
                accessibilityLabel={a.accessibilityLabel}
              >
                <Ionicons name={a.icon} size={21} color={colors.text} />
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  titleBlock: { flex: 1, gap: 4 },
  title: {
    ...tokens.font.title,
    color: colors.text,
    fontSize: 27,
    letterSpacing: -0.35,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: tokens.fontFamily.regular,
  },
  actions: { flexDirection: 'row', gap: 4, paddingTop: 4 },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
});