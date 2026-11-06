import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { hydrateHistoryFromSupabase, syncPendingHistory } from '@/lib/historySync';
import { listHistory, type HistoryItem } from '@/lib/offlineHistory';

export default function HistoryScreen() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => { setItems(await listHistory({ query })); }, [query]);
  const refresh = useCallback(async () => { setRefreshing(true); try { await syncPendingHistory(); await hydrateHistoryFromSupabase(); } catch { /* cached data remains available offline */ } await load(); setRefreshing(false); }, [load]);
  useEffect(() => { void refresh(); }, [refresh]);
  return <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor="#8B7CFF" />}>
    <Text style={styles.kicker}>HISTORY</Text><Text style={styles.title}>Your best work, one tap away.</Text><Text style={styles.body}>Cached locally and available even when you’re offline.</Text>
    <TextInput accessibilityLabel="Search cached history" value={query} onChangeText={setQuery} placeholder="Search your history" placeholderTextColor="#68718B" style={styles.input} />
    {items.length ? items.map((item) => <View key={item.clientId} style={styles.card}><View style={styles.cardHeader}><Text style={styles.kind}>{item.kind}</Text><Text style={styles.date}>{new Date(item.updatedAt).toLocaleDateString()}</Text></View><Text style={styles.cardTitle}>{item.title}</Text><Text numberOfLines={3} style={styles.preview}>{JSON.stringify(item.output).replace(/[{}\[\]"]+/g, '').slice(0, 220)}</Text></View>) : <View style={styles.empty}><Text style={styles.emptyTitle}>No cached content yet</Text><Text style={styles.emptyBody}>Generate something and it will appear here for offline viewing.</Text></View>}
    <Pressable accessibilityRole="button" onPress={() => void refresh()} style={styles.refreshButton}><Text style={styles.refreshText}>Refresh history</Text></Pressable>
  </ScrollView>;
}
const styles = StyleSheet.create({ container: { padding: 24, paddingTop: 64, backgroundColor: '#0B1020', flexGrow: 1 }, kicker: { color: '#9DAAFF', fontWeight: '700', letterSpacing: 1.6 }, title: { color: '#F7F8FF', fontSize: 32, fontWeight: '800', marginTop: 12 }, body: { color: '#A9B0C4', fontSize: 16, lineHeight: 24, marginTop: 14 }, input: { minHeight: 50, marginTop: 24, borderRadius: 14, paddingHorizontal: 14, color: '#F7F8FF', backgroundColor: '#151C31', borderWidth: 1, borderColor: '#2A3554' }, card: { marginTop: 14, padding: 16, borderRadius: 16, backgroundColor: '#11172A' }, cardHeader: { flexDirection: 'row', justifyContent: 'space-between' }, kind: { color: '#B9B1FF', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' }, date: { color: '#68718B', fontSize: 12 }, cardTitle: { color: '#F7F8FF', fontSize: 16, fontWeight: '800', marginTop: 8 }, preview: { color: '#A9B0C4', lineHeight: 20, marginTop: 8 }, empty: { marginTop: 32, padding: 24, borderRadius: 18, alignItems: 'center', backgroundColor: '#11172A' }, emptyTitle: { color: '#F7F8FF', fontWeight: '800', fontSize: 18 }, emptyBody: { color: '#8992AA', textAlign: 'center', lineHeight: 22, marginTop: 8 }, refreshButton: { minHeight: 48, marginTop: 20, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A233B' }, refreshText: { color: '#DDE2F4', fontWeight: '700' } });
