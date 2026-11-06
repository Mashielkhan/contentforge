import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { generateRepurpose, isHttpUrl, type RepurposeResponse } from '@/lib/repurposeApi';
import { saveHistoryItem } from '@/lib/offlineHistory';

const tones = ['Professional', 'Funny', 'Bold', 'Friendly'];

export default function RepurposeScreen() {
  const params = useLocalSearchParams<{ sharedUrl?: string; autoGenerate?: string }>();
  const [url, setUrl] = useState('');
  const [tone, setTone] = useState('Professional');
  const [result, setResult] = useState<RepurposeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const autoStarted = useRef<string | null>(null);

  async function startGeneration(nextUrl = url) {
    const trimmed = nextUrl.trim();
    if (!isHttpUrl(trimmed)) {
      setError('Please enter or share a valid http or https URL.');
      return;
    }
    setError(null);
    setResult(null);
    setIsGenerating(true);
    try {
      const generated = await generateRepurpose({ url: trimmed, tone });
      setResult(generated);
      const clientId = `repurpose-${Date.now()}`;
      await saveHistoryItem({ id: clientId, clientId, kind: 'repurpose', title: trimmed, sourceUrl: trimmed, input: { url: trimmed, tone }, output: generated, isFavorite: false, syncState: 'pending', createdAt: new Date().toISOString() });
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : 'Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }

  useEffect(() => {
    const sharedUrl = typeof params.sharedUrl === 'string' ? params.sharedUrl : '';
    if (!sharedUrl || params.autoGenerate !== '1' || autoStarted.current === sharedUrl) return;
    autoStarted.current = sharedUrl;
    setUrl(sharedUrl);
    void startGeneration(sharedUrl);
  }, [params.autoGenerate, params.sharedUrl]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerRow}><View><Text style={styles.kicker}>REPURPOSE</Text><Text style={styles.title}>Make one idea travel.</Text></View><Text style={styles.credits}>3 left</Text></View>
      <Text style={styles.subtitle}>Paste a blog URL and get a thread plus a LinkedIn post.</Text>
      <TextInput accessibilityLabel="Blog URL" value={url} onChangeText={setUrl} placeholder="https://yourblog.com/article" placeholderTextColor="#68718B" style={styles.input} autoCapitalize="none" keyboardType="url" />
      <Text style={styles.label}>Tone</Text>
      <View style={styles.chips}>{tones.map((candidate) => <Pressable key={candidate} accessibilityRole="button" onPress={() => setTone(candidate)} style={[styles.chip, tone === candidate && styles.chipSelected]}><Text style={[styles.chipText, tone === candidate && styles.chipTextSelected]}>{candidate}</Text></Pressable>)}</View>
      <Pressable accessibilityRole="button" accessibilityLabel="Generate content" style={[styles.button, isGenerating && styles.buttonDisabled]} onPress={() => void startGeneration()} disabled={isGenerating}><Text style={styles.buttonText}>{isGenerating ? 'Generating…' : 'Generate content'}</Text></Pressable>
      {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}
      {result ? <View style={styles.result}><Text style={styles.resultTitle}>Your thread</Text>{result.thread.map((item, index) => <View key={`${index}-${item.text}`} style={styles.resultItem}><Text style={styles.resultLabel}>{item.label ?? `${index + 1} / 5`}</Text><Text style={styles.resultText}>{item.text}</Text></View>)}<Text style={styles.resultTitle}>LinkedIn post</Text><Text style={styles.resultText}>{result.linkedin}</Text></View> : <View style={styles.empty}><Text style={styles.emptyIcon}>✦</Text><Text style={styles.emptyTitle}>{isGenerating ? 'Reading your article…' : 'Your content will land here'}</Text><Text style={styles.emptyBody}>We’ll create a five-part thread and a polished LinkedIn post in seconds.</Text></View>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({ content: { padding: 24, paddingTop: 64, backgroundColor: '#0B1020', flexGrow: 1 }, headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, kicker: { color: '#9DAAFF', fontSize: 12, fontWeight: '700', letterSpacing: 1.6 }, title: { color: '#F7F8FF', fontSize: 32, fontWeight: '800', marginTop: 8 }, subtitle: { color: '#A9B0C4', fontSize: 16, lineHeight: 24, marginTop: 12, marginBottom: 24 }, credits: { color: '#B9B1FF', backgroundColor: '#252044', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, fontWeight: '700' }, input: { minHeight: 54, borderRadius: 16, paddingHorizontal: 16, color: '#F7F8FF', backgroundColor: '#151C31', borderWidth: 1, borderColor: '#2A3554', fontSize: 15 }, label: { color: '#DDE2F4', fontWeight: '700', marginTop: 24, marginBottom: 10 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { minHeight: 44, paddingHorizontal: 14, borderRadius: 22, justifyContent: 'center', backgroundColor: '#151C31', borderWidth: 1, borderColor: '#2A3554' }, chipSelected: { backgroundColor: '#8B7CFF', borderColor: '#8B7CFF' }, chipText: { color: '#A9B0C4', fontWeight: '600' }, chipTextSelected: { color: '#FFFFFF' }, button: { minHeight: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#8B7CFF', marginTop: 24 }, buttonDisabled: { opacity: 0.65 }, buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' }, error: { marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: '#3A1D2A' }, errorText: { color: '#FFB5C2', lineHeight: 20 }, empty: { marginTop: 40, padding: 24, borderRadius: 20, backgroundColor: '#11172A', alignItems: 'center' }, emptyIcon: { color: '#B9B1FF', fontSize: 32 }, emptyTitle: { color: '#F7F8FF', fontSize: 18, fontWeight: '800', marginTop: 12 }, emptyBody: { color: '#8992AA', textAlign: 'center', lineHeight: 22, marginTop: 8 }, result: { marginTop: 24, gap: 12 }, resultTitle: { color: '#F7F8FF', fontSize: 20, fontWeight: '800', marginTop: 12 }, resultItem: { padding: 16, borderRadius: 16, backgroundColor: '#11172A' }, resultLabel: { color: '#9DAAFF', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' }, resultText: { color: '#DDE2F4', fontSize: 15, lineHeight: 22, marginTop: 6 }, });
