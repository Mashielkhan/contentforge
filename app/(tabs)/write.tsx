import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { createBrandProfile, getSelectedBrandProfileId, listBrandProfiles, setSelectedBrandProfileId, type BrandProfile } from '@/lib/brandProfiles';
import { generateWrite, type WriteResponse } from '@/lib/writeApi';
import { saveHistoryItem } from '@/lib/offlineHistory';

const starterProfile: BrandProfile = { id: 'local-starter', name: 'Your brand', productDetails: 'Add what you sell or build.', audience: 'People you want to reach.', voice: 'Clear, useful, and human.', isDefault: true };

export default function WriteScreen() {
  const [profiles, setProfiles] = useState<BrandProfile[]>([starterProfile]);
  const [selectedId, setSelectedId] = useState(starterProfile.id);
  const [topic, setTopic] = useState('');
  const [result, setResult] = useState<WriteResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newProfile, setNewProfile] = useState({ name: '', productDetails: '', audience: '', voice: '' });

  const selectedProfile = profiles.find((profile) => profile.id === selectedId) ?? profiles[0];

  useEffect(() => {
    void (async () => {
      try {
        const [remoteProfiles, savedId] = await Promise.all([listBrandProfiles(), getSelectedBrandProfileId()]);
        if (remoteProfiles.length) {
          setProfiles(remoteProfiles);
          setSelectedId(savedId && remoteProfiles.some((profile) => profile.id === savedId) ? savedId : remoteProfiles[0].id);
        }
      } catch {
        // The starter profile keeps the screen useful while offline or signed out.
      }
    })();
  }, []);

  async function selectProfile(profile: BrandProfile) {
    setSelectedId(profile.id);
    await setSelectedBrandProfileId(profile.id);
    setResult(null);
  }

  async function addProfile() {
    if (!newProfile.name.trim()) return Alert.alert('Name your profile', 'Add a short brand name first.');
    try {
      const created = await createBrandProfile(newProfile);
      setProfiles((current) => [...current.filter((profile) => profile.id !== starterProfile.id), created]);
      await selectProfile(created);
      setNewProfile({ name: '', productDetails: '', audience: '', voice: '' });
      setShowCreate(false);
    } catch (error) {
      Alert.alert('Profile not saved', error instanceof Error ? error.message : 'Please sign in and try again.');
    }
  }

  async function startGeneration() {
    if (!selectedProfile) return;
    if (!topic.trim()) return Alert.alert('Add a topic', 'Tell ContentForge what you want to write about.');
    setIsGenerating(true);
    setResult(null);
    try {
      const generated = await generateWrite({ topic, profile: selectedProfile });
      setResult(generated);
      const clientId = `write-${Date.now()}`;
      await saveHistoryItem({ id: clientId, clientId, kind: 'write', title: topic.trim(), input: { topic: topic.trim(), brandProfile: selectedProfile }, output: generated, isFavorite: false, syncState: 'pending', createdAt: new Date().toISOString() });
    } catch (error) {
      Alert.alert('Could not write', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }

  return <ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.kicker}>WRITE</Text>
    <Text style={styles.title}>Start from your brand voice.</Text>
    <Text style={styles.body}>Switch profiles when you write for a different product, audience, or tone.</Text>
    <Text style={styles.label}>Brand profile</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.profileRow}>
      {profiles.map((profile) => <Pressable key={profile.id} accessibilityRole="button" onPress={() => void selectProfile(profile)} style={[styles.profileChip, profile.id === selectedId && styles.profileChipSelected]}><Text style={[styles.profileChipText, profile.id === selectedId && styles.profileChipTextSelected]}>{profile.name}</Text></Pressable>)}
      <Pressable accessibilityRole="button" onPress={() => setShowCreate(true)} style={styles.addChip}><Text style={styles.addChipText}>+ Add profile</Text></Pressable>
    </ScrollView>
    <View style={styles.profileCard}><Text style={styles.profileTitle}>{selectedProfile?.name}</Text><Text style={styles.profileMeta}>{selectedProfile?.voice}</Text><Text style={styles.profileMeta}>{selectedProfile?.audience}</Text></View>
    <TextInput accessibilityLabel="Writing topic" value={topic} onChangeText={setTopic} placeholder="What should we write about?" placeholderTextColor="#68718B" style={[styles.input, styles.topicInput]} multiline />
    <Pressable accessibilityRole="button" onPress={() => void startGeneration()} disabled={isGenerating} style={[styles.button, isGenerating && styles.buttonDisabled]}><Text style={styles.buttonText}>{isGenerating ? 'Writing…' : 'Generate content'}</Text></Pressable>
    {result ? <View style={styles.result}>{result.captions.map((caption, index) => <View key={caption} style={styles.resultCard}><Text style={styles.resultLabel}>Instagram caption {index + 1}</Text><Text style={styles.resultText}>{caption}</Text></View>)}<View style={styles.resultCard}><Text style={styles.resultLabel}>TikTok hooks</Text><Text style={styles.resultText}>{result.hooks.join('\n\n')}</Text></View><View style={styles.resultCard}><Text style={styles.resultLabel}>Newsletter</Text><Text style={styles.resultText}>{result.newsletter}</Text></View><View style={styles.resultCard}><Text style={styles.resultLabel}>Hashtags</Text><Text style={styles.resultText}>{result.hashtags.join(' ')}</Text></View></View> : null}
    <Modal visible={showCreate} animationType="slide" transparent onRequestClose={() => setShowCreate(false)}><View style={styles.modalBackdrop}><View style={styles.modal}><Text style={styles.modalTitle}>New brand profile</Text>{[['name', 'Profile name'], ['productDetails', 'Product details'], ['audience', 'Audience'], ['voice', 'Voice']].map(([key, placeholder]) => <TextInput key={key} accessibilityLabel={placeholder} placeholder={placeholder} placeholderTextColor="#68718B" value={newProfile[key as keyof typeof newProfile]} onChangeText={(value) => setNewProfile((current) => ({ ...current, [key]: value }))} style={styles.input} multiline={key !== 'name'} />)}<View style={styles.modalActions}><Pressable onPress={() => setShowCreate(false)} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></Pressable><Pressable onPress={() => void addProfile()} style={styles.saveButton}><Text style={styles.buttonText}>Save profile</Text></Pressable></View></View></View></Modal>
  </ScrollView>;
}

