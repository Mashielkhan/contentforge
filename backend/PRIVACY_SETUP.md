# Privacy and retention setup

The `20261106020000_privacy_retention.sql` migration adds meeting retention preferences and `meeting_records`. Each user can enable or disable automatic deletion; when enabled, the retention window is fixed at 30 days.

The database function identifies expired meeting rows. The server-only worker in `backend/meetings/retention.ts` removes referenced files from the private `meeting-audio` Supabase Storage bucket, then deletes the expired records. Run it daily from a trusted scheduler with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; never expose the service-role key to the mobile app.

The mobile `Delete all my data` action calls the authenticated `delete_my_data()` RPC. It removes meeting records, content history, brand profiles, notification registrations, notification preferences, usage records, the app profile, and local cached data. It does not delete the Supabase Auth identity itself; account deletion remains a separate account-management action.

Apply the migration with:

```powershell
npx supabase db push --remote
```

A production deployment should run the retention worker at least once every 24 hours and log the count of deleted rows and audio files without logging transcript contents.
