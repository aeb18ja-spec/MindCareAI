import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const DAILY_REMINDER_ENABLED_KEY = "@mindcare_daily_reminder_enabled";
const DAILY_REMINDER_NOTIFICATION_ID_KEY = "@mindcare_daily_reminder_notification_id";
const DAILY_REMINDER_CHANNEL_ID = "mindcare-daily-reminders";
const DAILY_REMINDER_HOUR = 20;
const DAILY_REMINDER_MINUTE = 0;

export const DAILY_REMINDER_TIME_LABEL = "8:00 PM";

let notificationsInitialized = false;

export function isDailyReminderSupported(): boolean {
  return Platform.OS !== "web";
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync(DAILY_REMINDER_CHANNEL_ID, {
    name: "Daily Reminders",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
  });
}

export async function initializeReminderNotifications(): Promise<void> {
  if (!isDailyReminderSupported() || notificationsInitialized) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  await ensureAndroidChannel();
  notificationsInitialized = true;
}

async function hasNotificationPermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;

  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    status = requested.status;
  }

  return status === "granted";
}

async function clearScheduledReminderIdOnly(): Promise<void> {
  await AsyncStorage.removeItem(DAILY_REMINDER_NOTIFICATION_ID_KEY);
}

async function cancelExistingReminderIfAny(): Promise<void> {
  const existingId = await AsyncStorage.getItem(DAILY_REMINDER_NOTIFICATION_ID_KEY);
  if (!existingId) return;

  try {
    await Notifications.cancelScheduledNotificationAsync(existingId);
  } catch {
    // Ignore stale IDs or already-cancelled notifications
  }

  await clearScheduledReminderIdOnly();
}

export async function getDailyReminderEnabled(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(DAILY_REMINDER_ENABLED_KEY);
  if (raw !== "true") {
    return false;
  }

  if (!isDailyReminderSupported()) {
    return false;
  }

  const storedId = await AsyncStorage.getItem(DAILY_REMINDER_NOTIFICATION_ID_KEY);
  if (!storedId) {
    await AsyncStorage.setItem(DAILY_REMINDER_ENABLED_KEY, "false");
    return false;
  }

  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const exists = scheduled.some((item) => item.identifier === storedId);

    if (!exists) {
      await AsyncStorage.multiSet([
        [DAILY_REMINDER_ENABLED_KEY, "false"],
        [DAILY_REMINDER_NOTIFICATION_ID_KEY, ""],
      ]);
      await clearScheduledReminderIdOnly();
      return false;
    }
  } catch {
    // If check fails, keep current state and allow user to toggle manually.
  }

  return true;
}

export async function enableDailyReminder(): Promise<boolean> {
  if (!isDailyReminderSupported()) {
    return false;
  }

  await initializeReminderNotifications();

  const granted = await hasNotificationPermission();
  if (!granted) {
    return false;
  }

  await cancelExistingReminderIfAny();

  const trigger: Notifications.DailyTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    hour: DAILY_REMINDER_HOUR,
    minute: DAILY_REMINDER_MINUTE,
  };

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "MindCareAI Daily Check-in",
      body: "How are you feeling today? Log your mood and wellness check-in.",
      sound: true,
      data: { kind: "daily-reminder" },
      ...(Platform.OS === "android"
        ? { channelId: DAILY_REMINDER_CHANNEL_ID }
        : {}),
    },
    trigger,
  });

  let isScheduled = true;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    isScheduled = scheduled.some((item) => item.identifier === notificationId);
  } catch {
    // If verification fails, keep optimistic success.
  }

  if (!isScheduled) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch {
      // Ignore cleanup errors
    }
    await AsyncStorage.multiSet([
      [DAILY_REMINDER_ENABLED_KEY, "false"],
      [DAILY_REMINDER_NOTIFICATION_ID_KEY, ""],
    ]);
    await clearScheduledReminderIdOnly();
    return false;
  }

  await AsyncStorage.multiSet([
    [DAILY_REMINDER_ENABLED_KEY, "true"],
    [DAILY_REMINDER_NOTIFICATION_ID_KEY, notificationId],
  ]);

  return true;
}

export async function disableDailyReminder(): Promise<void> {
  if (isDailyReminderSupported()) {
    await cancelExistingReminderIfAny();
  }

  await AsyncStorage.multiSet([
    [DAILY_REMINDER_ENABLED_KEY, "false"],
    [DAILY_REMINDER_NOTIFICATION_ID_KEY, ""],
  ]);
  await clearScheduledReminderIdOnly();
}
