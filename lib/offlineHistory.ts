import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';

export const historyKindSchema = z.enum(['repurpose', 'write', 'meeting']);
export const syncStateSchema = z.enum(['pending', 'synced', 'failed']);

export const historyItemSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  kind: historyKindSchema,
  title: z.string(),
  sourceUrl: z.string().nullable().optional(),
  input: z.record(z.unknown()).default({}),
  output: z.record(z.unknown()).default({}),
  isFavorite: z.boolean().default(false),
  syncState: syncStateSchema.default('pending'),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().optional(),
});

export type HistoryItem = z.infer<typeof historyItemSchema>;

const STORAGE_KEY = '@contentforge/history/v1';

async function readAll(): Promise<HistoryItem[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed = z.array(historyItemSchema).safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : [];
}

async function writeAll(items: HistoryItem[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export async function listHistory(options?: { query?: string; favoritesOnly?: boolean }) {
  const items = (await readAll()).filter((item) => !item.deletedAt);
  const query = options?.query?.trim().toLowerCase();
  return items
    .filter((item) => !options?.favoritesOnly || item.isFavorite)
    .filter((item) => !query || item.title.toLowerCase().includes(query) || JSON.stringify(item.output).toLowerCase().includes(query))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function saveHistoryItem(input: Omit<HistoryItem, 'updatedAt'> & { updatedAt?: string }) {
  const now = new Date().toISOString();
  const next = historyItemSchema.parse({ ...input, updatedAt: input.updatedAt ?? now });
  const items = await readAll();
  const index = items.findIndex((item) => item.clientId === next.clientId);
  if (index >= 0) items[index] = { ...items[index], ...next };
  else items.push(next);
  await writeAll(items);
  return next;
}

export async function toggleFavorite(clientId: string) {
  const items = await readAll();
  const index = items.findIndex((item) => item.clientId === clientId);
  if (index < 0) return null;
  items[index] = { ...items[index], isFavorite: !items[index].isFavorite, syncState: 'pending', updatedAt: new Date().toISOString() };
  await writeAll(items);
  return items[index];
}

export async function softDeleteHistoryItem(clientId: string) {
  const items = await readAll();
  const index = items.findIndex((item) => item.clientId === clientId);
  if (index < 0) return false;
  items[index] = { ...items[index], deletedAt: new Date().toISOString(), syncState: 'pending', updatedAt: new Date().toISOString() };
  await writeAll(items);
  return true;
}

export async function getPendingHistoryChanges() {
  return (await readAll()).filter((item) => item.syncState === 'pending' || item.syncState === 'failed');
}

export async function markHistorySynced(clientIds: string[]) {
  const ids = new Set(clientIds);
  const items = await readAll();
  await writeAll(items.map((item) => ids.has(item.clientId) ? { ...item, syncState: 'synced' } : item));
}

export async function clearDeletedHistory() {
  const items = await readAll();
  await writeAll(items.filter((item) => !item.deletedAt));
}
