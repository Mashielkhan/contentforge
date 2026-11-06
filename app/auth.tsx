import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function AuthScreen() {
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signUp');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (!email.trim() || password.length < 6) return Alert.alert('Check your details', 'Use a valid email and a password with at least 6 characters.');
    setBusy(true);
    const response = mode === 'signUp' ? await supabase.auth.signUp({ email: email.trim(), password }) : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (response.error) return Alert.alert('Could not continue', response.error.message);
    if (mode === 'signUp' && !response.data.session) return Alert.alert('Check your email', 'Confirm your email address, then return to sign in.');
    router.replace('/(tabs)/repurpose');
  }
  return <View style={styles.container}><Text style={styles.kicker}>WELCOME TO CONTENTFORGE</Text><Text style={styles.title}>{mode === 'signUp' ? 'Build your content system.' : 'Welcome back.'}</Text><Text style={styles.body}>Your brand context and history stay connected across every workflow.</Text><TextInput accessibilityLabel="Email" autoCapitalize="none" keyboardType="email-address" placeholder="Email address" placeholderTextColor="#68718B" value={email} onChangeText={setEmail} style={styles.input} /><TextInput accessibilityLabel="Password" secureTextEntry placeholder="Password" placeholderTextColor="#68718B" value={password} onChangeText={setPassword} style={styles.input} /><Pressable accessibilityRole="button" onPress={() => void submit()} disabled={busy} style={styles.button}><Text style={styles.buttonText}>{busy ? 'Please wait…' : mode === 'signUp' ? 'Create account' : 'Sign in'}</Text></Pressable><Pressable accessibilityRole="button" onPress={() => setMode((value) => value === 'signUp' ? 'signIn' : 'signUp')} style={styles.switch}><Text style={styles.switchText}>{mode === 'signUp' ? 'Already have an account? Sign in' : 'New here? Create an account'}</Text></Pressable><Pressable accessibilityRole="button" onPress={() => router.replace('/(tabs)/repurpose')} style={styles.skip}><Text style={styles.skipText}>Continue without signing in</Text></Pressable></View>;
}

const styles = StyleSheet.create({ container: { flex: 1, padding: 28, paddingTop: 84, backgroundColor: '#0B1020' }, kicker: { color: '#9DAAFF', fontSize: 12, fontWeight: '700', letterSpacing: 1.4 }, title: { color: '#F7F8FF', fontSize: 36, lineHeight: 44, fontWeight: '800', marginTop: 16 }, body: { color: '#A9B0C4', fontSize: 16, lineHeight: 24, marginTop: 14, marginBottom: 28 }, input: { minHeight: 54, borderRadius: 15, paddingHorizontal: 16, marginTop: 12, color: '#F7F8FF', backgroundColor: '#151C31', borderWidth: 1, borderColor: '#2A3554' }, button: { minHeight: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#8B7CFF', marginTop: 20 }, buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' }, switch: { minHeight: 44, justifyContent: 'center', alignItems: 'center', marginTop: 10 }, switchText: { color: '#B9B1FF', fontWeight: '700' }, skip: { minHeight: 44, justifyContent: 'center', alignItems: 'center', marginTop: 18 }, skipText: { color: '#8992AA', fontWeight: '700' } });
