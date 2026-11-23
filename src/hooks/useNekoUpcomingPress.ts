import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { accountDefByName } from '../domain/accounts/resolveAccounts';
import type { UpcomingItem } from '../domain/upcoming';
import { resolveUpcomingPressAction } from '../domain/upcomingPress';
import { useRootNav } from '../navigation/useRootNav';
import { useTransactions } from '../context/TransactionsContext';
import type { AccountDef, InstallmentPlan, ScheduledPayment } from '../types';

export function useNekoUpcomingPress() {
  const { scheduledPayments, installmentPlans, accounts } = useTransactions();
  const { openRegistrar } = useRootNav();

  const [scheduledEdit, setScheduledEdit] = useState<ScheduledPayment | null>(null);
  const [installmentEdit, setInstallmentEdit] = useState<InstallmentPlan | null>(null);
  const [accountEdit, setAccountEdit] = useState<AccountDef | null>(null);

  const onPressItem = useCallback(
    (item: UpcomingItem) => {
      const action = resolveUpcomingPressAction(item);
      switch (action.type) {
        case 'edit_scheduled': {
          const sch = scheduledPayments.find((p) => p.id === action.scheduledId);
          if (sch) {
            setScheduledEdit(sch);
          } else {
            Alert.alert('Plan', 'No encontramos este pago programado. Revisa la pestaña Plan.');
          }
          break;
        }
        case 'edit_installment': {
          const plan = installmentPlans.find((p) => p.id === action.planId);
          if (plan) {
            setInstallmentEdit(plan);
          } else {
            Alert.alert('Cuotas', 'No encontramos esta compra a meses en Plan.');
          }
          break;
        }
        case 'add_payment':
          openRegistrar(action.nekoType, {
            account: action.account,
            amount: action.amount,
            postedDate: action.postedDate,
          });
          break;
        case 'edit_account': {
          const def = accountDefByName(accounts, action.accountName);
          if (def) {
            setAccountEdit(def);
          } else {
            Alert.alert('Cuenta', `Configura ${action.accountName} en Cuentas.`);
          }
          break;
        }
        case 'none':
          Alert.alert(
            'Próximo',
            'Este evento es una proyección. Regístralo con Registrar cuando ocurra.',
          );
          break;
        default:
          break;
      }
    },
    [accounts, installmentPlans, openRegistrar, scheduledPayments],
  );

  return {
    onPressItem,
    scheduledEdit,
    setScheduledEdit,
    installmentEdit,
    setInstallmentEdit,
    accountEdit,
    setAccountEdit,
  };
}