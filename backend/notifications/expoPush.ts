export type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export async function sendExpoPush(messages: ExpoPushMessage[]) {
  if (!messages.length) return { data: [] };
  const response = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(messages),
  });
  if (!response.ok) throw new Error(`Expo Push API returned ${response.status}`);
  return response.json() as Promise<{ data: Array<{ status: string; id?: string; message?: string }> }>;
}

export async function notifyTranscriptionComplete(tokens: string[], meetingId: string) {
  return sendExpoPush(tokens.map((token) => ({
    to: token,
    title: 'Meeting summary ready',
    body: 'Your transcription, decisions, and action items are ready to review.',
    data: { url: `/(tabs)/meetings?meetingId=${encodeURIComponent(meetingId)}`, kind: 'transcription-complete', meetingId },
  })));
}
