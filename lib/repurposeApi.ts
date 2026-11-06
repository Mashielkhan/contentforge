import { z } from 'zod';
import { assertOnlineOrQueue } from './offlineQueue';

const repurposeResponseSchema = z.object({
  thread: z.array(z.object({
    text: z.string().max(280),
    label: z.string().optional(),
  })).length(5),
  linkedin: z.string(),
});

export type RepurposeResponse = z.infer<typeof repurposeResponseSchema>;

function getApiBaseUrl() {
  return process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000';
}

export function isHttpUrl(value: string) {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function generateRepurpose(input: { url: string; tone: string; signal?: AbortSignal }): Promise<RepurposeResponse> {
  if (!isHttpUrl(input.url)) throw new Error('Please share a valid http or https URL.');
  const requestBody = { url: input.url, tone: input.tone };
  await assertOnlineOrQueue('/repurpose', requestBody);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  const onAbort = () => controller.abort();
  input.signal?.addEventListener('abort', onAbort, { once: true });
  try {
    const response = await fetch(`${getApiBaseUrl()}/repurpose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    if (response.status === 429) throw new Error('You’ve reached today’s generation limit.');
    if (response.status === 402) throw new Error('Upgrade to Pro to keep generating.');
    if (!response.ok) throw new Error('We couldn’t read that page. It may be paywalled or unavailable.');
    const parsed = repurposeResponseSchema.safeParse(await response.json());
    if (!parsed.success) throw new Error('The generated response was incomplete. Please try again.');
    return parsed.data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new Error('Generation timed out. Check your connection and try again.');
    throw error;
  } finally {
    clearTimeout(timeout);
    input.signal?.removeEventListener('abort', onAbort);
  }
}
