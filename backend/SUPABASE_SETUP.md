# Supabase setup

Create a Supabase project, then install the local CLI and link the project. From the repository root:

```powershell
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

The migration creates profiles, brand profiles, generated content history, generation usage, indexes, an auth profile trigger, and row-level security. Every user-owned table requires `auth.uid()` to match its `user_id`; the client must never use a service-role key.

Set the following values in the app `.env`:

```text
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

The LLM provider key, Supabase service-role key, URL extraction, transcription, generation limits, and subscription entitlement checks belong in the backend environment only.

Offline history is stored in AsyncStorage under `@contentforge/history/v1`. Records carry a stable `clientId`, `syncState`, `updatedAt`, and optional tombstone `deletedAt`. The sync worker should upload pending records using `client_id` as the idempotency key, merge by newest `updated_at`, mark successful records as `synced`, and retain failed records for retry after connectivity returns. Do not physically remove tombstoned records until the server confirms deletion.
