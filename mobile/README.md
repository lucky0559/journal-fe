# Journal (React Native)

Android-first interactive journaling app. Expo + TypeScript + Expo Router.

```bash
npm install --legacy-peer-deps
npx expo start            # development client / Expo Go where supported
npx expo run:android      # native build (needed for camera, audio, notifications)
npm test                  # Jest (jest-expo + React Native Testing Library)
npm run typecheck
```

- `EXPO_PUBLIC_DEMO_DATA=1` (set in `.env.development`) seeds sample pages and shows "Reset demo data" in Me. Preview and production builds do not include it.
- Friends and Public are sample data until a backend exists; private pages never leave the device (`SharingGateway` is local-only).
- Design reference: `../design_handoff_interactive_journal/`. Plan: `../docs/superpowers/plans/2026-10-08-interactive-journal-app.md`.

## Google sign-in

Users sign in with Google before onboarding (`src/auth`). The profile (id, name, email, photo) is kept in secure storage; the Google ID token stays in memory and is handed to `AuthGateway.exchange`, which is local-only until a backend exists.

Setup (Google Cloud Console, one project):
1. OAuth consent screen: configure it (External or Internal).
2. Credentials → create an **Android** OAuth client: package `com.luckyangelo.journal`, SHA-1 of the signing key (debug: `cd android && ./gradlew signingReport` after `npx expo prebuild`; EAS: `eas credentials`).
3. Credentials → create a **Web** OAuth client; copy its client ID.
4. Put it in `mobile/.env.local` as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<web client id>` (see `.env.example`).
5. Build a development client (`npx expo run:android`); Google sign-in does not work in Expo Go.
