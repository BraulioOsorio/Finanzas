import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { nekoTheme } from '@/constants/nekoTheme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: nekoTheme.surface,
          borderTopColor: nekoTheme.border,
          height: Platform.OS === 'ios' ? 88 : 64,
        },
        tabBarActiveTintColor: nekoTheme.accent,
        tabBarInactiveTintColor: nekoTheme.tabInactive,
        tabBarLabelStyle: {
          fontFamily: nekoTheme.fontMedium,
          fontSize: 11,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color ?? nekoTheme.accent} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendario"
        options={{
          title: 'Calendario',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color ?? nekoTheme.accent} />
          ),
        }}
      />
      <Tabs.Screen
        name="analisis"
        options={{
          title: 'Análisis',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pie-chart-outline" size={size} color={color ?? nekoTheme.accent} />
          ),
        }}
      />
      <Tabs.Screen
        name="cuentas"
        options={{
          title: 'Cuentas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color ?? nekoTheme.accent} />
          ),
        }}
      />
      <Tabs.Screen
        name="historial"
        options={{
          title: 'Historial',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color ?? nekoTheme.accent} />
          ),
        }}
      />
    </Tabs>
  );
}