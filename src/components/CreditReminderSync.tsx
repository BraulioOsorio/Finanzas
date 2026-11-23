import { useEffect } from 'react';

import { usePreferences } from '../context/PreferencesContext';
import { useTransactions } from '../context/TransactionsContext';
import { syncCreditReminders } from '../notifications/creditReminders';

/** Programa recordatorios locales cuando cambian cortes/pagos/cuotas. */
export function CreditReminderSync() {
  const { creditRemindersEnabled, reminderLeadDays } = usePreferences();
  const { upcomingItems } = useTransactions();

  useEffect(() => {
    syncCreditReminders(creditRemindersEnabled, upcomingItems, reminderLeadDays).catch(() => {
      /* Expo Go limita expo-notifications; la app sigue sin push remotas */
    });
  }, [creditRemindersEnabled, upcomingItems, reminderLeadDays]);

  return null;
}