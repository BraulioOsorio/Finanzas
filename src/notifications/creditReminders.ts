import { Platform } from 'react-native';

import type { UpcomingItem } from '../domain/upcoming';

type NotificationsModule = typeof import('expo-notifications');

let notificationHandlerInstalled = false;

async function getNotifications(): Promise<NotificationsModule | null> {
  if (Platform.OS === 'web') {
    return null;
  }
  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}

function reminderAt(isoDay: string, daysBefore: number, hour = 9): Date | null {
  const d = new Date(`${isoDay}T12:00:00`);
  d.setDate(d.getDate() - daysBefore);
  d.setHours(hour, 0, 0, 0);
  return d.getTime() > Date.now() ? d : null;
}

export async function syncCreditReminders(
  enabled: boolean,
  upcoming: UpcomingItem[],
  leadDays: number[] = [1],
): Promise<void> {
  const Notifications = await getNotifications();
  if (!Notifications) {
    return;
  }

  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!enabled) {
    return;
  }

  if (!notificationHandlerInstalled) {
    notificationHandlerInstalled = true;
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let final = existing;
  if (existing !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    final = req.status;
  }
  if (final !== 'granted') {
    return;
  }

  const targets = upcoming.filter(
    (u) =>
      u.kind === 'card_due' ||
      u.kind === 'card_close' ||
      u.kind === 'installment' ||
      u.kind === 'loan_due',
  );

  const sortedLeads = [...new Set(leadDays)].filter((d) => d > 0).sort((a, b) => b - a);
  const leads = sortedLeads.length ? sortedLeads : [1];

  for (const item of targets) {
    const body =
      item.signedAmount !== 0
        ? `Monto orientativo ${Math.abs(item.signedAmount).toLocaleString('es-CO')} COP`
        : item.subtitle ?? item.account;

    for (const lead of leads) {
      const trigger = reminderAt(item.date, lead);
      if (!trigger) {
        continue;
      }
      const prefix = lead === 1 ? 'Mañana' : `En ${lead} días`;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${prefix}: ${item.title}`,
          body,
          data: { id: `${item.id}-${lead}d` },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: trigger,
        },
      });
    }
  }

}