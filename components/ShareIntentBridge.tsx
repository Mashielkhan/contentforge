import { useEffect } from 'react';
import { router } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';

function extractUrl(text?: string | null) {
  if (!text) return null;
  const match = text.match(/https?:\/\/[^\s<>]+/i)?.[0]?.replace(/[),.;!?]+$/, '');
  return match ?? null;
}

export function ShareIntentBridge() {
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();

  useEffect(() => {
    if (!hasShareIntent) return;
    const url = shareIntent?.webUrl ?? extractUrl(shareIntent?.text);
    if (!url) {
      resetShareIntent();
      return;
    }
    router.replace({ pathname: '/(tabs)/repurpose', params: { sharedUrl: url, autoGenerate: '1' } });
    resetShareIntent();
  }, [hasShareIntent, resetShareIntent, shareIntent?.text, shareIntent?.webUrl]);

  return null;
}
