export type ContentKind = 'repurpose' | 'write' | 'meeting';
export type SyncState = 'pending' | 'synced' | 'failed';

export type ContentItemRow = {
  id: string;
  user_id: string;
  client_id: string;
  kind: ContentKind;
  title: string;
  source_url: string | null;
  source_text: string | null;
  tone: string | null;
  input_json: Record<string, unknown>;
  output_json: Record<string, unknown>;
  is_favorite: boolean;
  sync_state: SyncState;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};
