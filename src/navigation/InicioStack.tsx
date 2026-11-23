import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { InicioStackParamList } from './inicioTypes';
import { HomeScreen } from '../screens/HomeScreen';
import { ProximoScreen } from '../screens/ProximoScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<InicioStackParamList>();

export function InicioStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="InicioHome" component={HomeScreen} />
      <Stack.Screen name="Proximo" component={ProximoScreen} />
    </Stack.Navigator>
  );
}