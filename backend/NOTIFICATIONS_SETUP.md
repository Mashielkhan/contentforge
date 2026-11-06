# Notifications setup

The app uses `expo-notifications` for remote push notifications and local daily reminders. Push registration stores each authenticated Expo token in `device_tokens`; the token is protected by RLS and is safe to use only through the authenticated app session.

Set `EXPO_PUBLIC_EAS_PROJECT_ID` in `.env` before building a native app. The value is the EAS project ID from the Expo project configuration. Push tokens are generated only on a physical device and require notification permission.

When the meetings backend finishes transcription and analysis, query that user’s active `device_tokens` and call the server-only helper:

```ts
import { notifyTranscriptionComplete } from './notifications/expoPush';
await notifyTranscriptionComplete(tokens, meetingId);
```

Do not put Expo Push API credentials, service-role keys, or LLM keys in the mobile bundle. The daily reminder is scheduled locally with the user’s selected hour and minute, so it can fire even while the app is closed. The server table stores the preference for account sync and future cross-device scheduling.

After applying the migration, rebuild the native app because the Expo Notifications config plugin changes native Android/iOS configuration:

```powershell
npx supabase db push --remote
npx expo prebuild --clean
npx expo run:android
```
