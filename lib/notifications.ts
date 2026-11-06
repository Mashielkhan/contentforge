import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

export const TRANSCRIPTION_CHANNEL_ID = 'transcription-complete';
export const DAILY_REMINDER_CHANNEL_ID = 'daily-reminder';
const REMINDER_ID_KEY = '@contentforge/notifications/daily-reminder-id';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function configureChannels() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(TRANSCRIPTION_CHANNEL_ID, {
    name: 'Generation complete',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 200, 250],
  });
  await Notifications.setNotificationChannelAsync(DAILY_REMINDER_CHANNEL_ID, {
    name: 'Daily reminder',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function configureNotifications() {
  await configureChannels();
}

export async function registerForPushNotifications() {
  await configureChannels();
  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== 'granted') throw new Error('Notifications are disabled. Enable them in system settings to receive updates.');

  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID || Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
  if (!projectId) throw new Error('EAS project ID is missing. Add EXPO_PUBLIC_EAS_PROJECT_ID before building.');
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { error } = await supabase.from('device_tokens').upsert({
      user_id: user.id,
      token,
      platform: Platform.OS,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,token' });
    if (error) throw error;
  }
  return token;
}

export async function disablePushToken() {
  const token = (await Notifications.getExpoPushTokenAsync({ projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId })).data;
  await supabase.from('device_tokens').delete().eq('token', token);
}

export async function scheduleDailyReminder(hour: number, minute: number) {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute) || minute < 0 || minute > 59) {
    throw new Error('Choose a reminder time between 00:00 and 23:59.');
  }
  await cancelDailyReminder();
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'A fresh idea is waiting',
      body: 'Open ContentForge and turn today’s thought into content.',
      data: { url: '/(tabs)/write', kind: 'daily-reminder' },
      ...(Platform.OS === 'android' ? { channelId: DAILY_REMINDER_CHANNEL_ID } : {}),
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  });
  await AsyncStorage.setItem(REMINDER_ID_KEY, identifier);
  return identifier;
}

export async function cancelDailyReminder() {
  const identifier = await AsyncStorage.getItem(REMINDER_ID_KEY);
  if (identifier) await Notifications.cancelScheduledNotificationAsync(identifier);
  await AsyncStorage.removeItem(REMINDER_ID_KEY);
}
