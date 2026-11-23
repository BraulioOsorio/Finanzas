import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TransactionsProvider } from './src/context/TransactionsContext';
import { AddScreen } from './src/screens/AddScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ImportScreen } from './src/screens/ImportScreen';
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
      <TransactionsProvider>
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
          </Tab.Navigator>
        </NavigationContainer>
      </TransactionsProvider>
    </SafeAreaProvider>
  );
}