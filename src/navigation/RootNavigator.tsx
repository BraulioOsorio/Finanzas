import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { RootStackParamList } from './rootTypes';
import { NekoMainTabs } from './NekoMainTabs';
import { MoreStack } from './MoreStack';
import { AddScreen } from '../screens/AddScreen';
import { PlanScreen } from '../screens/PlanScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="Tabs" component={NekoMainTabs} />
      <Stack.Screen
        name="Registrar"
        component={AddScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="Mas" component={MoreStack} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Plan" component={PlanScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}