import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { StyleSheet, View } from 'react-native';

import { colors } from '../theme';

type IonName = ComponentProps<typeof Ionicons>['name'];

const TAB_ION: Record<string, { active: IonName; inactive: IonName }> = {
  Inicio: { active: 'home', inactive: 'home-outline' },
  Calendario: { active: 'calendar', inactive: 'calendar-outline' },
  Plan: { active: 'pie-chart', inactive: 'pie-chart-outline' },
  Registrar: { active: 'add-circle', inactive: 'add-circle-outline' },
  Más: { active: 'grid', inactive: 'grid-outline' },
};

export function tabScreenOptions(routeName: string): BottomTabNavigationOptions {
  const icons = TAB_ION[routeName] ?? TAB_ION.Inicio;
  return {
    tabBarActiveTintColor: colors.accent,
    tabBarInactiveTintColor: colors.textMuted,
    tabBarIcon: ({ focused, color }) => (
      <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
        <Ionicons
          name={focused ? icons.active : icons.inactive}
          size={22}
          color={focused ? colors.accent : color}
        />
      </View>
    ),
  };
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 44,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.accentMuted,
  },
});