const styles = StyleSheet.create({ container: { padding: 24, paddingTop: 64, backgroundColor: '#0B1020', flexGrow: 1 }, kicker: { color: '#9DAAFF', fontWeight: '700', letterSpacing: 1.6 }, title: { color: '#F7F8FF', fontSize: 32, fontWeight: '800', marginTop: 12 }, body: { color: '#A9B0C4', fontSize: 16, lineHeight: 24, marginTop: 14 }, label: { color: '#DDE2F4', fontWeight: '700', marginTop: 28, marginBottom: 10 }, profileRow: { gap: 8, paddingBottom: 4 }, profileChip: { minHeight: 44, paddingHorizontal: 16, borderRadius: 22, justifyContent: 'center', backgroundColor: '#151C31', borderWidth: 1, borderColor: '#2A3554' }, profileChipSelected: { backgroundColor: '#8B7CFF', borderColor: '#8B7CFF' }, profileChipText: { color: '#A9B0C4', fontWeight: '700' }, profileChipTextSelected: { color: '#FFFFFF' }, addChip: { minHeight: 44, paddingHorizontal: 16, borderRadius: 22, justifyContent: 'center', borderWidth: 1, borderColor: '#8B7CFF', borderStyle: 'dashed' }, addChipText: { color: '#B9B1FF', fontWeight: '700' }, profileCard: { marginTop: 16, padding: 16, borderRadius: 16, backgroundColor: '#11172A' }, profileTitle: { color: '#F7F8FF', fontSize: 17, fontWeight: '800' }, profileMeta: { color: '#8992AA', marginTop: 5 }, input: { minHeight: 48, marginTop: 12, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, color: '#F7F8FF', backgroundColor: '#151C31', borderWidth: 1, borderColor: '#2A3554' }, topicInput: { minHeight: 92, textAlignVertical: 'top', marginTop: 24 }, button: { minHeight: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#8B7CFF', marginTop: 20 }, buttonDisabled: { opacity: 0.65 }, buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' }, result: { marginTop: 24, gap: 12 }, resultCard: { padding: 16, borderRadius: 16, backgroundColor: '#11172A' }, resultLabel: { color: '#9DAAFF', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' }, resultText: { color: '#DDE2F4', fontSize: 15, lineHeight: 22, marginTop: 8 }, modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000099' }, modal: { padding: 24, paddingBottom: 36, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: '#0F1629' }, modalTitle: { color: '#F7F8FF', fontSize: 24, fontWeight: '800' }, modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 }, cancelButton: { flex: 1, minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#1A233B' }, cancelText: { color: '#A9B0C4', fontWeight: '700' }, saveButton: { flex: 1, minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#8B7CFF' } });
