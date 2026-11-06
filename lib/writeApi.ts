import { z } from 'zod';
import type { BrandProfile } from './brandProfiles';
import { assertOnlineOrQueue } from './offlineQueue';

const writeResponseSchema = z.object({
  captions: z.array(z.string()).length(3),
  hooks: z.array(z.string()).length(3),
  newsletter: z.string(),
  hashtags: z.array(z.string()),
});

export type WriteResponse = z.infer<typeof writeResponseSchema>;

export async function generateWrite(input: { topic: string; profile: BrandProfile; signal?: AbortSignal }): Promise<WriteResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  const onAbort = () => controller.abort();
  input.signal?.addEventListener('abort', onAbort, { once: true });
  try {
    const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000';
    const requestBody = {
      topic: input.topic,
      brandProfile: {
        name: input.profile.name,
        productDetails: input.profile.productDetails,
        audience: input.profile.audience,
        voice: input.profile.voice,
      },
    };
    await assertOnlineOrQueue('/write', requestBody);
    const response = await fetch(`${baseUrl}/write`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    if (response.status === 429) throw new Error('You’ve reached today’s generation limit.');
    if (response.status === 402) throw new Error('Upgrade to Pro to keep generating.');
    if (!response.ok) throw new Error('We couldn’t create content right now. Please try again.');
    const parsed = writeResponseSchema.safeParse(await response.json());
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
