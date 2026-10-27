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
- Friends and Public come from the backend (`../journ-al-be`); private pages never leave the device. Only pages set to Friends or Public are uploaded, and never their mood or feelings.
- Design reference: `../design_handoff_interactive_journal/`. Plan: `../docs/superpowers/plans/2026-10-08-interactive-journal-app.md`.

## Google sign-in

Users sign in with Google before onboarding (`src/auth`). The profile (id, name, email, photo) is kept in secure storage; the Google ID token stays in memory and is handed to `AuthGateway.exchange`, which is local-only until a backend exists.

Setup (Google Cloud Console, one project):
1. OAuth consent screen: configure it (External or Internal).
2. Credentials → create an **Android** OAuth client: package `com.luckyangelo.journal`, SHA-1 of the signing key (debug: `cd android && ./gradlew signingReport` after `npx expo prebuild`; EAS: `eas credentials`).
3. Credentials → create a **Web** OAuth client; copy its client ID.
4. Put it in `mobile/.env.local` as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<web client id>` (see `.env.example`).
5. Build a development client (`npx expo run:android`); Google sign-in does not work in Expo Go.

## Backend

1. Run `journ-al-be` (see its README: Neon database, R2 bucket, `.env`), `npm run dev` on port 3000.
2. In `mobile/.env.local` set `EXPO_PUBLIC_API_URL` (see `.env.example`) and `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`. The backend's `GOOGLE_WEB_CLIENT_ID` must be the same Web client ID.
3. Phone over USB: `adb reverse tcp:3000 tcp:3000` and use `http://localhost:3000`.
4. Restart Metro with `npx expo start --clear` after changing env vars.

How it works: signing in with Google sends the ID token to `POST /auth/google`; the returned app token is kept in secure storage and sent on every request. Saving a Friends/Public page uploads it (photos and voice notes first); a failed upload stays queued and retries when you sign in, reopen the app or save again. Flipping a page to Only me asks the server to delete it, and that request is kept until the server confirms. A different Google account signing in on the same phone does not inherit shared pages: they are made private locally first.

Friends: share your profile link from Me; friends paste it under Others' pages → Add a friend (or open the `journal://` link).
