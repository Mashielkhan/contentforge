import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { clearDeletedHistory } from './offlineHistory';

const RETENTION_KEY = '@contentforge/privacy/meeting-retention';

export async function getMeetingRetentionPreference() {
  const local = await AsyncStorage.getItem(RETENTION_KEY);
  if (local !== null) return local === 'true';
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return true;
  const { data } = await supabase.from('meeting_privacy_preferences').select('auto_delete_enabled').eq('user_id', user.id).maybeSingle();
  return data?.auto_delete_enabled ?? true;
}

export async function setMeetingRetentionPreference(enabled: boolean) {
  await AsyncStorage.setItem(RETENTION_KEY, String(enabled));
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase.from('meeting_privacy_preferences').upsert({ user_id: user.id, auto_delete_enabled: enabled, retention_days: 30, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function deleteAllMyData() {
  const { error } = await supabase.rpc('delete_my_data');
  if (error) throw error;
  await AsyncStorage.multiRemove([RETENTION_KEY, '@contentforge/selected-brand-profile', '@contentforge/notifications/daily-reminder-id', '@contentforge/history/v1', '@contentforge/offline/request-queue/v1']);
  await clearDeletedHistory();
}
