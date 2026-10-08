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
