import { useEffect } from 'react';

import { usePreferences } from '../context/PreferencesContext';
import { useTransactions } from '../context/TransactionsContext';
import { syncCreditReminders } from '../notifications/creditReminders';

/** Programa recordatorios locales cuando cambian cortes/pagos/cuotas. */
export function CreditReminderSync() {
  const { creditRemindersEnabled } = usePreferences();
  const { upcomingItems } = useTransactions();

  useEffect(() => {
    void syncCreditReminders(creditRemindersEnabled, upcomingItems);
  }, [creditRemindersEnabled, upcomingItems]);

  return null;
}