# ContentForge

ContentForge is a local-first Expo + React Native + TypeScript mobile app for micro-brands and creators. The initial scaffold uses Expo Router with four bottom tabs: Repurpose, Write, Meetings, and History.

## Current structure

```text
content forge/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   └── (tabs)/
│       ├── _layout.tsx
│       ├── repurpose.tsx
│       ├── write.tsx
│       ├── meetings.tsx
│       └── history.tsx
├── backend/
│   ├── supabase/
│   │   └── migrations/
│   │       └── 20261106000000_contentforge_initial.sql
│   ├── README.md
│   └── SUPABASE_SETUP.md
├── assets/                 # icons, splash artwork, fonts
├── components/             # shared UI primitives
├── constants/              # theme, copy, feature flags
├── lib/                    # Supabase client, API, auth, storage, sync
│   ├── historySync.ts
│   ├── offlineHistory.ts
│   └── supabase.ts
├── types/                  # shared TypeScript and Zod contracts
│   └── database.ts
├── .env.example
├── app.json
├── babel.config.js
├── package.json
└── tsconfig.json
```

## Local setup

1. Install Node.js LTS (which includes npm) from https://nodejs.org/ and reopen PowerShell. The current computer does not yet expose `node`, `npm`, `npx`, or `expo`.
2. From this directory, verify the tools:

   ```powershell
   node --version
   npm --version
   npx expo --version
   ```

3. Install the app dependencies:

   ```powershell
   npm install
   ```

4. Create local configuration:

   ```powershell
   Copy-Item .env.example .env
   ```

   Keep LLM and Supabase service-role secrets in `backend/.env`, never in `.env` values prefixed with `EXPO_PUBLIC_`.

5. Start the Expo development server:

   ```powershell
   npm run start
   ```

   Then press `a` for an Android emulator, `i` for an iOS simulator on macOS, or scan the QR code with Expo Go. Native iOS builds require macOS/Xcode; Android builds require Android Studio and an emulator/device.

6. Run the static check:

   ```powershell
   npm run typecheck
   ```

7. Start the local ContentForge API in a second PowerShell window:

   ```powershell
   npm run backend:dev
   ```

   It exposes `GET /health`, `POST /repurpose`, and `POST /write` on port 3000. Configure `LLM_API_KEY`, `LLM_API_URL`, and `LLM_MODEL` only in server environment variables. With `DEMO_MODE=true`, the app returns deterministic local content so the UI can be tested without an LLM key.

   If port 3000 is already in use, reuse the running backend or start this one on another port. In PowerShell, set `$env:PORT=3001` before running `npm run backend:dev`; update `EXPO_PUBLIC_API_BASE_URL` to use port 3001 as well.

   When using Expo Go on a physical phone, `EXPO_PUBLIC_API_BASE_URL` must use the computer's LAN IP rather than `localhost`. Keep both devices on the same Wi-Fi network. If the IP changes, update `.env.local` and restart Expo with:

   ```powershell
   npx expo start --clear
   ```

   Remote push notifications are not available in Expo Go on Android SDK 53+; use an EAS development build for that feature.

## Next implementation milestones

- Add onboarding, auth, settings, and paywall routes.
- Replace placeholder tabs with validated API flows and Zod response schemas.
- Add Supabase Auth, PostgreSQL migrations, RLS, and backend-only LLM calls.
- Add offline history persistence, share sheet intake, copy/share actions, haptics, skeletons, pull-to-refresh, accessibility labels, and RevenueCat.
- Add production app icon, splash assets, EAS configuration, and CI checks.

This is plain local development: no Manus-managed hosting, cloud sync, or managed app services have been configured.
