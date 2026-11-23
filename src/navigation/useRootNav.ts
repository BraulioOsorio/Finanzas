import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MoreStackParamList } from './moreTypes';
import type { RootStackParamList } from './rootTypes';

type RootNav = NativeStackNavigationProp<RootStackParamList>;

export function useRootNav() {
  const navigation = useNavigation();
  const root = navigation.getParent() as RootNav | undefined;

  return {
    openMas: (screen?: keyof MoreStackParamList) => {
      if (!root) {
        return;
      }
      if (screen) {
        root.navigate('Mas', { screen });
      } else {
        root.navigate('Mas');
      }
    },
    openRegistrar: (
      nekoType?: string,
      extra?: { account?: string; amount?: number; postedDate?: string },
    ) => root?.navigate('Registrar', { nekoType, ...extra }),
    openPlan: () => root?.navigate('Plan'),
    goBackRoot: () => root?.goBack(),
  };
}