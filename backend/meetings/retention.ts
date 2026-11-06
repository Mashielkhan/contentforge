import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

export async function purgeExpiredMeetingData() {
  const { data: expired, error } = await supabase.rpc('get_expired_meeting_records');
  if (error) throw error;
  const paths = (expired ?? []).map((item: { audio_storage_path: string | null }) => item.audio_storage_path).filter(Boolean) as string[];
  if (paths.length) {
    const { error: storageError } = await supabase.storage.from('meeting-audio').remove(paths);
    if (storageError) throw storageError;
  }
  const { error: deleteError } = await supabase.rpc('delete_expired_meeting_records');
  if (deleteError) throw deleteError;
  return { deleted: expired?.length ?? 0, deletedAudioFiles: paths.length };
}

if (process.argv[1]?.endsWith('retention.ts')) {
  purgeExpiredMeetingData().then((result) => console.log(JSON.stringify(result))).catch((error) => { console.error(error); process.exitCode = 1; });
}
