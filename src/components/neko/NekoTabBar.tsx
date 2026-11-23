import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, tokens } from '../../theme';

type Props = BottomTabBarProps & {
  onFabPress: () => void;
};

const TAB_LABEL: Record<string, string> = {
  Inicio: 'Inicio',
  Calendario: 'Calendario',
  Análisis: 'Análisis',
  Cuentas: 'Cuentas',
  Historial: 'Historial',
};

const TAB_ICON: Record<string, { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap }> = {
  Inicio: { on: 'home', off: 'home-outline' },
  Calendario: { on: 'calendar', off: 'calendar-outline' },
  Análisis: { on: 'stats-chart', off: 'stats-chart-outline' },
  Cuentas: { on: 'wallet', off: 'wallet-outline' },
  Historial: { on: 'time', off: 'time-outline' },
};

/** Tab bar flotante NEKO + FAB morado a la derecha (glow en pestaña activa). */
export function NekoTabBar({ state, descriptors, navigation, onFabPress }: Props) {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 10);

  return (
    <View style={[styles.outer, { paddingBottom: bottom }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label = TAB_LABEL[route.name] ?? route.name;
          const icons = TAB_ICON[route.name] ?? TAB_ICON.Inicio;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={styles.tab}
            >
              <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                <Ionicons
                  name={focused ? icons.on : icons.off}
                  size={focused ? 23 : 21}
                  color={focused ? colors.accent : colors.textMuted}
                />
              </View>
              {focused ? <View style={styles.activeDot} /> : <View style={styles.dotSpacer} />}
              <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        style={styles.fab}
        onPress={onFabPress}
        accessibilityRole="button"
        accessibilityLabel="Agregar transacción"
      >
        <View style={styles.fabRing}>
          <Ionicons name="add" size={28} color="#0b1118" />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    gap: 8,
  },
  bar: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 64,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 2,
    paddingTop: 6,
    paddingBottom: 4,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', gap: 1 },
  iconWrap: {
    width: 42,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    shadowColor: colors.accent,
    shadowOpacity: 0.65,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
    marginTop: 1,
  },
  dotSpacer: { width: 4, height: 4, marginTop: 1 },
  label: { ...tokens.font.tab, color: colors.textMuted, fontSize: 9, marginTop: 1 },
  labelActive: { color: colors.accent, fontWeight: '700', fontFamily: 'HankenGrotesk-Bold' },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 2,
    borderColor: colors.accentBorder,
    shadowColor: colors.accent,
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
  },
  fabRing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});