import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { cancelDailyReminder, registerForPushNotifications, scheduleDailyReminder } from '@/lib/notifications';

export default function SettingsScreen() {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [hour, setHour] = useState('09');
  const [minute, setMinute] = useState('00');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      // Local scheduling is intentionally opt-in and survives app restarts.
    })();
  }, []);

  async function togglePush(enabled: boolean) {
    setSaving(true);
    try {
      if (enabled) await registerForPushNotifications();
      setPushEnabled(enabled);
    } catch (error) {
      Alert.alert('Notifications unavailable', error instanceof Error ? error.message : 'Please try again.');
      setPushEnabled(false);
    } finally {
      setSaving(false);
    }
  }

  async function toggleReminder(enabled: boolean) {
    setSaving(true);
    try {
      if (enabled) {
        await scheduleDailyReminder(Number(hour), Number(minute));
      } else {
        await cancelDailyReminder();
      }
      setReminderEnabled(enabled);
    } catch (error) {
      Alert.alert('Reminder not saved', error instanceof Error ? error.message : 'Choose a valid time and try again.');
      setReminderEnabled(false);
    } finally {
      setSaving(false);
    }
  }

  async function saveTime() {
    if (!reminderEnabled) return;
    setSaving(true);
    try {
      await scheduleDailyReminder(Number(hour), Number(minute));
    } catch (error) {
      Alert.alert('Reminder not saved', error instanceof Error ? error.message : 'Choose a valid time and try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>SETTINGS</Text>
      <Text style={styles.title}>Stay in the loop.</Text>
      <Text style={styles.subtitle}>Get a nudge when audio transcription finishes, or choose a daily writing reminder.</Text>
      <View style={styles.card}><View style={styles.row}><View style={styles.copy}><Text style={styles.cardTitle}>Generation updates</Text><Text style={styles.cardBody}>Notify me when long meeting transcription and analysis finish.</Text></View><Switch accessibilityLabel="Generation updates" value={pushEnabled} onValueChange={togglePush} disabled={saving} /></View></View>
      <View style={styles.card}><View style={styles.row}><View style={styles.copy}><Text style={styles.cardTitle}>Daily reminder</Text><Text style={styles.cardBody}>A local reminder that works even when the app is closed.</Text></View><Switch accessibilityLabel="Daily reminder" value={reminderEnabled} onValueChange={toggleReminder} disabled={saving} /></View>
        <View style={styles.timeRow}><Text style={styles.timeLabel}>Time</Text><TextInput accessibilityLabel="Reminder hour" value={hour} onChangeText={setHour} onBlur={saveTime} keyboardType="number-pad" maxLength={2} style={styles.timeInput} /><Text style={styles.colon}>:</Text><TextInput accessibilityLabel="Reminder minute" value={minute} onChangeText={setMinute} onBlur={saveTime} keyboardType="number-pad" maxLength={2} style={styles.timeInput} /></View>
      </View>
      <Pressable accessibilityRole="button" style={styles.backButton} onPress={() => Alert.alert('Saved', 'Your notification preferences are ready for the next build.') }><Text style={styles.backText}>Done</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, padding: 24, paddingTop: 64, backgroundColor: '#0B1020' }, kicker: { color: '#9DAAFF', fontWeight: '700', letterSpacing: 1.6 }, title: { color: '#F7F8FF', fontSize: 32, fontWeight: '800', marginTop: 10 }, subtitle: { color: '#A9B0C4', fontSize: 16, lineHeight: 24, marginTop: 12 }, card: { marginTop: 24, padding: 18, borderRadius: 18, backgroundColor: '#11172A' }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, copy: { flex: 1, paddingRight: 16 }, cardTitle: { color: '#F7F8FF', fontSize: 16, fontWeight: '800' }, cardBody: { color: '#8992AA', lineHeight: 20, marginTop: 6 }, timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18 }, timeLabel: { color: '#DDE2F4', fontWeight: '700', marginRight: 16 }, timeInput: { width: 54, height: 48, borderRadius: 12, backgroundColor: '#151C31', color: '#F7F8FF', textAlign: 'center', fontSize: 18, borderWidth: 1, borderColor: '#2A3554' }, colon: { color: '#A9B0C4', fontSize: 20, marginHorizontal: 8 }, backButton: { marginTop: 28, minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#8B7CFF' }, backText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 } });
