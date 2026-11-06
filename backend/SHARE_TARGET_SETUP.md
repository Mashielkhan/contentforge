# Share target setup

ContentForge accepts shared text and URLs through `expo-share-intent`. The Expo config registers Android `text/*` intents and an iOS share extension for text, web URLs, and web pages.

This feature requires a native development build; Expo Go cannot load the native share extension. After installing dependencies, regenerate native projects and run a dev build:

```powershell
npx expo prebuild --clean
npx expo run:android
npx expo run:ios
```

On Android, open a browser, choose Share, select ContentForge, and the app should open Repurpose with the URL and begin generation. On iOS, use the system Share sheet, select ContentForge, and the extension forwards the URL to the main app.

The bridge routes to `/(tabs)/repurpose` with `sharedUrl` and `autoGenerate=1`. The Repurpose screen must call the backend `POST /repurpose` endpoint and validate the response as five thread items plus a LinkedIn post before rendering.
