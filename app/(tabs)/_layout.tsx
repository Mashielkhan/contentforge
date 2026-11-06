import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#8B7CFF',
      tabBarInactiveTintColor: '#69718A',
      tabBarStyle: { backgroundColor: '#11172A', borderTopColor: '#202942', height: 84, paddingBottom: 18, paddingTop: 8 },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    }}>
      <Tabs.Screen name="repurpose" options={{ title: 'Repurpose', tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" color={String(color)} size={size} /> }} />
      <Tabs.Screen name="write" options={{ title: 'Write', tabBarIcon: ({ color, size }) => <Ionicons name="create-outline" color={String(color)} size={size} /> }} />
      <Tabs.Screen name="meetings" options={{ title: 'Meetings', tabBarIcon: ({ color, size }) => <Ionicons name="mic-outline" color={String(color)} size={size} /> }} />
      <Tabs.Screen name="history" options={{ title: 'History', tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" color={String(color)} size={size} /> }} />
    </Tabs>
  );
}
