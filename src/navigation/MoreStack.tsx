import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { MoreStackParamList } from './moreTypes';
import { AccountsScreen } from '../screens/AccountsScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';
import { DeudasScreen } from '../screens/DeudasScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ImportScreen } from '../screens/ImportScreen';
import { InformeScreen } from '../screens/InformeScreen';
import { MoreHubScreen } from '../screens/MoreHubScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<MoreStackParamList>();

export function MoreStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="MasHub" component={MoreHubScreen} />
      <Stack.Screen name="Informe" component={InformeScreen} />
      <Stack.Screen name="Historial" component={HistoryScreen} />
      <Stack.Screen name="Cuentas" component={AccountsScreen} />
      <Stack.Screen name="Deudas" component={DeudasScreen} />
      <Stack.Screen name="Categorias" component={CategoriesScreen} />
      <Stack.Screen name="Importar" component={ImportScreen} />
      <Stack.Screen name="Buscar" component={SearchScreen} />
      <Stack.Screen name="Ajustes" component={SettingsScreen} />
    </Stack.Navigator>
  );
}