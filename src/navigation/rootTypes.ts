import type { NavigatorScreenParams } from '@react-navigation/native';

import type { MoreStackParamList } from './moreTypes';

export type RootStackParamList = {
  Tabs: undefined;
  Registrar:
    | {
        nekoType?: string;
        account?: string;
        amount?: number;
        postedDate?: string;
      }
    | undefined;
  Mas: NavigatorScreenParams<MoreStackParamList> | undefined;
  Plan: undefined;
};