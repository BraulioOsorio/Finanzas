import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { NekoTabBar } from '../components/neko/NekoTabBar';
import { TransactionTypeSheet } from '../components/neko/TransactionTypeSheet';
import { InicioStack } from './InicioStack';
import type { MainTabParamList } from './tabTypes';
import type { RootStackParamList } from './rootTypes';
import { OnboardingGate } from '../components/OnboardingGate';
import { CalendarScreen } from '../screens/CalendarScreen';
import { InformeScreen } from '../screens/InformeScreen';
import { AccountsScreen } from '../screens/AccountsScreen';
import { HistoryScreen } from '../screens/HistoryScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

type RootNav = NativeStackNavigationProp<RootStackParamList>;

export function NekoMainTabs() {
  const rootNav = useNavigation<RootNav>();
  const [addSheet, setAddSheet] = useState(false);

  return (
    <OnboardingGate>
    <View style={styles.fill}>
      <Tab.Navigator
        screenOptions={{ headerShown: false }}
        tabBar={(props) => (
          <NekoTabBar {...props} onFabPress={() => setAddSheet(true)} />
        )}
      >
        <Tab.Screen name="Inicio" component={InicioStack} />
        <Tab.Screen name="Calendario" component={CalendarScreen} />
        <Tab.Screen name="Análisis" component={InformeScreen} />
        <Tab.Screen name="Cuentas" component={AccountsScreen} />
        <Tab.Screen name="Historial" component={HistoryScreen} />
      </Tab.Navigator>

      <TransactionTypeSheet
        visible={addSheet}
        onClose={() => setAddSheet(false)}
        onPick={(nekoType) => {
          setAddSheet(false);
          rootNav.navigate('Registrar', { nekoType });
        }}
      />
    </View>
    </OnboardingGate>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});