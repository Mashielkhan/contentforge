import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

const slides = [
  { eyebrow: '01 / REPURPOSE', title: 'One idea, many channels.', body: 'Turn an article into a ready-to-post thread and LinkedIn post in seconds.' },
  { eyebrow: '02 / WRITE', title: 'Write in your brand voice.', body: 'Keep your audience, product, and tone in context across every generation.' },
  { eyebrow: '03 / MEETINGS', title: 'Leave with clear next steps.', body: 'Transform transcripts into decisions, owners, deadlines, and a ready-to-send follow-up.' },
];

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const last = index === slides.length - 1;
  return <View style={styles.container}>
    <View><Text style={styles.logo}>CONTENTFORGE</Text><Text style={styles.eyebrow}>{slide.eyebrow}</Text><Text style={styles.title}>{slide.title}</Text><Text style={styles.body}>{slide.body}</Text></View>
    <View><View style={styles.dots}>{slides.map((_, dot) => <View key={dot} style={[styles.dot, dot === index && styles.dotActive]} />)}</View><Pressable accessibilityRole="button" style={styles.button} onPress={() => last ? router.replace('/auth') : setIndex((value) => value + 1)}><Text style={styles.buttonText}>{last ? 'Create your workspace' : 'Continue'}</Text></Pressable><Pressable accessibilityRole="button" style={styles.skip} onPress={() => router.replace('/(tabs)/repurpose')}><Text style={styles.skipText}>Skip for now</Text></Pressable></View>
  </View>;
}

const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'space-between', padding: 28, paddingTop: 84, paddingBottom: 40, backgroundColor: '#0B1020' }, logo: { color: '#F7F8FF', fontSize: 13, fontWeight: '800', letterSpacing: 2 }, eyebrow: { color: '#9DAAFF', fontSize: 12, fontWeight: '700', letterSpacing: 1.6, marginTop: 92 }, title: { color: '#F7F8FF', fontSize: 40, lineHeight: 46, fontWeight: '800', marginTop: 16 }, body: { color: '#A9B0C4', fontSize: 17, lineHeight: 26, marginTop: 18 }, dots: { flexDirection: 'row', gap: 8, marginBottom: 22 }, dot: { width: 28, height: 5, borderRadius: 3, backgroundColor: '#28324D' }, dotActive: { backgroundColor: '#8B7CFF' }, button: { minHeight: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#8B7CFF' }, buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' }, skip: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 8 }, skipText: { color: '#8992AA', fontWeight: '700' } });
