import { useEffect } from 'react';

import { usePreferences } from '../context/PreferencesContext';
import { useTransactions } from '../context/TransactionsContext';
import { computeSafeToSpend } from '../domain/safeToSpend';
import { saveWidgetSnapshot } from '../storage/widgetSnapshot';

/** Escribe disponible + tarjetas para widget nativo (EAS / prebuild). */
export function WidgetSnapshotSync() {
  const { safeToSpendHorizon } = usePreferences();
  const { accounts, accountBalances, upcomingItems, creditCardSummaries } = useTransactions();

  useEffect(() => {
    const snap = computeSafeToSpend(safeToSpendHorizon, accounts, accountBalances, upcomingItems);
    const cardsPayInFull = creditCardSummaries
      .filter((c) => c.outlook?.payInFullToZeroInterest)
      .map((c) => ({
        account: c.account,
        amount: c.outlook!.payInFullToZeroInterest,
        due: c.outlook!.nextDue,
      }));

    void saveWidgetSnapshot({
      safeToSpend: snap.safeToSpend,
      liquidNow: snap.liquidNow,
      horizonLabel: snap.horizonLabel,
      throughDate: snap.throughDate,
      updatedAt: new Date().toISOString(),
      cardsPayInFull,
    });
  }, [
    safeToSpendHorizon,
    accounts,
    accountBalances,
    upcomingItems,
    creditCardSummaries,
  ]);

  return null;
}