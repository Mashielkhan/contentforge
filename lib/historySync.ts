import { getPendingHistoryChanges, markHistorySynced, saveHistoryItem, type HistoryItem } from './offlineHistory';
import { supabase } from './supabase';

export async function syncPendingHistory() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { synced: 0, skipped: true };

  const pending = await getPendingHistoryChanges();
  if (!pending.length) return { synced: 0, skipped: false };

  const rows = pending.map((item: HistoryItem) => ({
    user_id: user.id,
    client_id: item.clientId,
    kind: item.kind,
    title: item.title,
    source_url: item.sourceUrl ?? null,
    input_json: item.input,
    output_json: item.output,
    is_favorite: item.isFavorite,
    sync_state: 'synced',
    deleted_at: item.deletedAt ?? null,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  }));

  const { error } = await supabase.from('content_items').upsert(rows, { onConflict: 'user_id,client_id' });
  if (error) throw error;
  await markHistorySynced(pending.map((item) => item.clientId));
  return { synced: pending.length, skipped: false };
}

export async function hydrateHistoryFromSupabase() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { data, error } = await supabase.from('content_items').select('id,client_id,kind,title,source_url,input_json,output_json,is_favorite,sync_state,deleted_at,created_at,updated_at').eq('user_id', user.id).is('deleted_at', null).order('updated_at', { ascending: false });
  if (error) throw error;
  for (const row of data ?? []) {
    await saveHistoryItem({ id: row.id, clientId: row.client_id, kind: row.kind, title: row.title, sourceUrl: row.source_url, input: row.input_json, output: row.output_json, isFavorite: row.is_favorite, syncState: 'synced', createdAt: row.created_at, updatedAt: row.updated_at });
  }
  return data?.length ?? 0;
}
