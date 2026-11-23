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

function reminderDate(isoDay: string, hour = 9): Date {
  const d = new Date(`${isoDay}T00:00:00`);
  d.setHours(hour, 0, 0, 0);
  const dayBefore = new Date(d);
  dayBefore.setDate(dayBefore.getDate() - 1);
  return dayBefore.getTime() > Date.now() ? dayBefore : d;
}

export async function syncCreditReminders(
  enabled: boolean,
  upcoming: UpcomingItem[],
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

  for (const item of targets) {
    const trigger = reminderDate(item.date);
    if (trigger.getTime() <= Date.now()) {
      continue;
    }
    const body =
      item.signedAmount !== 0
        ? `Monto orientativo ${Math.abs(item.signedAmount).toLocaleString('es-CO')} COP`
        : item.subtitle ?? item.account;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: item.title,
        body,
        data: { id: item.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger,
      },
    });
  }

}