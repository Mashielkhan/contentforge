import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';

export class OfflineQueuedError extends Error {
  constructor() {
    super('You’re offline. Your request was saved and will run when you’re back online.');
    this.name = 'OfflineQueuedError';
  }
}

type QueuedRequest = { id: string; path: string; body: Record<string, unknown>; createdAt: string };
const QUEUE_KEY = '@contentforge/offline/request-queue/v1';

function apiBaseUrl() {
  return process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000';
}

async function readQueue(): Promise<QueuedRequest[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as QueuedRequest[]; } catch { return []; }
}

async function writeQueue(queue: QueuedRequest[]) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function isCurrentlyOffline() {
  const state = await Network.getNetworkStateAsync();
  return state.isConnected === false || state.isInternetReachable === false;
}

export async function queueGenerationRequest(path: string, body: Record<string, unknown>) {
  const queue = await readQueue();
  queue.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, path, body, createdAt: new Date().toISOString() });
  await writeQueue(queue);
}

export async function assertOnlineOrQueue(path: string, body: Record<string, unknown>) {
  if (await isCurrentlyOffline()) {
    await queueGenerationRequest(path, body);
    throw new OfflineQueuedError();
  }
}

export async function pendingRequestCount() {
  return (await readQueue()).length;
}

export async function flushOfflineQueue() {
  if (await isCurrentlyOffline()) return { flushed: 0, remaining: await pendingRequestCount() };
  const queue = await readQueue();
  const remaining: QueuedRequest[] = [];
  let flushed = 0;
  for (const request of queue) {
    try {
      const response = await fetch(`${apiBaseUrl()}${request.path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request.body) });
      if (response.ok) flushed += 1;
      else remaining.push(request);
    } catch {
      remaining.push(request);
    }
  }
  await writeQueue(remaining);
  return { flushed, remaining: remaining.length };
}

export function subscribeToConnectivity(onOnline: () => void) {
  return Network.addNetworkStateListener((state) => {
    if (state.isConnected && state.isInternetReachable !== false) onOnline();
  });
}
