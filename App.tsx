import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppLockGate } from './src/components/AppLockGate';
import { PreferencesProvider } from './src/context/PreferencesContext';
import { TransactionsProvider } from './src/context/TransactionsContext';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { AddScreen } from './src/screens/AddScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { PlanScreen } from './src/screens/PlanScreen';
import { CreditReminderSync } from './src/components/CreditReminderSync';
import { WidgetSnapshotSync } from './src/components/WidgetSnapshotSync';
import { OnboardingGate } from './src/components/OnboardingGate';
import { MoreStack } from './src/navigation/MoreStack';
import { colors } from './src/theme';

const Tab = createBottomTabNavigator();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    border: colors.border,
    text: colors.text,
    primary: colors.accent,
  },
};

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ color: focused ? colors.accent : colors.textMuted, fontSize: 12, fontWeight: '600' }}>
      {label}
    </Text>
  );
}

function MainTabs() {
  return (
    <OnboardingGate>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            height: 64,
            paddingBottom: 8,
            paddingTop: 8,
          },
        }}
      >
        <Tab.Screen
          name="Inicio"
          component={HomeScreen}
          options={{
            tabBarLabel: ({ focused }) => <TabLabel label="Inicio" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Calendario"
          component={CalendarScreen}
          options={{
            tabBarLabel: ({ focused }) => <TabLabel label="Calendario" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Plan"
          component={PlanScreen}
          options={{
            tabBarLabel: ({ focused }) => <TabLabel label="Plan" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Registrar"
          component={AddScreen}
          options={{
            tabBarLabel: ({ focused }) => <TabLabel label="Registrar" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Más"
          component={MoreStack}
          options={{
            tabBarLabel: ({ focused }) => <TabLabel label="Más" focused={focused} />,
          }}
        />
      </Tab.Navigator>
    </OnboardingGate>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PreferencesProvider>
        <TransactionsProvider>
          <CreditReminderSync />
          <WidgetSnapshotSync />
          <AppLockGate>
            <NavigationContainer theme={navTheme}>
              <MainTabs />
            </NavigationContainer>
          </AppLockGate>
        </TransactionsProvider>
      </PreferencesProvider>
    </SafeAreaProvider>
  );
}