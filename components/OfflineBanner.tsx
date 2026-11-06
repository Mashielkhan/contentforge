import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Network from 'expo-network';
import { flushOfflineQueue, pendingRequestCount, subscribeToConnectivity } from '@/lib/offlineQueue';

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [queued, setQueued] = useState(0);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const state = await Network.getNetworkStateAsync();
      if (mounted) setOffline(state.isConnected === false || state.isInternetReachable === false);
      if (mounted) setQueued(await pendingRequestCount());
    })();
    const subscription = Network.addNetworkStateListener((state) => {
      const isOffline = state.isConnected === false || state.isInternetReachable === false;
      setOffline(isOffline);
      if (!isOffline) void flushOfflineQueue().then(() => pendingRequestCount().then(setQueued));
    });
    const retrySubscription = subscribeToConnectivity(() => void flushOfflineQueue().then(() => pendingRequestCount().then(setQueued)));
    return () => { mounted = false; subscription.remove(); retrySubscription.remove(); };
  }, []);

  if (!offline && queued === 0) return null;
  return <View accessibilityRole="alert" style={[styles.banner, !offline && styles.reconnected]}><Text style={styles.text}>{offline ? 'You’re offline. Cached history is available.' : `${queued} queued request${queued === 1 ? '' : 's'} will sync now.`}</Text></View>;
}

const styles = StyleSheet.create({ banner: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#6B3A1C' }, reconnected: { backgroundColor: '#24533D' }, text: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', textAlign: 'center' } });
