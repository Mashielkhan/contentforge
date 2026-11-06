import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

export default function IndexScreen() {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.eyebrow}>CONTENTFORGE</Text>
        <Text style={styles.title}>Turn one idea into everywhere content.</Text>
        <Text style={styles.body}>A focused AI workspace for micro-brands and creators.</Text>
      </View>
      <Pressable accessibilityRole="button" style={styles.button} onPress={() => router.replace('/(tabs)/repurpose')}>
        <Text style={styles.buttonText}>Open workspace</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', padding: 28, paddingTop: 96, backgroundColor: '#0B1020' },
  eyebrow: { color: '#9DAAFF', fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  title: { color: '#F7F8FF', fontSize: 42, lineHeight: 48, fontWeight: '800', marginTop: 18 },
  body: { color: '#A9B0C4', fontSize: 17, lineHeight: 25, marginTop: 18, maxWidth: 320 },
  button: { minHeight: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#8B7CFF' },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});
