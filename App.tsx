import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppLockGate } from './src/components/AppLockGate';
import { NekoFontGate } from './src/components/NekoFontGate';
import { PreferencesProvider } from './src/context/PreferencesContext';
import { TransactionsProvider } from './src/context/TransactionsContext';
import { CreditReminderSync } from './src/components/CreditReminderSync';
import { WidgetSnapshotSync } from './src/components/WidgetSnapshotSync';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/theme';

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

function AppShell() {
  return (
    <>
      <StatusBar style="light" />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NekoFontGate>
        <PreferencesProvider>
          <TransactionsProvider>
            <CreditReminderSync />
            <WidgetSnapshotSync />
            <AppLockGate>
              <NavigationContainer theme={navTheme}>
                <AppShell />
              </NavigationContainer>
            </AppLockGate>
          </TransactionsProvider>
        </PreferencesProvider>
      </NekoFontGate>
    </SafeAreaProvider>
  );
}