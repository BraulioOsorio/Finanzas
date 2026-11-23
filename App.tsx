import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PreferencesProvider } from './src/context/PreferencesContext';
import { TransactionsProvider } from './src/context/TransactionsContext';
import { AccountsScreen } from './src/screens/AccountsScreen';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { AddScreen } from './src/screens/AddScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { DeudasScreen } from './src/screens/DeudasScreen';
import { InformeScreen } from './src/screens/InformeScreen';
import { ImportScreen } from './src/screens/ImportScreen';
import { PlanScreen } from './src/screens/PlanScreen';
import { CategoriesScreen } from './src/screens/CategoriesScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { CreditReminderSync } from './src/components/CreditReminderSync';
import { OnboardingGate } from './src/components/OnboardingGate';
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

export default function App() {
  return (
    <SafeAreaProvider>
      <PreferencesProvider>
        <TransactionsProvider>
          <CreditReminderSync />
          <OnboardingGate>
          <NavigationContainer theme={navTheme}>
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
              name="Informe"
              component={InformeScreen}
              options={{
                tabBarLabel: ({ focused }) => <TabLabel label="Informe" focused={focused} />,
              }}
            />
            <Tab.Screen
              name="Deudas"
              component={DeudasScreen}
              options={{
                tabBarLabel: ({ focused }) => <TabLabel label="Deudas" focused={focused} />,
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
              name="Categorías"
              component={CategoriesScreen}
              options={{
                tabBarLabel: ({ focused }) => <TabLabel label="Categorías" focused={focused} />,
              }}
            />
            <Tab.Screen
              name="Cuentas"
              component={AccountsScreen}
              options={{
                tabBarLabel: ({ focused }) => <TabLabel label="Cuentas" focused={focused} />,
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
              name="Historial"
              component={HistoryScreen}
              options={{
                tabBarLabel: ({ focused }) => <TabLabel label="Historial" focused={focused} />,
              }}
            />
            <Tab.Screen
              name="Importar"
              component={ImportScreen}
              options={{
                tabBarLabel: ({ focused }) => <TabLabel label="Importar" focused={focused} />,
              }}
            />
            <Tab.Screen
              name="Ajustes"
              component={SettingsScreen}
              options={{
                tabBarLabel: ({ focused }) => <TabLabel label="Ajustes" focused={focused} />,
              }}
            />
          </Tab.Navigator>
          </NavigationContainer>
          </OnboardingGate>
        </TransactionsProvider>
      </PreferencesProvider>
    </SafeAreaProvider>
  );
}