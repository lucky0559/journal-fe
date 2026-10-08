# Interactive Journal (Android, React Native) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Interactive Journal app: a warm, low-pressure journaling app with a mood check-in, swipeable prompts, scrapbook entries (text, photos, voice notes, stickers), a mood-coloured calendar timeline, per-page visibility, a friends/public feed, profiles, and an optional PIN lock.

**Architecture:** Expo (React Native) + TypeScript, file-based routing with Expo Router. Pure logic (mood colour, blob geometry, dates, calendar, draft reducer, PIN state machine, feed rules) lives in framework-free modules under `src/lib` / `src/domain` and is built test-first. Entries and settings persist in local SQLite behind small repository interfaces; the PIN lives only as a salted hash in secure storage. Friends/Public sharing is UI plus sample data in v1, behind a `SharingGateway` interface so a backend can be added later without touching screens.

**Tech Stack:** Expo SDK (the version `create-expo-app@latest` installs, currently 57), React Native, TypeScript (strict), Expo Router, Zustand, expo-sqlite, expo-secure-store, expo-crypto, expo-local-authentication, expo-notifications, expo-image-picker, expo-audio, expo-file-system, expo-print + expo-sharing, react-native-reanimated + react-native-gesture-handler, react-native-svg, lucide-react-native, `@expo-google-fonts/caprasimo` + `@expo-google-fonts/figtree`, Jest (`jest-expo`) + React Native Testing Library, `better-sqlite3` (test-only SQL adapter).

**Spec:** `design_handoff_interactive_journal/README.md` (tokens, screens, data model). Behavioural detail and seed copy come from the logic class in `design_handoff_interactive_journal/Journal Prototype.dc.html` (lines 390–687). The HTML files are references, not code to port.

## Global Constraints

- Platform: Android first; the codebase must stay iOS-compatible (Expo, no Android-only native code). Recommended stack from the spec: Expo + TypeScript.
- Fidelity: high. Colours, type, radii and spacing are final and come from the token list in the spec; port them once into `src/theme/tokens.ts` and never hard-code hex values in components.
- Colours: bg `#f5ead8` · surface `#ebddc5` · text `#201e1d` · divider = text at 16% alpha · accent `#c67139` · accent-2 (sage) `#7a8a5e`; full 100–900 ramps for accent, accent-2 and neutral are in the spec and copied verbatim in Task 1.
- Mood colour (0–100) = OKLCH mix of accent-2-600 → accent-500 where t = mood% (`color-mix(in oklch, accent-500 t%, accent-2-600)`).
- Paragraph-size text in accent uses accent-700, never the base accent.
- Type: headings Caprasimo 400 (display only); body Figtree 400/600/700.
- Radii: pills/buttons/inputs 999; cards 28; large containers 32; bottom sheets 32 top corners; photo tiles 22–26; FAB 22.
- Spacing: screen padding 22 horizontal; section gap 18–24; card padding 16–22; chip gap 8.
- Icons: Lucide, stroke-width 2.75, 16–22px.
- Hit targets ≥ 44px everywhere. Pressed state = one step darker on the accent ramp (600).
- Bottom nav: 76px, surface bg, items **Today · Timeline · Friends · Me**; hidden on Onboarding, Lock/PIN and Write. Extended FAB "New page" (60px tall) only on Today and Timeline, bottom-right 18px.
- Screen enter animation: fade + translateY 10→0, 300ms ease-out. Bottom sheets slide up 280ms `cubic-bezier(.3,.9,.4,1)` over a neutral-900 scrim at 35%.
- Copy uses the typographic apostrophe (`’`, U+2019) exactly as in the prototype (e.g. `Let’s begin`, `That’s not it. Try again.`).
- Private entries never leave the device. Flipping a page back to private must call `SharingGateway.unpublish`. The PIN is never stored or logged in plain text; the prototype's "your PIN is …" hint must not ship.
- TypeScript `strict: true`; no `any` in `src/`; imports through the `@/` alias for `src/`.

## Review Focus

Failure modes the spec implies but does not spell out, most likely first. Each has a pinning test in the task named in brackets.

- A page with only whitespace in the text and no media must not save and must show "Add a word, a photo, anything"; a page with only a sticker (or only a voice note) must save and render as "No words, just moments." [Task 7, Task 14]
- PIN pad: extra taps after 4 digits, backspace on an empty buffer, and mismatched confirmation must never leave the pad in a state the user can’t recover from; a wrong PIN clears the dots and shows the error; and an app-lock flag with no stored PIN (e.g. a restored backup) must never lock the user out. [Task 13]
- Permission denial or cancellation (photo picker cancelled, camera/microphone/notification permission denied) must be a no-op with a plain toast, never a crash or a half-added attachment; closing Write while recording discards the recording. [Task 17, Task 19]
- Calendar boundaries: Dec→Jan and Jan→Dec navigation, 28/29/30/31-day months, a month that starts on Sunday (Monday-first offset 6), future days disabled, and a day with several entries showing the average mood colour. [Task 4, Task 15]
- Visibility flips: saving a previously Friends/Public page as Private must call `unpublish`; Private pages must never reach `publish`; a failing gateway must not block the local save. [Task 6]
- Leaving Write with unsaved words or media must ask before discarding. [Task 16]

---

## File Structure

Project root for the app: `/Users/luckyangelo/Dev/journ-al/mobile/` (the repo root `/Users/luckyangelo/Dev/journ-al/` keeps `design_handoff_interactive_journal/` and `docs/`). Tests are colocated as `*.test.ts(x)`.

```
mobile/
  app/                                  # Expo Router routes (thin: compose features)
    _layout.tsx                         # fonts, db init, splash, providers, lock overlay, reminders sync
    index.tsx                           # start gate: onboarding | tabs
    onboarding.tsx
    pin.tsx                             # PIN set/confirm flow (?after=today|me)
    write.tsx                           # create/edit page (?entryId, ?prompt, ?date)
    (tabs)/_layout.tsx                  # Tabs with custom BottomNav + FAB
    (tabs)/index.tsx                    # Today
    (tabs)/timeline.tsx
    (tabs)/me.tsx
    (tabs)/friends/_layout.tsx          # Stack: feed + profile (nav stays visible)
    (tabs)/friends/index.tsx
    (tabs)/friends/[id].tsx
  src/
    theme/      tokens.ts  fonts.ts  type.ts
    lib/        oklch.ts  mood.ts  blob.ts  dates.ts  calendar.ts  slider.ts  pinMachine.ts  time.ts  id.ts
    config.ts   # DEMO_DATA flag
    domain/     types.ts  draft.ts  copy.ts  stickers.ts  prompts.ts  entrySummary.ts  visibility.ts  social.ts  profileCopy.ts  demoData.ts
    data/       db.ts  migrations.ts  entryRepo.ts  settingsRepo.ts  pinVault.ts  pinVaultInstance.ts  mediaStore.ts  sharing.ts  testDb.ts
    state/      settingsStore.ts  entriesStore.ts  socialStore.ts  toastStore.ts  lockStore.ts  checkinStore.ts  timelineStore.ts  index.ts
    services/   reminders.ts  useRemindersSync.ts  biometrics.ts  exporter.ts  photoPicker.ts
    ui/         Icon.tsx  Button.tsx  Chip.tsx  Segmented.tsx  Toggle.tsx  Toast.tsx  Sheet.tsx  ScreenFade.tsx  Screen.tsx
                Blob.tsx  MoodBlob.tsx  MoodSlider.tsx  PhotoTile.tsx  Avatar.tsx  EntryCard.tsx  BottomNav.tsx  Fab.tsx
    features/   today/ (deck.ts, CheckInCard, PromptDeck, TodayScreen)  timeline/  write/ (incl. useVoiceRecorder.ts)  friends/  me/  lock/  onboarding/
  jest.setup.ts
```

## Shared Contracts (names used by every task)

```ts
// src/domain/types.ts
export type Visibility = 'private' | 'friends' | 'public';
export interface Photo { id: string; uri: string; label?: string }      // uri '' = striped placeholder (demo data)
export interface Voice { id: string; uri: string; seconds: number }      // uri '' = demo voice note (silent)
export interface Entry {
  id: string; createdAt: number; date: string /* YYYY-MM-DD */; time: string /* '9:41 pm' */;
  mood: number /* 0-100 */; feelings: string[]; text: string; prompt: string; vis: Visibility;
  photos: Photo[]; voices: Voice[]; stickers: string[];
}
export interface Settings { name: string; remind: boolean; remindTime: string /* '9:00 pm' */; lockOn: boolean; onboarded: boolean }
export type FriendState = 'none' | 'requested' | 'friends';
export interface Person { id: string; name: string; initial: string; color: string; bio: string; friendState: FriendState }
export interface Post { id: string; authorId: string; when: string; vis: Visibility; prompt: string; text: string; photoLabel: string; hug: number; same: number }
```

Settings never contains the PIN; `pinVault` owns it.

---

### Task 1: Scaffold the Expo project, tooling and git

**Files:**
- Create: `/Users/luckyangelo/Dev/journ-al/mobile/` (via `create-expo-app`), `mobile/jest.setup.ts`, `mobile/tsconfig.json` (modify), `mobile/babel.config.js` (only if the template lacks one), `mobile/app.json` (modify)
- Test: `mobile/src/lib/smoke.test.ts` (deleted at the end of this task)

**Interfaces:**
- Produces: working `npm test`, `npx tsc --noEmit`, `@/` alias, Expo Router entry, every native dependency installed at the SDK-matching version.

- [ ] **Step 1: Make the journal folder its own git repo (sibling projects each have their own) and scaffold**

```bash
cd /Users/luckyangelo/Dev/journ-al
git init
npx create-expo-app@latest mobile --template blank-typescript
cd mobile
```

Expected: `mobile/` contains `App.tsx`, `app.json`, `package.json`, `tsconfig.json`.

- [ ] **Step 2: Install runtime dependencies with `expo install` (it picks SDK-compatible versions; do not pin by hand)**

```bash
npx expo install expo-router @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context expo-linking expo-constants expo-status-bar expo-splash-screen expo-font \
  react-native-reanimated react-native-worklets react-native-gesture-handler react-native-svg expo-linear-gradient \
  expo-sqlite expo-secure-store expo-crypto expo-local-authentication expo-notifications \
  expo-image-picker expo-image expo-audio expo-file-system expo-print expo-sharing expo-haptics \
  @expo-google-fonts/caprasimo @expo-google-fonts/figtree lucide-react-native zustand
```

Expected: no peer-dependency errors. If `expo install` reports that `react-native-worklets` is not needed for this SDK, drop it.

- [ ] **Step 3: Install test dependencies**

```bash
npm install --save-dev jest-expo jest @types/jest @testing-library/react-native better-sqlite3 @types/better-sqlite3
```

If `better-sqlite3` fails to build on this machine, install `sql.js` instead and adapt only `src/data/testDb.ts` (Task 4); nothing else depends on the choice.

- [ ] **Step 4: Point the app at Expo Router, set the scheme and Android identity**

Edit `mobile/package.json`: set `"main": "expo-router/entry"`, add scripts `"test": "jest"`, `"typecheck": "tsc --noEmit"`, and add:

```json
"jest": {
  "preset": "jest-expo",
  "setupFilesAfterEnv": ["<rootDir>/jest.setup.ts"],
  "moduleNameMapper": { "^@/(.*)$": "<rootDir>/src/$1" }
}
```

Edit `mobile/app.json` `expo` block to contain:

```json
{
  "name": "Journal",
  "slug": "journ-al",
  "scheme": "journal",
  "orientation": "portrait",
  "userInterfaceStyle": "light",
  "backgroundColor": "#f5ead8",
  "android": { "package": "com.luckyangelo.journal", "softwareKeyboardLayoutMode": "resize" },
  "plugins": [
    "expo-router",
    "expo-font",
    "expo-secure-store",
    ["expo-splash-screen", { "backgroundColor": "#f5ead8" }],
    ["expo-notifications", { "color": "#c67139" }],
    ["expo-image-picker", { "photosPermission": "Journal lets you attach photos to your pages.", "cameraPermission": "Journal lets you take a photo for a page." }],
    ["expo-audio", { "microphonePermission": "Journal records voice notes for your pages." }]
  ]
}
```

(Keep any other keys the template generated, e.g. `icon`. The package id is a default; change it before the first store build.)

- [ ] **Step 5: tsconfig and jest setup**

`mobile/tsconfig.json`:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

`mobile/jest.setup.ts`:

```ts
// Native modules are mocked per test file; this file only holds global test setup.
jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
```

Delete the template's `App.tsx` and `index.ts` (Expo Router replaces them) and create the folder `mobile/app/` with a placeholder-free minimal `app/_layout.tsx`:

```tsx
import { Slot } from 'expo-router';
export default function RootLayout() {
  return <Slot />;
}
```

and `app/index.tsx`:

```tsx
import { Text } from 'react-native';
export default function Index() {
  return <Text>Journal</Text>;
}
```

(Both files are rewritten in Task 10; they exist so the project boots.)

- [ ] **Step 6: Prove the toolchain runs (a failing test first, then a passing one)**

Create `mobile/src/lib/smoke.test.ts`:

```ts
import { colors } from '@/theme/tokens';

test('jest-expo toolchain and the @ alias resolve', () => {
  expect(colors.bg).toBe('#f5ead8');
});
```

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest src/lib/smoke.test.ts`
Expected: FAIL with "Cannot find module '@/theme/tokens'" (proves the alias is wired and the test runner works).

- [ ] **Step 7: Commit the scaffold (smoke test stays until Task 2 provides tokens)**

```bash
cd /Users/luckyangelo/Dev/journ-al
printf "node_modules/\n.expo/\ndist/\nandroid/\nios/\n*.log\n" > .gitignore
git add .gitignore design_handoff_interactive_journal docs mobile
git commit -m "chore: scaffold Expo Router TypeScript app and design handoff"
```

---

### Task 2: Design tokens and fonts

**Files:**
- Create: `mobile/src/theme/tokens.ts`, `mobile/src/theme/fonts.ts`, `mobile/src/theme/type.ts`
- Test: `mobile/src/theme/tokens.test.ts`
- Delete: `mobile/src/lib/smoke.test.ts`

**Interfaces:**
- Produces: `colors`, `ramp` (`ramp.accent[500]`, `ramp.accent2[600]`, `ramp.neutral[300]`), `radii`, `shadows`, `layout`, `fontFamily`, `heading(size, lineHeight?)`, `useAppFonts()`.

- [ ] **Step 1: Write the failing test**

`mobile/src/theme/tokens.test.ts`:

```ts
import { colors, ramp, radii, layout } from './tokens';

describe('tokens', () => {
  it('has the base palette from the design system', () => {
    expect(colors).toMatchObject({
      bg: '#f5ead8', surface: '#ebddc5', text: '#201e1d',
      accent: '#c67139', accent2: '#7a8a5e', divider: 'rgba(32,30,29,0.16)',
    });
  });

  it('has complete 100-900 ramps', () => {
    for (const r of [ramp.accent, ramp.accent2, ramp.neutral]) {
      expect(Object.keys(r).map(Number)).toEqual([100, 200, 300, 400, 500, 600, 700, 800, 900]);
    }
    expect(ramp.accent[500]).toBe('#d67f48');
    expect(ramp.accent2[600]).toBe('#728157');
    expect(ramp.neutral[300]).toBe('#dcd3c4');
  });

  it('exposes radii and layout constants', () => {
    expect(radii).toMatchObject({ pill: 999, card: 28, container: 32, sheet: 32, fab: 22 });
    expect(layout).toMatchObject({ screenPadding: 22, navHeight: 76, hitTarget: 44 });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest src/theme/tokens.test.ts`
Expected: FAIL "Cannot find module './tokens'".

- [ ] **Step 3: Implement tokens**

`mobile/src/theme/tokens.ts`:

```ts
import type { ViewStyle } from 'react-native';

export const ramp = {
  accent: {
    100: '#fff2eb', 200: '#ffe1d0', 300: '#ffc6a5', 400: '#f6a06b', 500: '#d67f48',
    600: '#b2622d', 700: '#8c491a', 800: '#643312', 900: '#402310',
  },
  accent2: {
    100: '#f0fae1', 200: '#e1eecc', 300: '#ccdbb2', 400: '#aebf92', 500: '#8fa073',
    600: '#728157', 700: '#56633f', 800: '#3d472b', 900: '#272e1b',
  },
  neutral: {
    100: '#f9f4ed', 200: '#eee7db', 300: '#dcd3c4', 400: '#c0b6a5', 500: '#a19786',
    600: '#82796a', 700: '#645c50', 800: '#474238', 900: '#2e2b25',
  },
} as const;

export const colors = {
  bg: '#f5ead8',
  surface: '#ebddc5',
  text: '#201e1d',
  divider: 'rgba(32,30,29,0.16)',
  accent: '#c67139',
  accent2: '#7a8a5e',
  scrim: 'rgba(46,43,37,0.35)', // neutral-900 at 35%
} as const;

export const radii = { pill: 999, card: 28, container: 32, sheet: 32, photo: 24, fab: 22 } as const;

export const layout = {
  screenPadding: 22,
  navHeight: 76,
  hitTarget: 44,
  fabHeight: 60,
  fabInset: 18,
} as const;

const shadow = (offsetY: number, radius: number, opacity: number, elevation: number): ViewStyle => ({
  shadowColor: ramp.neutral[900],
  shadowOffset: { width: 0, height: offsetY },
  shadowRadius: radius,
  shadowOpacity: opacity,
  elevation,
});

export const shadows = {
  sm: shadow(1, 2, 0.14, 1),
  md: shadow(3, 10, 0.16, 3),
  lg: shadow(12, 32, 0.22, 8),
} as const;
```

`mobile/src/theme/fonts.ts`:

```ts
import { useFonts } from 'expo-font';
import { Caprasimo_400Regular } from '@expo-google-fonts/caprasimo';
import { Figtree_400Regular, Figtree_600SemiBold, Figtree_700Bold } from '@expo-google-fonts/figtree';

export const fontFamily = {
  heading: 'Caprasimo_400Regular',
  body: 'Figtree_400Regular',
  semi: 'Figtree_600SemiBold',
  bold: 'Figtree_700Bold',
} as const;

export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({ Caprasimo_400Regular, Figtree_400Regular, Figtree_600SemiBold, Figtree_700Bold });
  return loaded || !!error; // never block the app forever on a font error
}
```

`mobile/src/theme/type.ts`:

```ts
import type { TextStyle } from 'react-native';
import { fontFamily } from './fonts';

/** Caprasimo display text. Screen titles use lineHeight 1.08–1.1 and letterSpacing -0.015em. */
export const heading = (size: number, lineHeight = 1.1): TextStyle => ({
  fontFamily: fontFamily.heading,
  fontSize: size,
  lineHeight: Math.round(size * lineHeight),
  letterSpacing: size >= 28 ? -0.015 * size : 0,
});

export const body = (size: number, weight: 'body' | 'semi' | 'bold' = 'body', lineHeight?: number): TextStyle => ({
  fontFamily: fontFamily[weight],
  fontSize: size,
  ...(lineHeight ? { lineHeight: Math.round(size * lineHeight) } : null),
});
```

- [ ] **Step 4: Run to verify it passes, then remove the smoke test**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && git rm -f src/lib/smoke.test.ts; npx jest src/theme && npx tsc --noEmit`
Expected: PASS (3 tests), tsc exits 0.

- [ ] **Step 5: Commit**

```bash
cd /Users/luckyangelo/Dev/journ-al
git add mobile
git commit -m "feat: add design tokens, fonts and type helpers"
```

---

### Task 3: Colour, mood and blob geometry (pure)

**Files:**
- Create: `mobile/src/lib/oklch.ts`, `mobile/src/lib/mood.ts`, `mobile/src/lib/blob.ts`, `mobile/src/lib/slider.ts`
- Test: `mobile/src/lib/oklch.test.ts`, `mobile/src/lib/mood.test.ts`, `mobile/src/lib/blob.test.ts`, `mobile/src/lib/slider.test.ts`

**Interfaces:**
- Consumes: `ramp` from `@/theme/tokens`.
- Produces:
  - `mixOklch(fromHex: string, toHex: string, t: number /*0..1 of toHex*/): string` → `#rrggbb`
  - `MOODS: ReadonlyArray<readonly [label: string, hint: string]>`, `moodIndex(v: number): 0|1|2|3|4`, `moodColor(v: number): string`, `moodRotation(v: number): number`, `moodRadii(v: number): Radii`
  - `type Radii = readonly [number, number, number, number, number, number, number, number]` (h TL,TR,BR,BL then v TL,TR,BR,BL, in percent), `parseRadii(css: string): Radii`, `blobPath(r: Radii, w: number, h?: number): string`
  - `valueFromX(x: number, width: number): number` (rounded 0..100)

React Native has no `color-mix` and no elliptical `borderRadius`, so mood colours are computed in JS (OKLCH) and blobs are drawn as SVG paths (Task 9).

- [ ] **Step 1: Write the failing tests**

`mobile/src/lib/oklch.test.ts`:

```ts
import { mixOklch, rgbToOklab, hexToRgb } from './oklch';

describe('mixOklch', () => {
  const sage = '#728157';
  const terracotta = '#d67f48';

  it('returns the endpoints exactly', () => {
    expect(mixOklch(sage, terracotta, 0)).toBe(sage);
    expect(mixOklch(sage, terracotta, 1)).toBe(terracotta);
  });

  it('always returns a lowercase 6-digit hex', () => {
    for (const t of [0.07, 0.25, 0.5, 0.73, 0.99]) {
      expect(mixOklch(sage, terracotta, t)).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('interpolates lightness between the endpoints', () => {
    const [l0] = rgbToOklab(hexToRgb(sage));
    const [l1] = rgbToOklab(hexToRgb(terracotta));
    const [lm] = rgbToOklab(hexToRgb(mixOklch(sage, terracotta, 0.5)));
    expect(lm).toBeGreaterThan(Math.min(l0, l1) - 0.02);
    expect(lm).toBeLessThan(Math.max(l0, l1) + 0.02);
  });

  it('clamps t outside 0..1', () => {
    expect(mixOklch(sage, terracotta, -3)).toBe(sage);
    expect(mixOklch(sage, terracotta, 7)).toBe(terracotta);
  });
});
```

`mobile/src/lib/mood.test.ts`:

```ts
import { MOODS, moodIndex, moodColor, moodRotation, moodRadii } from './mood';

describe('mood', () => {
  it('buckets 0-100 into five labels', () => {
    expect([0, 19, 20, 39, 40, 59, 60, 79, 80, 100].map(moodIndex)).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4]);
    expect(MOODS.map(([l]) => l)).toEqual(['Heavy', 'Low', 'Okay', 'Good', 'Bright']);
    expect(MOODS[2][1]).toBe('Somewhere in the middle');
    expect(MOODS[4][1]).toBe('Let’s catch this one');
  });

  it('maps mood 0 to sage-600 and 100 to accent-500', () => {
    expect(moodColor(0)).toBe('#728157');
    expect(moodColor(100)).toBe('#d67f48');
  });

  it('rotates from -12deg to +12deg', () => {
    expect(moodRotation(0)).toBe(-12);
    expect(moodRotation(50)).toBe(0);
    expect(moodRotation(100)).toBe(12);
  });

  it('interpolates blob radii between the droopy and lifted shapes', () => {
    expect(moodRadii(0)).toEqual([62, 38, 34, 66, 70, 44, 56, 30]);
    expect(moodRadii(100)).toEqual([44, 56, 58, 42, 40, 42, 58, 60]);
  });
});
```

`mobile/src/lib/blob.test.ts`:

```ts
import { parseRadii, blobPath } from './blob';

describe('blob', () => {
  it('parses a CSS elliptical radius string', () => {
    expect(parseRadii('58% 42% 38% 62% / 64% 46% 54% 36%')).toEqual([58, 42, 38, 62, 64, 46, 54, 36]);
  });

  it('treats a single value as a circle', () => {
    expect(parseRadii('50%')).toEqual([50, 50, 50, 50, 50, 50, 50, 50]);
  });

  it('draws a circle as four quarter arcs', () => {
    expect(blobPath([50, 50, 50, 50, 50, 50, 50, 50], 100)).toBe(
      'M50,0 L50,0 A50,50 0 0 1 100,50 L100,50 A50,50 0 0 1 50,100 L50,100 A50,50 0 0 1 0,50 L0,50 A50,50 0 0 1 50,0 Z',
    );
  });

  it('scales radii to the box size', () => {
    expect(blobPath([50, 50, 50, 50, 50, 50, 50, 50], 88)).toContain('M44,0');
  });

  it('shrinks radii that would overlap (CSS behaviour) instead of producing a broken path', () => {
    const p = blobPath([80, 80, 80, 80, 80, 80, 80, 80], 100);
    expect(p).not.toContain('NaN');
    expect(p).toContain('M50,0');
  });
});
```

`mobile/src/lib/slider.test.ts`:

```ts
import { valueFromX } from './slider';

describe('valueFromX', () => {
  it('maps position to a rounded 0-100 value', () => {
    expect(valueFromX(0, 200)).toBe(0);
    expect(valueFromX(100, 200)).toBe(50);
    expect(valueFromX(67, 200)).toBe(34);
  });
  it('clamps outside the track', () => {
    expect(valueFromX(-40, 200)).toBe(0);
    expect(valueFromX(999, 200)).toBe(100);
  });
  it('is safe before layout (width 0)', () => {
    expect(valueFromX(10, 0)).toBe(0);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest src/lib`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

`mobile/src/lib/oklch.ts`:

```ts
export type Rgb = readonly [number, number, number];
export type Lab = readonly [number, number, number];

export const hexToRgb = (hex: string): Rgb => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const toLinear = (c: number) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const fromLinear = (l: number) => {
  const s = l <= 0.0031308 ? 12.92 * l : 1.055 * l ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, s)) * 255);
};

/** sRGB (0-255) -> OKLab, using Björn Ottosson's matrices. */
export function rgbToOklab([r, g, b]: Rgb): Lab {
  const lr = toLinear(r), lg = toLinear(g), lb = toLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function oklabToRgb([L, a, b]: Lab): Rgb {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

const toHex = ([r, g, b]: Rgb) => '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');

/**
 * CSS `color-mix(in oklch, to t%, from)`: lightness and chroma interpolate linearly,
 * hue takes the shorter arc. `t` is the fraction of `toHex` (0..1).
 */
export function mixOklch(fromHex: string, toHex_: string, t: number): string {
  const k = Math.min(1, Math.max(0, t));
  if (k === 0) return fromHex.toLowerCase();
  if (k === 1) return toHex_.toLowerCase();
  const [L0, a0, b0] = rgbToOklab(hexToRgb(fromHex));
  const [L1, a1, b1] = rgbToOklab(hexToRgb(toHex_));
  const C0 = Math.hypot(a0, b0), C1 = Math.hypot(a1, b1);
  const h0 = Math.atan2(b0, a0), h1 = Math.atan2(b1, a1);
  let dh = h1 - h0;
  if (dh > Math.PI) dh -= 2 * Math.PI;
  if (dh < -Math.PI) dh += 2 * Math.PI;
  const L = L0 + (L1 - L0) * k;
  const C = C0 + (C1 - C0) * k;
  const h = h0 + dh * k;
  return toHex(oklabToRgb([L, C * Math.cos(h), C * Math.sin(h)]));
}
```

`mobile/src/lib/mood.ts`:

```ts
import { ramp } from '@/theme/tokens';
import { mixOklch } from './oklch';
import type { Radii } from './blob';

export const MOODS = [
  ['Heavy', 'Go easy tonight'],
  ['Low', 'That counts too'],
  ['Okay', 'Somewhere in the middle'],
  ['Good', 'Nice. Hold onto it'],
  ['Bright', 'Let’s catch this one'],
] as const;

export const moodIndex = (v: number): 0 | 1 | 2 | 3 | 4 => Math.min(4, Math.floor(v / 20.001)) as 0 | 1 | 2 | 3 | 4;

export const moodColor = (v: number): string => mixOklch(ramp.accent2[600], ramp.accent[500], v / 100);

export const moodRotation = (v: number): number => Math.round(-12 + v * 0.24);

const LO = [62, 38, 34, 66, 70, 44, 56, 30] as const; // droopy
const HI = [44, 56, 58, 42, 40, 42, 58, 60] as const; // lifted

export const moodRadii = (v: number): Radii =>
  LO.map((a, i) => Math.round(a + (HI[i] - a) * (v / 100))) as unknown as Radii;
```

`mobile/src/lib/blob.ts`:

```ts
/** 8 percentages: horizontal radii TL,TR,BR,BL then vertical radii TL,TR,BR,BL. */
export type Radii = readonly [number, number, number, number, number, number, number, number];

export function parseRadii(css: string): Radii {
  const [h, v] = css.split('/').map((s) => s.trim());
  const expand = (s: string): number[] => {
    const n = s.split(/\s+/).map((x) => parseFloat(x));
    if (n.length === 1) return [n[0], n[0], n[0], n[0]];
    if (n.length === 2) return [n[0], n[1], n[0], n[1]];
    if (n.length === 3) return [n[0], n[1], n[2], n[1]];
    return n.slice(0, 4);
  };
  const hs = expand(h);
  const vs = expand(v ?? h);
  return [...hs, ...vs] as unknown as Radii;
}

const r2 = (n: number) => +n.toFixed(2);

/** SVG path for a box with CSS-style elliptical corner radii. Overlapping radii scale down like CSS. */
export function blobPath(radii: Radii, w: number, h: number = w): string {
  const f = Math.min(1, 100 / (radii[0] + radii[1]), 100 / (radii[3] + radii[2]), 100 / (radii[4] + radii[7]), 100 / (radii[5] + radii[6]));
  const [htl, htr, hbr, hbl, vtl, vtr, vbr, vbl] = radii.map((x) => x * f);
  const X = (p: number) => r2((w * p) / 100);
  const Y = (p: number) => r2((h * p) / 100);
  const a = X(htl), b = X(htr), c = X(hbr), d = X(hbl);
  const e = Y(vtl), g = Y(vtr), i = Y(vbr), j = Y(vbl);
  return [
    `M${a},0`, `L${r2(w - b)},0`, `A${b},${g} 0 0 1 ${w},${g}`,
    `L${w},${r2(h - i)}`, `A${c},${i} 0 0 1 ${r2(w - c)},${h}`,
    `L${d},${h}`, `A${d},${j} 0 0 1 0,${r2(h - j)}`,
    `L0,${e}`, `A${a},${e} 0 0 1 ${a},0`, 'Z',
  ].join(' ');
}
```

(The 80%-each test scales by 100/160 = 0.625 → radii of 50, so the path starts `M50,0`.)

`mobile/src/lib/slider.ts`:

```ts
export const valueFromX = (x: number, width: number): number =>
  width <= 0 ? 0 : Math.round(Math.max(0, Math.min(100, (x / width) * 100)));
```

- [ ] **Step 4: Run to verify they pass**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest src/lib && npx tsc --noEmit`
Expected: PASS. If an endpoint equality fails by one hex digit, the round-trip is losing precision: keep the early returns for `k === 0` / `k === 1` (already present) rather than loosening the test.

- [ ] **Step 5: Commit**

```bash
cd /Users/luckyangelo/Dev/journ-al
git add mobile
git commit -m "feat: add OKLCH mood colour, blob geometry and slider math"
```

---

### Task 4: Dates, time labels and calendar grid (pure)

**Files:**
- Create: `mobile/src/domain/types.ts`, `mobile/src/lib/dates.ts`, `mobile/src/lib/time.ts`, `mobile/src/lib/calendar.ts`
- Test: `mobile/src/lib/dates.test.ts`, `mobile/src/lib/time.test.ts`, `mobile/src/lib/calendar.test.ts`

Dates are formatted by hand (no `Intl`) so output is identical on every device and in Jest.

**Interfaces:**
- Produces:
  - `MONTHS: string[]` (full names), `toIso(d: Date): string`, `todayIso(now?: Date): string`, `addDays(iso: string, n: number): string`, `fmtShort(iso): string` → `Thu, 8 Oct`, `fmtLong(iso): string` → `Thursday, 8 October`, `fmtTime(d: Date): string` → `9:41 pm`, `secs(n: number): string` → `0:38`, `greeting(hour: number): string`
  - `parseTimeLabel(label: string): { hour: number; minute: number }` (`'9:00 pm'` → 21:00)
  - `TIMES: string[]` = `['8:00 pm','9:00 pm','10:00 pm','11:00 pm']`
  - `interface DayCell { day: number; iso: string; future: boolean; today: boolean; count: number; avgMood: number | null }`
  - `monthGrid(year: number, month: number /*0-11*/, today: string, entries: Pick<Entry,'date'|'mood'>[]): { offset: number; days: DayCell[] }`
  - `shiftMonth(year: number, month: number, delta: 1 | -1): { year: number; month: number }`

- [ ] **Step 1: Write the failing tests**

`mobile/src/lib/dates.test.ts`:

```ts
import { toIso, todayIso, addDays, fmtShort, fmtLong, fmtTime, secs, greeting, MONTHS } from './dates';

describe('dates', () => {
  it('formats iso dates', () => {
    expect(fmtShort('2026-10-08')).toBe('Thu, 8 Oct');
    expect(fmtLong('2026-10-08')).toBe('Thursday, 8 October');
    expect(fmtShort('2026-01-01')).toBe('Thu, 1 Jan');
  });

  it('formats clock time as 12-hour lowercase', () => {
    expect(fmtTime(new Date(2026, 9, 8, 21, 41))).toBe('9:41 pm');
    expect(fmtTime(new Date(2026, 9, 8, 0, 5))).toBe('12:05 am');
    expect(fmtTime(new Date(2026, 9, 8, 12, 0))).toBe('12:00 pm');
    expect(fmtTime(new Date(2026, 9, 8, 13, 4))).toBe('1:04 pm');
  });

  it('formats voice durations', () => {
    expect(secs(38)).toBe('0:38');
    expect(secs(7)).toBe('0:07');
    expect(secs(125)).toBe('2:05');
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-10-08', -1)).toBe('2026-10-07');
    expect(addDays('2026-10-01', -1)).toBe('2026-09-30');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('builds today’s iso from a Date using local time', () => {
    expect(todayIso(new Date(2026, 9, 8, 23, 59))).toBe('2026-10-08');
    expect(toIso(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('greets by hour (small hours still count as the same evening)', () => {
    expect([3, 5, 11, 12, 17, 18, 23].map(greeting)).toEqual([
      'Good evening', 'Good morning', 'Good morning', 'Good afternoon', 'Good afternoon', 'Good evening', 'Good evening',
    ]);
  });

  it('lists month names', () => {
    expect(MONTHS[0]).toBe('January');
    expect(MONTHS).toHaveLength(12);
  });
});
```

`mobile/src/lib/time.test.ts`:

```ts
import { parseTimeLabel, TIMES } from './time';

describe('parseTimeLabel', () => {
  it('converts 12-hour labels to 24-hour', () => {
    expect(parseTimeLabel('9:00 pm')).toEqual({ hour: 21, minute: 0 });
    expect(parseTimeLabel('8:00 pm')).toEqual({ hour: 20, minute: 0 });
    expect(parseTimeLabel('12:00 am')).toEqual({ hour: 0, minute: 0 });
    expect(parseTimeLabel('12:30 pm')).toEqual({ hour: 12, minute: 30 });
    expect(parseTimeLabel('7:05 am')).toEqual({ hour: 7, minute: 5 });
  });
  it('exposes the four onboarding choices', () => {
    expect(TIMES).toEqual(['8:00 pm', '9:00 pm', '10:00 pm', '11:00 pm']);
  });
  it('falls back to 9:00 pm for a corrupt label instead of throwing', () => {
    expect(parseTimeLabel('banana')).toEqual({ hour: 21, minute: 0 });
  });
});
```

`mobile/src/lib/calendar.test.ts`:

```ts
import { monthGrid, shiftMonth } from './calendar';

const e = (date: string, mood: number) => ({ date, mood });

describe('monthGrid', () => {
  it('uses a Monday-first offset (Oct 2026 starts on Thursday)', () => {
    const g = monthGrid(2026, 9, '2026-10-08', []);
    expect(g.offset).toBe(3);
    expect(g.days).toHaveLength(31);
  });

  it('handles a month that starts on Sunday (offset 6) and a 30-day month', () => {
    const g = monthGrid(2026, 10, '2026-10-08', []); // Nov 1 2026 is a Sunday
    expect(g.offset).toBe(6);
    expect(g.days).toHaveLength(30);
  });

  it('handles Feb in a leap year and a non-leap year', () => {
    expect(monthGrid(2028, 1, '2028-02-10', []).days).toHaveLength(29);
    expect(monthGrid(2028, 1, '2028-02-10', []).offset).toBe(1);
    expect(monthGrid(2027, 1, '2027-02-10', []).days).toHaveLength(28);
    expect(monthGrid(2027, 1, '2027-02-10', []).offset).toBe(0);
  });

  it('flags today and disables future days', () => {
    const { days } = monthGrid(2026, 9, '2026-10-08', []);
    expect(days[7]).toMatchObject({ day: 8, today: true, future: false });
    expect(days[8]).toMatchObject({ day: 9, today: false, future: true });
  });

  it('averages the mood of several entries on one day', () => {
    const { days } = monthGrid(2026, 9, '2026-10-08', [e('2026-10-07', 40), e('2026-10-07', 80), e('2026-10-06', 28)]);
    expect(days[6]).toMatchObject({ count: 2, avgMood: 60 });
    expect(days[5]).toMatchObject({ count: 1, avgMood: 28 });
    expect(days[0]).toMatchObject({ count: 0, avgMood: null });
  });

  it('ignores entries from other months', () => {
    const { days } = monthGrid(2026, 9, '2026-10-08', [e('2026-09-28', 18)]);
    expect(days.every((d) => d.count === 0)).toBe(true);
  });
});

describe('shiftMonth', () => {
  it('wraps December to January and back', () => {
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, month: 0 });
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, month: 11 });
    expect(shiftMonth(2026, 9, -1)).toEqual({ year: 2026, month: 8 });
  });
});
```

(Dates used: Nov 1 2026 is a Sunday — Oct 8 2026 is a Thursday, +24 days to Nov 1 = Sunday. Feb 1 2028 is a Tuesday; Feb 1 2027 is a Monday.)

- [ ] **Step 2: Run to verify they fail**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest src/lib/dates.test.ts src/lib/time.test.ts src/lib/calendar.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

`mobile/src/lib/dates.ts`:

```ts
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const pad = (n: number) => String(n).padStart(2, '0');

/** Noon avoids DST edge cases when only the calendar date matters. */
export const isoToDate = (iso: string) => new Date(`${iso}T12:00:00`);
export const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayIso = (now: Date = new Date()) => toIso(now);

export function addDays(iso: string, n: number): string {
  const d = isoToDate(iso);
  d.setDate(d.getDate() + n);
  return toIso(d);
}

export function fmtShort(iso: string): string {
  const d = isoToDate(iso);
  return `${WEEKDAYS[d.getDay()].slice(0, 3)}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

export function fmtLong(iso: string): string {
  const d = isoToDate(iso);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function fmtTime(d: Date): string {
  const h = d.getHours() % 12 || 12;
  return `${h}:${pad(d.getMinutes())} ${d.getHours() < 12 ? 'am' : 'pm'}`;
}

export const secs = (n: number) => `${Math.floor(n / 60)}:${pad(n % 60)}`;

export function greeting(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 18) return 'Good afternoon';
  return 'Good evening';
}
```

`mobile/src/lib/time.ts`:

```ts
export const TIMES = ['8:00 pm', '9:00 pm', '10:00 pm', '11:00 pm'];

export function parseTimeLabel(label: string): { hour: number; minute: number } {
  const m = /^(\d{1,2}):(\d{2})\s*(am|pm)$/i.exec(label.trim());
  if (!m) return { hour: 21, minute: 0 };
  let hour = parseInt(m[1], 10) % 12;
  if (m[3].toLowerCase() === 'pm') hour += 12;
  return { hour, minute: parseInt(m[2], 10) };
}
```

`mobile/src/lib/calendar.ts`:

```ts
import type { Entry } from '@/domain/types';

export interface DayCell {
  day: number; iso: string; future: boolean; today: boolean; count: number; avgMood: number | null;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function monthGrid(
  year: number, month: number, today: string, entries: Pick<Entry, 'date' | 'mood'>[],
): { offset: number; days: DayCell[] } {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const dim = new Date(year, month + 1, 0).getDate();
  const byDate = new Map<string, number[]>();
  for (const e of entries) byDate.set(e.date, [...(byDate.get(e.date) ?? []), e.mood]);
  const days: DayCell[] = [];
  for (let day = 1; day <= dim; day++) {
    const iso = `${year}-${pad(month + 1)}-${pad(day)}`;
    const moods = byDate.get(iso) ?? [];
    days.push({
      day, iso, future: iso > today, today: iso === today, count: moods.length,
      avgMood: moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : null,
    });
  }
  return { offset, days };
}

export function shiftMonth(year: number, month: number, delta: 1 | -1): { year: number; month: number } {
  const m = month + delta;
  if (m < 0) return { year: year - 1, month: 11 };
  if (m > 11) return { year: year + 1, month: 0 };
  return { year, month: m };
}
```

`calendar.ts` imports `Entry`, so create `mobile/src/domain/types.ts` first in this task by copying the "Shared Contracts" code block above verbatim (it has no logic, so it needs no test of its own).

- [ ] **Step 4: Run to verify they pass**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest src/lib && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/luckyangelo/Dev/journ-al
git add mobile
git commit -m "feat: add date, time-label and calendar-grid utilities"
```

### Task 5: SQLite persistence (entries and settings)

**Files:**
- Create: `mobile/src/data/db.ts`, `mobile/src/data/migrations.ts`, `mobile/src/data/entryRepo.ts`, `mobile/src/data/settingsRepo.ts`, `mobile/src/data/testDb.ts`
- Test: `mobile/src/data/entryRepo.test.ts`, `mobile/src/data/settingsRepo.test.ts`

**Interfaces:**
- Consumes: `Entry`, `Settings` from `@/domain/types`.
- Produces:
  - `interface Db { execAsync(sql: string): Promise<void>; runAsync(sql: string, ...p: SqlValue[]): Promise<unknown>; getAllAsync<T>(sql: string, ...p: SqlValue[]): Promise<T[]>; getFirstAsync<T>(sql: string, ...p: SqlValue[]): Promise<T | null> }` where `type SqlValue = string | number | null`
  - `openDb(): Promise<Db>` (opens `journal.db`, runs `migrate`)
  - `migrate(db: Db): Promise<void>` (idempotent, uses `PRAGMA user_version`)
  - `interface EntryRepo { list(): Promise<Entry[]>; upsert(e: Entry): Promise<void>; replaceAll(es: Entry[]): Promise<void> }`, `createEntryRepo(db: Db): EntryRepo` (list is ordered date DESC, createdAt DESC)
  - `interface SettingsRepo { load(): Promise<Settings>; save(patch: Partial<Settings>): Promise<void> }`, `createSettingsRepo(db: Db): SettingsRepo`, `DEFAULT_SETTINGS: Settings`
  - `createTestDb(): Db` (in-memory, test-only)

Attachments are stored as JSON columns on the entry row (no separate tables; nothing queries inside them).

- [ ] **Step 1: Write the failing tests**

`mobile/src/data/entryRepo.test.ts`:

```ts
/** @jest-environment node */
import type { Entry } from '@/domain/types';
import { createTestDb } from './testDb';
import { migrate } from './migrations';
import { createEntryRepo } from './entryRepo';

const entry = (over: Partial<Entry> = {}): Entry => ({
  id: 'a', createdAt: 1000, date: '2026-10-07', time: '10:02 pm', mood: 72, feelings: ['calm'],
  text: 'hi', prompt: '', vis: 'private', photos: [], voices: [], stickers: [], ...over,
});

async function setup() {
  const db = createTestDb();
  await migrate(db);
  return { db, repo: createEntryRepo(db) };
}

describe('entryRepo', () => {
  it('round-trips an entry with attachments and awkward text', async () => {
    const { repo } = await setup();
    const e = entry({
      text: `It’s "fine"; DROP TABLE entries; -- 🙂\nline two`,
      photos: [{ id: 'p1', uri: 'file:///x.jpg' }, { id: 'p2', uri: '', label: 'photo · river' }],
      voices: [{ id: 'v1', uri: 'file:///v.m4a', seconds: 38 }],
      stickers: ['cozy', 'calm'], vis: 'friends', prompt: 'Who did you feel close to today?',
    });
    await repo.upsert(e);
    expect(await repo.list()).toEqual([e]);
  });

  it('orders by date desc then createdAt desc', async () => {
    const { repo } = await setup();
    await repo.upsert(entry({ id: 'old', date: '2026-09-01' }));
    await repo.upsert(entry({ id: 'a', date: '2026-10-07', createdAt: 1 }));
    await repo.upsert(entry({ id: 'b', date: '2026-10-07', createdAt: 2 }));
    expect((await repo.list()).map((e) => e.id)).toEqual(['b', 'a', 'old']);
  });

  it('upsert replaces instead of duplicating', async () => {
    const { repo } = await setup();
    await repo.upsert(entry({ text: 'one' }));
    await repo.upsert(entry({ text: 'two' }));
    const list = await repo.list();
    expect(list).toHaveLength(1);
    expect(list[0].text).toBe('two');
  });

  it('replaceAll swaps the whole set', async () => {
    const { repo } = await setup();
    await repo.upsert(entry({ id: 'x' }));
    await repo.replaceAll([entry({ id: 'y' }), entry({ id: 'z', date: '2026-10-08' })]);
    expect((await repo.list()).map((e) => e.id)).toEqual(['z', 'y']);
  });

  it('survives a corrupt JSON column instead of throwing', async () => {
    const { db, repo } = await setup();
    await db.runAsync(
      `INSERT INTO entries (id, created_at, date, time, mood, feelings, text, prompt, vis, photos, voices, stickers)
       VALUES ('bad', 1, '2026-10-07', '9:00 pm', 50, 'not json', 'x', '', 'private', '[', '', 'null')`,
    );
    const [e] = await repo.list();
    expect(e).toMatchObject({ id: 'bad', feelings: [], photos: [], voices: [], stickers: [] });
  });

  it('migrate is idempotent', async () => {
    const { db } = await setup();
    await expect(migrate(db)).resolves.toBeUndefined();
  });
});
```

`mobile/src/data/settingsRepo.test.ts`:

```ts
/** @jest-environment node */
import { createTestDb } from './testDb';
import { migrate } from './migrations';
import { createSettingsRepo, DEFAULT_SETTINGS } from './settingsRepo';

describe('settingsRepo', () => {
  async function setup() {
    const db = createTestDb();
    await migrate(db);
    return createSettingsRepo(db);
  }

  it('returns defaults on a fresh database', async () => {
    expect(await (await setup()).load()).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS).toEqual({ name: '', remind: true, remindTime: '9:00 pm', lockOn: false, onboarded: false });
  });

  it('persists partial updates and keeps other keys', async () => {
    const repo = await setup();
    await repo.save({ name: 'Maya', onboarded: true });
    await repo.save({ remind: false });
    expect(await repo.load()).toEqual({ ...DEFAULT_SETTINGS, name: 'Maya', onboarded: true, remind: false });
  });

  it('falls back to the default for a corrupt value', async () => {
    const db = createTestDb();
    await migrate(db);
    await db.runAsync(`INSERT INTO settings (key, value) VALUES ('remind', '{oops')`);
    expect((await createSettingsRepo(db).load()).remind).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest src/data`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

`mobile/src/data/db.ts`:

```ts
import * as SQLite from 'expo-sqlite';
import { migrate } from './migrations';

export type SqlValue = string | number | null;

export interface Db {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: SqlValue[]): Promise<unknown>;
  getAllAsync<T>(sql: string, ...params: SqlValue[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, ...params: SqlValue[]): Promise<T | null>;
}

export async function openDb(): Promise<Db> {
  const db = await SQLite.openDatabaseAsync('journal.db');
  await migrate(db);
  return db;
}
```

If TypeScript rejects `SQLiteDatabase` as a `Db` (overload mismatch), wrap it in a small adapter object here; do not loosen the `Db` interface, the repos and tests depend on it.

`mobile/src/data/migrations.ts`:

```ts
import type { Db } from './db';

const MIGRATIONS: string[] = [
  `CREATE TABLE IF NOT EXISTS entries (
     id TEXT PRIMARY KEY NOT NULL,
     created_at INTEGER NOT NULL,
     date TEXT NOT NULL,
     time TEXT NOT NULL,
     mood INTEGER NOT NULL,
     feelings TEXT NOT NULL DEFAULT '[]',
     text TEXT NOT NULL DEFAULT '',
     prompt TEXT NOT NULL DEFAULT '',
     vis TEXT NOT NULL DEFAULT 'private',
     photos TEXT NOT NULL DEFAULT '[]',
     voices TEXT NOT NULL DEFAULT '[]',
     stickers TEXT NOT NULL DEFAULT '[]'
   );
   CREATE INDEX IF NOT EXISTS entries_date ON entries (date DESC, created_at DESC);
   CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);`,
];

export async function migrate(db: Db): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  for (let v = row?.user_version ?? 0; v < MIGRATIONS.length; v++) {
    await db.execAsync(MIGRATIONS[v]);
    await db.execAsync(`PRAGMA user_version = ${v + 1}`);
  }
}
```

`mobile/src/data/entryRepo.ts`:

```ts
import type { Entry, Visibility } from '@/domain/types';
import type { Db } from './db';

interface Row {
  id: string; created_at: number; date: string; time: string; mood: number; feelings: string;
  text: string; prompt: string; vis: string; photos: string; voices: string; stickers: string;
}

function parse<T>(s: string, fallback: T): T {
  try {
    const v = JSON.parse(s);
    return Array.isArray(fallback) && !Array.isArray(v) ? fallback : (v as T);
  } catch {
    return fallback;
  }
}

const toEntry = (r: Row): Entry => ({
  id: r.id, createdAt: r.created_at, date: r.date, time: r.time, mood: r.mood,
  feelings: parse(r.feelings, []), text: r.text, prompt: r.prompt, vis: r.vis as Visibility,
  photos: parse(r.photos, []), voices: parse(r.voices, []), stickers: parse(r.stickers, []),
});

export interface EntryRepo {
  list(): Promise<Entry[]>;
  upsert(e: Entry): Promise<void>;
  replaceAll(es: Entry[]): Promise<void>;
}

const UPSERT = `INSERT OR REPLACE INTO entries
  (id, created_at, date, time, mood, feelings, text, prompt, vis, photos, voices, stickers)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`;

const params = (e: Entry) => [
  e.id, e.createdAt, e.date, e.time, e.mood, JSON.stringify(e.feelings), e.text, e.prompt, e.vis,
  JSON.stringify(e.photos), JSON.stringify(e.voices), JSON.stringify(e.stickers),
];

export function createEntryRepo(db: Db): EntryRepo {
  return {
    async list() {
      const rows = await db.getAllAsync<Row>('SELECT * FROM entries ORDER BY date DESC, created_at DESC');
      return rows.map(toEntry);
    },
    async upsert(e) {
      await db.runAsync(UPSERT, ...params(e));
    },
    async replaceAll(es) {
      await db.execAsync('BEGIN');
      try {
        await db.execAsync('DELETE FROM entries');
        for (const e of es) await db.runAsync(UPSERT, ...params(e));
        await db.execAsync('COMMIT');
      } catch (err) {
        await db.execAsync('ROLLBACK');
        throw err;
      }
    },
  };
}
```

`mobile/src/data/settingsRepo.ts`:

```ts
import type { Settings } from '@/domain/types';
import type { Db } from './db';

export const DEFAULT_SETTINGS: Settings = { name: '', remind: true, remindTime: '9:00 pm', lockOn: false, onboarded: false };

export interface SettingsRepo {
  load(): Promise<Settings>;
  save(patch: Partial<Settings>): Promise<void>;
}

export function createSettingsRepo(db: Db): SettingsRepo {
  return {
    async load() {
      const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
      const out: Record<string, unknown> = { ...DEFAULT_SETTINGS };
      for (const { key, value } of rows) {
        if (!(key in DEFAULT_SETTINGS)) continue;
        try {
          const v = JSON.parse(value);
          if (typeof v === typeof (DEFAULT_SETTINGS as unknown as Record<string, unknown>)[key]) out[key] = v;
        } catch {
          /* keep default */
        }
      }
      return out as unknown as Settings;
    },
    async save(patch) {
      for (const [k, v] of Object.entries(patch)) {
        await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', k, JSON.stringify(v));
      }
    },
  };
}
```

`mobile/src/data/testDb.ts` (test-only; never import from app code):

```ts
import Database from 'better-sqlite3';
import type { Db, SqlValue } from './db';

export function createTestDb(): Db {
  const d = new Database(':memory:');
  return {
    execAsync: async (sql) => { d.exec(sql); },
    runAsync: async (sql, ...p: SqlValue[]) => d.prepare(sql).run(...p),
    getAllAsync: async <T,>(sql: string, ...p: SqlValue[]) => d.prepare(sql).all(...p) as T[],
    getFirstAsync: async <T,>(sql: string, ...p: SqlValue[]) => (d.prepare(sql).get(...p) as T | undefined) ?? null,
  };
}
```

- [ ] **Step 4: Run to verify they pass**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest src/data && npx tsc --noEmit`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/luckyangelo/Dev/journ-al
git add mobile
git commit -m "feat: add SQLite persistence for entries and settings"
```

---

### Task 6: State stores and the sharing gateway

**Files:**
- Create: `mobile/src/data/sharing.ts`, `mobile/src/state/entriesStore.ts`, `mobile/src/state/settingsStore.ts`, `mobile/src/state/toastStore.ts`, `mobile/src/state/lockStore.ts`, `mobile/src/state/checkinStore.ts`, `mobile/src/state/timelineStore.ts`, `mobile/src/state/index.ts`, `mobile/src/config.ts`
- Test: `mobile/src/state/entriesStore.test.ts`, `mobile/src/state/settingsStore.test.ts`, `mobile/src/state/toastStore.test.ts`

**Interfaces:**
- Consumes: `EntryRepo`, `SettingsRepo`, `DEFAULT_SETTINGS`, `openDb`, `createEntryRepo`, `createSettingsRepo`.
- Produces:
  - `interface SharingGateway { publish(e: Entry): Promise<void>; unpublish(entryId: string): Promise<void> }`, `localOnlyGateway: SharingGateway`
  - `sortEntries(es: Entry[]): Entry[]`, `createEntriesStore(getRepo: () => EntryRepo, gateway: SharingGateway)` → zustand hook with `{ entries: Entry[]; loaded: boolean; load(): Promise<void>; save(e: Entry): Promise<void>; replaceAll(es: Entry[]): Promise<void> }`
  - `createSettingsStore(getRepo: () => SettingsRepo)` → hook with `{ settings: Settings; loaded: boolean; load(): Promise<void>; update(patch: Partial<Settings>): Promise<void> }`
  - `useToast`: `{ message: string; show(msg: string): void }` (auto-clears after 1900 ms)
  - `useLock`: `{ locked: boolean; lock(): void; unlock(): void }`
  - `useCheckin`: `{ mood: number; feelings: string[]; setMood(v: number): void; toggleFeeling(name: string): void }` (default `mood: 62`, `feelings: []`)
  - `useTimelineUi`: `{ mode: 'cal' | 'list'; year: number; month: number; selDay: string; setMode(m): void; select(iso: string): void; shift(delta: 1 | -1): void; reset(today: string): void }`
  - singletons from `state/index.ts`: `useEntries`, `useSettings`, `bootstrapState(): Promise<void>`
  - `DEMO_DATA: boolean` from `config.ts` (`process.env.EXPO_PUBLIC_DEMO_DATA === '1'`)

- [ ] **Step 1: Write the failing tests**

`mobile/src/state/entriesStore.test.ts`:

```ts
/** @jest-environment node */
import type { Entry } from '@/domain/types';
import type { EntryRepo } from '@/data/entryRepo';
import type { SharingGateway } from '@/data/sharing';
import { createEntriesStore, sortEntries } from './entriesStore';

const entry = (over: Partial<Entry> = {}): Entry => ({
  id: 'a', createdAt: 1, date: '2026-10-07', time: '9:00 pm', mood: 50, feelings: [], text: 'x', prompt: '',
  vis: 'private', photos: [], voices: [], stickers: [], ...over,
});

function setup(gatewayOverrides: Partial<SharingGateway> = {}) {
  const saved = new Map<string, Entry>();
  const repo: EntryRepo = {
    list: async () => [...saved.values()],
    upsert: async (e) => { saved.set(e.id, e); },
    replaceAll: async (es) => { saved.clear(); es.forEach((e) => saved.set(e.id, e)); },
  };
  const gateway = { publish: jest.fn(async () => {}), unpublish: jest.fn(async () => {}), ...gatewayOverrides };
  const useStore = createEntriesStore(() => repo, gateway);
  return { useStore, gateway, saved };
}

describe('entriesStore', () => {
  it('sorts by date desc then createdAt desc', () => {
    const out = sortEntries([entry({ id: 'a', date: '2026-10-01' }), entry({ id: 'b', date: '2026-10-07', createdAt: 1 }), entry({ id: 'c', date: '2026-10-07', createdAt: 2 })]);
    expect(out.map((e) => e.id)).toEqual(['c', 'b', 'a']);
  });

  it('saves locally and keeps the list sorted and de-duplicated', async () => {
    const { useStore } = setup();
    await useStore.getState().save(entry({ id: 'a', text: 'one' }));
    await useStore.getState().save(entry({ id: 'a', text: 'two' }));
    expect(useStore.getState().entries).toHaveLength(1);
    expect(useStore.getState().entries[0].text).toBe('two');
  });

  it('never publishes or unpublishes a brand-new private page', async () => {
    const { useStore, gateway } = setup();
    await useStore.getState().save(entry({ vis: 'private' }));
    expect(gateway.publish).not.toHaveBeenCalled();
    expect(gateway.unpublish).not.toHaveBeenCalled();
  });

  it('publishes friends and public pages', async () => {
    const { useStore, gateway } = setup();
    await useStore.getState().save(entry({ id: 'f', vis: 'friends' }));
    await useStore.getState().save(entry({ id: 'p', vis: 'public' }));
    expect(gateway.publish).toHaveBeenCalledTimes(2);
  });

  it('unpublishes when a shared page is flipped back to private, and never publishes it again', async () => {
    const { useStore, gateway } = setup();
    await useStore.getState().save(entry({ vis: 'public' }));
    (gateway.publish as jest.Mock).mockClear();
    await useStore.getState().save(entry({ vis: 'private' }));
    expect(gateway.unpublish).toHaveBeenCalledWith('a');
    expect(gateway.publish).not.toHaveBeenCalled();
  });

  it('keeps the local save when the gateway fails', async () => {
    const { useStore, saved } = setup({ publish: async () => { throw new Error('offline'); } });
    await expect(useStore.getState().save(entry({ vis: 'public' }))).resolves.toBeUndefined();
    expect(saved.get('a')).toBeDefined();
    expect(useStore.getState().entries).toHaveLength(1);
  });

  it('loads from the repo', async () => {
    const { useStore, saved } = setup();
    saved.set('z', entry({ id: 'z' }));
    await useStore.getState().load();
    expect(useStore.getState()).toMatchObject({ loaded: true });
    expect(useStore.getState().entries.map((e) => e.id)).toEqual(['z']);
  });
});
```

`mobile/src/state/settingsStore.test.ts`:

```ts
/** @jest-environment node */
import { DEFAULT_SETTINGS, type SettingsRepo } from '@/data/settingsRepo';
import { createSettingsStore } from './settingsStore';

it('loads, then updates optimistically and persists', async () => {
  let stored = { ...DEFAULT_SETTINGS, name: 'Maya' };
  const repo: SettingsRepo = { load: async () => stored, save: async (p) => { stored = { ...stored, ...p }; } };
  const useStore = createSettingsStore(() => repo);
  await useStore.getState().load();
  expect(useStore.getState().settings.name).toBe('Maya');
  const p = useStore.getState().update({ remindTime: '10:00 pm' });
  expect(useStore.getState().settings.remindTime).toBe('10:00 pm');
  await p;
  expect(stored.remindTime).toBe('10:00 pm');
});
```

`mobile/src/state/toastStore.test.ts`:

```ts
import { useToast } from './toastStore';

afterEach(() => { jest.clearAllTimers(); useToast.setState({ message: '' }); });

it('shows a message and clears it after 1.9s', () => {
  useToast.getState().show('Saved');
  expect(useToast.getState().message).toBe('Saved');
  jest.advanceTimersByTime(1899);
  expect(useToast.getState().message).toBe('Saved');
  jest.advanceTimersByTime(2);
  expect(useToast.getState().message).toBe('');
});

it('a newer toast restarts the timer', () => {
  useToast.getState().show('one');
  jest.advanceTimersByTime(1500);
  useToast.getState().show('two');
  jest.advanceTimersByTime(1500);
  expect(useToast.getState().message).toBe('two');
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest src/state`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

`mobile/src/data/sharing.ts`:

```ts
import type { Entry } from '@/domain/types';

/** Boundary for the future backend. v1 ships local-only: nothing leaves the device. */
export interface SharingGateway {
  publish(entry: Entry): Promise<void>;
  unpublish(entryId: string): Promise<void>;
}

export const localOnlyGateway: SharingGateway = {
  publish: async () => {},
  unpublish: async () => {},
};
```

`mobile/src/state/entriesStore.ts`:

```ts
import { create } from 'zustand';
import type { Entry } from '@/domain/types';
import type { EntryRepo } from '@/data/entryRepo';
import type { SharingGateway } from '@/data/sharing';

export const sortEntries = (es: Entry[]): Entry[] =>
  [...es].sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1));

export interface EntriesState {
  entries: Entry[];
  loaded: boolean;
  load(): Promise<void>;
  save(e: Entry): Promise<void>;
  replaceAll(es: Entry[]): Promise<void>;
}

export function createEntriesStore(getRepo: () => EntryRepo, gateway: SharingGateway) {
  return create<EntriesState>()((set, get) => ({
    entries: [],
    loaded: false,
    async load() {
      set({ entries: sortEntries(await getRepo().list()), loaded: true });
    },
    async save(entry) {
      const previous = get().entries.find((e) => e.id === entry.id);
      await getRepo().upsert(entry);
      set({ entries: sortEntries([entry, ...get().entries.filter((e) => e.id !== entry.id)]) });
      try {
        if (entry.vis === 'private') {
          if (previous && previous.vis !== 'private') await gateway.unpublish(entry.id);
        } else {
          await gateway.publish(entry);
        }
      } catch {
        // Sharing is best-effort; the local page is already saved.
      }
    },
    async replaceAll(es) {
      const shared = get().entries.filter((e) => e.vis !== 'private');
      await getRepo().replaceAll(es);
      set({ entries: sortEntries(es) });
      await Promise.allSettled(shared.map((e) => gateway.unpublish(e.id)));
    },
  }));
}
```

`mobile/src/state/settingsStore.ts`:

```ts
import { create } from 'zustand';
import type { Settings } from '@/domain/types';
import { DEFAULT_SETTINGS, type SettingsRepo } from '@/data/settingsRepo';

export interface SettingsState {
  settings: Settings;
  loaded: boolean;
  load(): Promise<void>;
  update(patch: Partial<Settings>): Promise<void>;
}

export function createSettingsStore(getRepo: () => SettingsRepo) {
  return create<SettingsState>()((set, get) => ({
    settings: DEFAULT_SETTINGS,
    loaded: false,
    async load() {
      set({ settings: await getRepo().load(), loaded: true });
    },
    async update(patch) {
      set({ settings: { ...get().settings, ...patch } });
      await getRepo().save(patch);
    },
  }));
}
```

`mobile/src/state/toastStore.ts`:

```ts
import { create } from 'zustand';

let timer: ReturnType<typeof setTimeout> | undefined;

export const useToast = create<{ message: string; show(msg: string): void }>()((set) => ({
  message: '',
  show(msg) {
    set({ message: msg });
    clearTimeout(timer);
    timer = setTimeout(() => set({ message: '' }), 1900);
  },
}));
```

`mobile/src/state/lockStore.ts`:

```ts
import { create } from 'zustand';

export const useLock = create<{ locked: boolean; lock(): void; unlock(): void }>()((set) => ({
  locked: false,
  lock: () => set({ locked: true }),
  unlock: () => set({ locked: false }),
}));
```

`mobile/src/state/checkinStore.ts`:

```ts
import { create } from 'zustand';

interface CheckinState {
  mood: number;
  feelings: string[];
  setMood(v: number): void;
  toggleFeeling(name: string): void;
}

export const useCheckin = create<CheckinState>()((set) => ({
  mood: 62,
  feelings: [],
  setMood: (mood) => set({ mood }),
  toggleFeeling: (name) =>
    set((s) => ({ feelings: s.feelings.includes(name) ? s.feelings.filter((f) => f !== name) : [...s.feelings, name] })),
}));
```

`mobile/src/state/timelineStore.ts`:

```ts
import { create } from 'zustand';
import { shiftMonth } from '@/lib/calendar';
import { todayIso } from '@/lib/dates';

interface TimelineUi {
  mode: 'cal' | 'list';
  year: number;
  month: number;
  selDay: string;
  setMode(m: 'cal' | 'list'): void;
  select(iso: string): void;
  shift(delta: 1 | -1): void;
  reset(today: string): void;
}

const init = (iso: string) => ({ year: +iso.slice(0, 4), month: +iso.slice(5, 7) - 1, selDay: iso });

export const useTimelineUi = create<TimelineUi>()((set) => ({
  mode: 'cal',
  ...init(todayIso()),
  setMode: (mode) => set({ mode }),
  select: (selDay) => set({ selDay }),
  shift: (delta) => set((s) => shiftMonth(s.year, s.month, delta)),
  reset: (today) => set(init(today)),
}));
```

`mobile/src/config.ts`:

```ts
/** Demo data (sample pages + "Reset demo data" row) is development-only. Set EXPO_PUBLIC_DEMO_DATA=1 in .env.development. */
export const DEMO_DATA = process.env.EXPO_PUBLIC_DEMO_DATA === '1';
```

`mobile/src/state/index.ts` (singletons; the only file that touches the real database):

```ts
import { openDb, type Db } from '@/data/db';
import { createEntryRepo } from '@/data/entryRepo';
import { createSettingsRepo } from '@/data/settingsRepo';
import { localOnlyGateway } from '@/data/sharing';
import { createEntriesStore } from './entriesStore';
import { createSettingsStore } from './settingsStore';
import { useLock } from './lockStore';

let db: Db | null = null;
const need = (): Db => {
  if (!db) throw new Error('bootstrapState() has not finished');
  return db;
};

export const useEntries = createEntriesStore(() => createEntryRepo(need()), localOnlyGateway);
export const useSettings = createSettingsStore(() => createSettingsRepo(need()));

export async function bootstrapState(): Promise<void> {
  db = await openDb();
  await Promise.all([useSettings.getState().load(), useEntries.getState().load()]);
  const { lockOn, onboarded } = useSettings.getState().settings;
  if (lockOn && onboarded) useLock.getState().lock();
}
```

(Demo seeding is added to `bootstrapState` in Task 8 once `demoEntries` exists.)

- [ ] **Step 4: Run to verify they pass**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest src/state && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/luckyangelo/Dev/journ-al
git add mobile
git commit -m "feat: add state stores and local-only sharing gateway"
```

---

### Task 7: Page drafts, validation and copy (pure)

**Files:**
- Create: `mobile/src/domain/draft.ts`, `mobile/src/domain/copy.ts`, `mobile/src/domain/stickers.ts`, `mobile/src/domain/prompts.ts`, `mobile/src/domain/entrySummary.ts`, `mobile/src/domain/visibility.ts`
- Test: `mobile/src/domain/draft.test.ts`, `mobile/src/domain/entrySummary.test.ts`

**Interfaces:**
- Consumes: `Entry`, `Photo`, `Voice`, `Visibility`; `fmtTime`, `fmtShort`, `secs`; `moodIndex`, `moodColor`, `MOODS`.
- Produces:
  - `newDraft(o: { id: string; now: Date; mood: number; feelings?: string[]; date?: string; prompt?: string }): Entry`
  - `editDraft(e: Entry): Entry` (deep-copies the arrays)
  - `type DraftAction = { type: 'text'; value: string } | { type: 'mood'; value: number } | { type: 'vis'; value: Visibility } | { type: 'clearPrompt' } | { type: 'addPhoto'; photo: Photo } | { type: 'removePhoto'; id: string } | { type: 'addVoice'; voice: Voice } | { type: 'removeVoice'; id: string } | { type: 'addSticker'; name: string } | { type: 'removeSticker'; index: number }`
  - `draftReducer(d: Entry, a: DraftAction): Entry`, `hasContent(d: Entry): boolean`, `isDirty(current: Entry, original: Entry): boolean`
  - `defaultDateForNewPage(o: { route: 'today' | 'timeline'; mode: 'cal' | 'list'; selDay: string; today: string; selDayHasEntries: boolean }): string`
  - `addedUris(original: Entry | null, current: Entry): string[]`, `orphanedUris(original: Entry | null, saved: Entry): string[]`
  - copy: `COPY.emptySave = 'Add a word, a photo, anything'`, `COPY.emptyBody = 'No words, just moments.'`, `COPY.writePlaceholder = 'Start anywhere. One word is enough.'`, `saveToast(d: Entry, today: string): string`
  - `STICKERS: ReadonlyArray<{ name: string; bg: string; ink: string }>` (8 stickers in prototype order), `blobFor(name: string): Radii`, `tiltFor(name: string): number`
  - `PROMPTS: string[]` (6), `promptFor(n: number, moodIdx: number): string`
  - `summarizeEntry(e: Entry): { color: string; dateLabel: string; time: string; moodLabel: string; text: string; meta: string; visLabel: string /* '' when private */; visBg: string; visFg: string }`
  - `VIS: Record<Visibility, { label; desc; icon: 'lock'|'users'|'globe'; bg; fg; border; iconBg; iconFg }>`, `VIS_ORDER`, `VIS_FOOTNOTE`

- [ ] **Step 1: Write the failing tests**

`mobile/src/domain/draft.test.ts`:

```ts
import type { Entry } from './types';
import {
  newDraft, editDraft, draftReducer, hasContent, isDirty, defaultDateForNewPage, addedUris, orphanedUris,
} from './draft';
import { saveToast, COPY } from './copy';
import { STICKERS, blobFor, tiltFor } from './stickers';
import { PROMPTS, promptFor } from './prompts';

const now = new Date(2026, 9, 8, 21, 41);
const base = () => newDraft({ id: 'd1', now, mood: 62 });

describe('newDraft', () => {
  it('starts private, empty, stamped with the current date and time', () => {
    expect(base()).toEqual({
      id: 'd1', createdAt: now.getTime(), date: '2026-10-08', time: '9:41 pm', mood: 62, feelings: [], text: '',
      prompt: '', vis: 'private', photos: [], voices: [], stickers: [],
    });
  });
  it('accepts a prompt, a back-dated day and carried-over feelings', () => {
    const d = newDraft({ id: 'd', now, mood: 30, date: '2026-10-03', prompt: 'Hi?', feelings: ['tired'] });
    expect(d).toMatchObject({ date: '2026-10-03', prompt: 'Hi?', feelings: ['tired'], mood: 30 });
  });
});

describe('draftReducer', () => {
  it('edits text, mood, visibility and prompt', () => {
    let d = base();
    d = draftReducer(d, { type: 'text', value: 'hello' });
    d = draftReducer(d, { type: 'mood', value: 10 });
    d = draftReducer(d, { type: 'vis', value: 'friends' });
    expect(d).toMatchObject({ text: 'hello', mood: 10, vis: 'friends' });
    d = { ...d, prompt: 'p' };
    expect(draftReducer(d, { type: 'clearPrompt' }).prompt).toBe('');
  });

  it('adds and removes photos, voices and stickers', () => {
    let d = base();
    d = draftReducer(d, { type: 'addPhoto', photo: { id: 'p1', uri: 'file:///1.jpg' } });
    d = draftReducer(d, { type: 'addPhoto', photo: { id: 'p2', uri: 'file:///2.jpg' } });
    d = draftReducer(d, { type: 'addVoice', voice: { id: 'v1', uri: 'file:///v.m4a', seconds: 7 } });
    d = draftReducer(d, { type: 'addSticker', name: 'calm' });
    d = draftReducer(d, { type: 'addSticker', name: 'calm' });
    expect(d.photos).toHaveLength(2);
    expect(d.stickers).toEqual(['calm', 'calm']);
    d = draftReducer(d, { type: 'removePhoto', id: 'p1' });
    d = draftReducer(d, { type: 'removeVoice', id: 'v1' });
    d = draftReducer(d, { type: 'removeSticker', index: 0 });
    expect(d.photos.map((p) => p.id)).toEqual(['p2']);
    expect(d.voices).toEqual([]);
    expect(d.stickers).toEqual(['calm']);
  });

  it('never mutates the previous draft', () => {
    const d = base();
    const next = draftReducer(d, { type: 'addSticker', name: 'cozy' });
    expect(d.stickers).toEqual([]);
    expect(next).not.toBe(d);
  });
});

describe('hasContent', () => {
  it('rejects empty and whitespace-only pages', () => {
    expect(hasContent(base())).toBe(false);
    expect(hasContent({ ...base(), text: '   \n\t ' })).toBe(false);
  });
  it('accepts words, or any single kind of media', () => {
    expect(hasContent({ ...base(), text: 'a' })).toBe(true);
    expect(hasContent({ ...base(), stickers: ['calm'] })).toBe(true);
    expect(hasContent({ ...base(), voices: [{ id: 'v', uri: '', seconds: 1 }] })).toBe(true);
    expect(hasContent({ ...base(), photos: [{ id: 'p', uri: '' }] })).toBe(true);
  });
  it('does not count a prompt or mood alone as content', () => {
    expect(hasContent({ ...base(), prompt: 'Who?', mood: 99 })).toBe(false);
  });
});

describe('isDirty', () => {
  it('is false for an untouched draft and true after any edit', () => {
    const d = base();
    expect(isDirty(d, d)).toBe(false);
    expect(isDirty(draftReducer(d, { type: 'text', value: 'x' }), d)).toBe(true);
    expect(isDirty(draftReducer(d, { type: 'mood', value: 1 }), d)).toBe(true);
  });
  it('is false after editing back to the original text', () => {
    const d = base();
    const edited = draftReducer(draftReducer(d, { type: 'text', value: 'x' }), { type: 'text', value: '' });
    expect(isDirty(edited, d)).toBe(false);
  });
});

describe('editDraft', () => {
  it('copies arrays so edits cannot leak into the stored entry', () => {
    const e: Entry = { ...base(), stickers: ['calm'] };
    const d = editDraft(e);
    d.stickers.push('x');
    expect(e.stickers).toEqual(['calm']);
  });
});

describe('defaultDateForNewPage', () => {
  const o = { route: 'timeline' as const, mode: 'cal' as const, selDay: '2026-10-03', today: '2026-10-08', selDayHasEntries: false };
  it('uses the selected empty past day on the calendar', () => {
    expect(defaultDateForNewPage(o)).toBe('2026-10-03');
  });
  it('falls back to today otherwise', () => {
    expect(defaultDateForNewPage({ ...o, route: 'today' })).toBe('2026-10-08');
    expect(defaultDateForNewPage({ ...o, mode: 'list' })).toBe('2026-10-08');
    expect(defaultDateForNewPage({ ...o, selDayHasEntries: true })).toBe('2026-10-08');
    expect(defaultDateForNewPage({ ...o, selDay: '2026-10-20' })).toBe('2026-10-08');
  });
});

describe('media bookkeeping', () => {
  const original: Entry = {
    ...base(), photos: [{ id: 'a', uri: 'file:///a.jpg' }], voices: [{ id: 'v', uri: 'file:///v.m4a', seconds: 3 }],
  };
  it('lists uris added during an editing session (to delete on discard)', () => {
    const current = draftReducer(original, { type: 'addPhoto', photo: { id: 'b', uri: 'file:///b.jpg' } });
    expect(addedUris(original, current)).toEqual(['file:///b.jpg']);
    expect(addedUris(null, current).sort()).toEqual(['file:///a.jpg', 'file:///b.jpg', 'file:///v.m4a']);
  });
  it('lists uris removed from an existing page (to delete on save)', () => {
    const saved = draftReducer(original, { type: 'removePhoto', id: 'a' });
    expect(orphanedUris(original, saved)).toEqual(['file:///a.jpg']);
    expect(orphanedUris(null, saved)).toEqual([]);
  });
  it('ignores placeholder media with an empty uri', () => {
    const seeded = { ...original, photos: [{ id: 'x', uri: '', label: 'photo · river' }] };
    expect(addedUris(null, seeded)).not.toContain('');
  });
});

describe('saveToast', () => {
  const d = base();
  it('names today’s page and the audience', () => {
    expect(saveToast(d, '2026-10-08')).toBe('Saved to today’s page');
    expect(saveToast({ ...d, vis: 'friends' }, '2026-10-08')).toBe('Saved to today’s page · shared with friends');
    expect(saveToast({ ...d, vis: 'public' }, '2026-10-08')).toBe('Saved to today’s page · public');
  });
  it('uses a plain message for other days', () => {
    expect(saveToast({ ...d, date: '2026-10-03' }, '2026-10-08')).toBe('Saved');
    expect(saveToast({ ...d, date: '2026-10-03', vis: 'public' }, '2026-10-08')).toBe('Saved · public');
  });
  it('has the exact empty-save copy', () => {
    expect(COPY.emptySave).toBe('Add a word, a photo, anything');
  });
});

describe('stickers and prompts', () => {
  it('has the eight stickers in order', () => {
    expect(STICKERS.map((s) => s.name)).toEqual(['calm', 'cozy', 'proud', 'tired', 'grateful', 'rainy', 'brave', 'meh']);
  });
  it('gives each sticker a stable blob and tilt', () => {
    expect(blobFor('calm')).toEqual(blobFor('calm'));
    expect([-6, 0, 6]).toContain(tiltFor('calm'));
    expect(tiltFor('calm')).toBe(tiltFor('calm'));
  });
  it('offsets the prompt order by mood bucket and wraps', () => {
    expect(PROMPTS).toHaveLength(6);
    expect(promptFor(0, 0)).toBe(PROMPTS[0]);
    expect(promptFor(0, 2)).toBe(PROMPTS[2]);
    expect(promptFor(5, 2)).toBe(PROMPTS[1]);
  });
});
```

`mobile/src/domain/entrySummary.test.ts`:

```ts
import type { Entry } from './types';
import { summarizeEntry } from './entrySummary';
import { VIS, VIS_ORDER, VIS_FOOTNOTE } from './visibility';

const e = (over: Partial<Entry>): Entry => ({
  id: 'a', createdAt: 1, date: '2026-10-03', time: '6:12 pm', mood: 84, feelings: [], text: 'Found a bench.',
  prompt: '', vis: 'public', photos: [], voices: [], stickers: [], ...over,
});

describe('summarizeEntry', () => {
  it('builds the meta line from photos, voice and stickers', () => {
    const s = summarizeEntry(e({
      photos: [{ id: '1', uri: '' }, { id: '2', uri: '' }],
      voices: [{ id: 'v', uri: '', seconds: 38 }], stickers: ['cozy'],
    }));
    expect(s.meta).toBe('2 photos · voice 0:38 · cozy');
  });
  it('singularises one photo and joins several stickers', () => {
    expect(summarizeEntry(e({ photos: [{ id: '1', uri: '' }] })).meta).toBe('1 photo');
    expect(summarizeEntry(e({ stickers: ['calm', 'proud'] })).meta).toBe('calm, proud');
  });
  it('shows "No words, just moments." for a page without text', () => {
    expect(summarizeEntry(e({ text: '', stickers: ['calm'] })).text).toBe('No words, just moments.');
    expect(summarizeEntry(e({ text: '   ', stickers: ['calm'] })).text).toBe('No words, just moments.');
  });
  it('labels date, mood and visibility', () => {
    const s = summarizeEntry(e({}));
    expect(s).toMatchObject({ dateLabel: 'Sat, 3 Oct', time: '6:12 pm', moodLabel: 'Bright', visLabel: 'Public' });
    expect(summarizeEntry(e({ vis: 'private' })).visLabel).toBe('');
    expect(summarizeEntry(e({ vis: 'friends' })).visLabel).toBe('Friends');
  });
  it('exposes the three visibility options with their copy', () => {
    expect(VIS_ORDER).toEqual(['private', 'friends', 'public']);
    expect(VIS.private.desc).toBe('Stays on this phone, behind your lock.');
    expect(VIS.friends.desc).toBe('People you’ve added can read it in their feed.');
    expect(VIS.public.desc).toBe('Anyone with your profile link can read it, photos and voice notes included.');
    expect(VIS_FOOTNOTE).toBe('Mood and feelings stay private either way. You can change this anytime.');
  });
});
```

(Oct 3 2026 is a Saturday: Oct 8 is Thursday, minus 5 days.)

- [ ] **Step 2: Run to verify they fail**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest src/domain`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

`mobile/src/domain/copy.ts`:

```ts
import type { Entry } from './types';

export const COPY = {
  emptySave: 'Add a word, a photo, anything',
  emptyBody: 'No words, just moments.',
  writePlaceholder: 'Start anywhere. One word is enough.',
  publicHeadsUp: 'This page will be public once saved',
} as const;

export function saveToast(d: Entry, today: string): string {
  const base = d.date === today ? 'Saved to today’s page' : 'Saved';
  return base + (d.vis === 'public' ? ' · public' : d.vis === 'friends' ? ' · shared with friends' : '');
}
```

`mobile/src/domain/draft.ts`:

```ts
import { fmtTime, todayIso } from '@/lib/dates';
import type { Entry, Photo, Visibility, Voice } from './types';

export function newDraft(o: { id: string; now: Date; mood: number; feelings?: string[]; date?: string; prompt?: string }): Entry {
  return {
    id: o.id, createdAt: o.now.getTime(), date: o.date ?? todayIso(o.now), time: fmtTime(o.now), mood: o.mood,
    feelings: [...(o.feelings ?? [])], text: '', prompt: o.prompt ?? '', vis: 'private', photos: [], voices: [], stickers: [],
  };
}

export const editDraft = (e: Entry): Entry => ({
  ...e, feelings: [...e.feelings], photos: [...e.photos], voices: [...e.voices], stickers: [...e.stickers],
});

export type DraftAction =
  | { type: 'text'; value: string }
  | { type: 'mood'; value: number }
  | { type: 'vis'; value: Visibility }
  | { type: 'clearPrompt' }
  | { type: 'addPhoto'; photo: Photo }
  | { type: 'removePhoto'; id: string }
  | { type: 'addVoice'; voice: Voice }
  | { type: 'removeVoice'; id: string }
  | { type: 'addSticker'; name: string }
  | { type: 'removeSticker'; index: number };

export function draftReducer(d: Entry, a: DraftAction): Entry {
  switch (a.type) {
    case 'text': return { ...d, text: a.value };
    case 'mood': return { ...d, mood: a.value };
    case 'vis': return { ...d, vis: a.value };
    case 'clearPrompt': return { ...d, prompt: '' };
    case 'addPhoto': return { ...d, photos: [...d.photos, a.photo] };
    case 'removePhoto': return { ...d, photos: d.photos.filter((p) => p.id !== a.id) };
    case 'addVoice': return { ...d, voices: [...d.voices, a.voice] };
    case 'removeVoice': return { ...d, voices: d.voices.filter((v) => v.id !== a.id) };
    case 'addSticker': return { ...d, stickers: [...d.stickers, a.name] };
    case 'removeSticker': return { ...d, stickers: d.stickers.filter((_, i) => i !== a.index) };
  }
}

export const hasContent = (d: Entry): boolean =>
  d.text.trim().length > 0 || d.photos.length > 0 || d.voices.length > 0 || d.stickers.length > 0;

const editable = (d: Entry) =>
  JSON.stringify([d.text, d.mood, d.vis, d.prompt, d.photos, d.voices, d.stickers]);
export const isDirty = (current: Entry, original: Entry): boolean => editable(current) !== editable(original);

export function defaultDateForNewPage(o: {
  route: 'today' | 'timeline'; mode: 'cal' | 'list'; selDay: string; today: string; selDayHasEntries: boolean;
}): string {
  return o.route === 'timeline' && o.mode === 'cal' && o.selDay <= o.today && !o.selDayHasEntries ? o.selDay : o.today;
}

const uris = (e: Entry | null): string[] =>
  e ? [...e.photos.map((p) => p.uri), ...e.voices.map((v) => v.uri)].filter(Boolean) : [];

/** Files created in this editing session: delete them if the user discards the page. */
export const addedUris = (original: Entry | null, current: Entry): string[] => {
  const before = new Set(uris(original));
  return uris(current).filter((u) => !before.has(u));
};

/** Files an existing page no longer references after saving: delete them. */
export const orphanedUris = (original: Entry | null, saved: Entry): string[] => {
  const after = new Set(uris(saved));
  return uris(original).filter((u) => !after.has(u));
};
```

`mobile/src/domain/stickers.ts`:

```ts
import { ramp } from '@/theme/tokens';
import { parseRadii, type Radii } from '@/lib/blob';

export const STICKERS = [
  { name: 'calm', bg: ramp.accent2[300], ink: ramp.accent2[900] },
  { name: 'cozy', bg: ramp.accent[200], ink: ramp.accent[900] },
  { name: 'proud', bg: ramp.accent[400], ink: ramp.accent[900] },
  { name: 'tired', bg: ramp.neutral[300], ink: ramp.neutral[900] },
  { name: 'grateful', bg: ramp.accent2[200], ink: ramp.accent2[900] },
  { name: 'rainy', bg: ramp.neutral[200], ink: ramp.neutral[800] },
  { name: 'brave', bg: ramp.accent[300], ink: ramp.accent[900] },
  { name: 'meh', bg: ramp.neutral[400], ink: ramp.neutral[900] },
] as const;

const BLOBS = [
  '50%',
  '58% 42% 38% 62% / 64% 46% 54% 36%',
  '40% 60% 60% 40% / 42% 44% 56% 58%',
  '46% 54% 50% 50% / 50% 46% 54% 50%',
].map(parseRadii);

const hash = (s: string) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0);

export const blobFor = (name: string): Radii => BLOBS[hash(name) % 4];
export const tiltFor = (name: string): number => ((hash(name) % 3) - 1) * 6;
export const stickerStyle = (name: string) => STICKERS.find((s) => s.name === name) ?? STICKERS[0];
```

`mobile/src/domain/prompts.ts`:

```ts
export const PROMPTS = [
  'What made you smile today, even a little?',
  'Describe one sound you heard today.',
  'What would you tell this morning’s version of you?',
  'Who did you feel close to today?',
  'What’s taking up the most room in your head right now?',
  'Name something small you’re looking forward to.',
];

/** n = absolute card index in the deck; the order is offset by the mood bucket. */
export const promptFor = (n: number, moodIdx: number): string => PROMPTS[(n + moodIdx) % PROMPTS.length];
```

`mobile/src/domain/entrySummary.ts`:

```ts
import { fmtShort, secs } from '@/lib/dates';
import { MOODS, moodColor, moodIndex } from '@/lib/mood';
import { COPY } from './copy';
import type { Entry } from './types';
import { VIS } from './visibility';

export function summarizeEntry(e: Entry) {
  const parts: string[] = [];
  if (e.photos.length) parts.push(`${e.photos.length} ${e.photos.length > 1 ? 'photos' : 'photo'}`);
  e.voices.forEach((v) => parts.push(`voice ${secs(v.seconds)}`));
  if (e.stickers.length) parts.push(e.stickers.join(', '));
  return {
    color: moodColor(e.mood),
    dateLabel: fmtShort(e.date),
    time: e.time,
    moodLabel: MOODS[moodIndex(e.mood)][0],
    text: e.text.trim() ? e.text : COPY.emptyBody,
    meta: parts.join(' · '),
    visLabel: e.vis === 'private' ? '' : VIS[e.vis].label,
    visBg: VIS[e.vis].iconBg,
    visFg: VIS[e.vis].fg,
  };
}
```

`mobile/src/domain/visibility.ts`:

```ts
import { colors, ramp } from '@/theme/tokens';
import type { Visibility } from './types';

export const VIS = {
  private: {
    label: 'Only me', desc: 'Stays on this phone, behind your lock.', icon: 'lock',
    bg: ramp.neutral[100], fg: ramp.neutral[800], border: colors.divider, iconBg: ramp.neutral[200], iconFg: ramp.neutral[800],
  },
  friends: {
    label: 'Friends', desc: 'People you’ve added can read it in their feed.', icon: 'users',
    bg: ramp.accent2[100], fg: ramp.accent2[800], border: ramp.accent2[400], iconBg: ramp.accent2[200], iconFg: ramp.accent2[800],
  },
  public: {
    label: 'Public', desc: 'Anyone with your profile link can read it, photos and voice notes included.', icon: 'globe',
    bg: ramp.accent[100], fg: ramp.accent[800], border: ramp.accent[400], iconBg: ramp.accent[200], iconFg: ramp.accent[800],
  },
} as const satisfies Record<Visibility, {
  label: string; desc: string; icon: 'lock' | 'users' | 'globe';
  bg: string; fg: string; border: string; iconBg: string; iconFg: string;
}>;

export const VIS_ORDER: Visibility[] = ['private', 'friends', 'public'];
export const VIS_FOOTNOTE = 'Mood and feelings stay private either way. You can change this anytime.';
```

- [ ] **Step 4: Run to verify they pass**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest src/domain && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/luckyangelo/Dev/journ-al
git add mobile
git commit -m "feat: add draft reducer, validation, stickers, prompts and entry summaries"
```

---

### Task 8: Demo data and social sample data

**Files:**
- Create: `mobile/src/domain/demoData.ts`, `mobile/src/domain/social.ts`, `mobile/src/state/socialStore.ts`
- Modify: `mobile/src/state/index.ts` (demo seeding)
- Test: `mobile/src/domain/demoData.test.ts`, `mobile/src/domain/social.test.ts`, `mobile/src/state/socialStore.test.ts`

**Interfaces:**
- Consumes: `Entry`, `Person`, `Post`, `FriendState`; `addDays` from `@/lib/dates`; `ramp`.
- Produces:
  - `demoEntries(today: string): Entry[]` (8 pages with dates relative to `today`)
  - `PEOPLE: Person[]` (jun, ana, leo = friends; sol, kit = none), `POSTS: Post[]` (p1–p7 from the prototype), `personById(id: string): Person`
  - `type FriendOverrides = Record<string, FriendState>`; `friendStateOf(p: Person, o: FriendOverrides): FriendState`
  - `feedFor(tab: 'friends' | 'public', posts: Post[], stateOf: (personId: string) => FriendState): Post[]`
  - `profileView(personId: string, posts: Post[], stateOf: (id: string) => FriendState): { visible: Post[]; hidden: number }`
  - `nextFriendState(s: FriendState): FriendState`
  - `useSocial`: `{ overrides: FriendOverrides; reacts: Record<string, { hug?: boolean; same?: boolean }>; toggleReact(postId: string, key: 'hug' | 'same'): void; toggleFriend(personId: string): FriendState; stateOf(personId: string): FriendState }`

Social data is sample data until a backend exists; real users never see the demo journal pages unless `DEMO_DATA` is on.

- [ ] **Step 1: Write the failing tests**

`mobile/src/domain/demoData.test.ts`:

```ts
import { demoEntries } from './demoData';

describe('demoEntries', () => {
  const es = demoEntries('2026-10-08');
  it('recreates the eight prototype pages relative to today', () => {
    expect(es.map((e) => e.date)).toEqual([
      '2026-10-07', '2026-10-06', '2026-10-05', '2026-10-03', '2026-10-01', '2026-09-28', '2026-09-24', '2026-09-20',
    ]);
    expect(es.map((e) => e.mood)).toEqual([72, 28, 55, 84, 46, 18, 66, 92]);
  });
  it('has the right visibility, media and copy', () => {
    expect(es[0]).toMatchObject({ vis: 'friends', stickers: ['cozy'], time: '10:02 pm' });
    expect(es[0].photos[0]).toMatchObject({ uri: '', label: 'photo · dinner' });
    expect(es[1].voices[0].seconds).toBe(38);
    expect(es[3].vis).toBe('public');
    expect(es[3].photos).toHaveLength(2);
    expect(es[6].text).toBe('Sunlight on the kitchen floor at 5pm. That’s it, that’s the entry.');
    expect(es.filter((e) => e.vis === 'private')).toHaveLength(6);
  });
  it('uses unique ids and strictly ordered createdAt', () => {
    expect(new Set(es.map((e) => e.id)).size).toBe(8);
    const created = es.map((e) => e.createdAt);
    expect([...created].sort((a, b) => b - a)).toEqual(created);
  });
  it('shifts with the supplied day', () => {
    expect(demoEntries('2027-03-02')[0].date).toBe('2027-03-01');
  });
});
```

`mobile/src/domain/social.test.ts`:

```ts
import { PEOPLE, POSTS, personById, friendStateOf, feedFor, profileView, nextFriendState } from './social';

const stateOf = (o: Record<string, 'none' | 'requested' | 'friends'> = {}) => (id: string) => friendStateOf(personById(id), o);

describe('social sample data', () => {
  it('has five people and seven posts', () => {
    expect(PEOPLE.map((p) => p.id)).toEqual(['jun', 'ana', 'leo', 'sol', 'kit']);
    expect(POSTS.map((p) => p.id)).toEqual(['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7']);
    expect(personById('sol').name).toBe('Sol Rivera');
  });
});

describe('feedFor', () => {
  it('Friends tab shows every post from accepted friends', () => {
    expect(feedFor('friends', POSTS, stateOf()).map((p) => p.id)).toEqual(['p1', 'p3', 'p5', 'p7']);
  });
  it('Public tab shows every public post, from anyone', () => {
    expect(feedFor('public', POSTS, stateOf()).map((p) => p.id)).toEqual(['p2', 'p4', 'p5', 'p6']);
  });
  it('drops an author from the Friends tab once the friendship is gone', () => {
    expect(feedFor('friends', POSTS, stateOf({ jun: 'none' })).map((p) => p.id)).toEqual(['p3', 'p5']);
  });
});

describe('profileView', () => {
  it('non-friends only see public posts and a count of hidden ones', () => {
    expect(profileView('sol', POSTS, stateOf())).toMatchObject({ hidden: 0 });
    expect(profileView('sol', POSTS, stateOf()).visible.map((p) => p.id)).toEqual(['p2', 'p6']);
    const jun = profileView('jun', POSTS, stateOf({ jun: 'none' }));
    expect(jun.visible).toEqual([]);
    expect(jun.hidden).toBe(2);
  });
  it('a pending request does not unlock friends-only posts', () => {
    expect(profileView('jun', POSTS, stateOf({ jun: 'requested' })).hidden).toBe(2);
  });
  it('friends see everything', () => {
    const v = profileView('jun', POSTS, stateOf());
    expect(v.visible.map((p) => p.id)).toEqual(['p1', 'p7']);
    expect(v.hidden).toBe(0);
  });
});

describe('nextFriendState', () => {
  it('toggles none <-> requested and leaves friends alone', () => {
    expect(nextFriendState('none')).toBe('requested');
    expect(nextFriendState('requested')).toBe('none');
    expect(nextFriendState('friends')).toBe('friends');
  });
});
```

`mobile/src/state/socialStore.test.ts`:

```ts
import { useSocial } from './socialStore';

beforeEach(() => useSocial.setState({ overrides: {}, reacts: {} }));

it('toggles a reaction on and off independently per kind', () => {
  const { toggleReact } = useSocial.getState();
  toggleReact('p1', 'hug');
  toggleReact('p1', 'same');
  expect(useSocial.getState().reacts.p1).toEqual({ hug: true, same: true });
  toggleReact('p1', 'hug');
  expect(useSocial.getState().reacts.p1).toEqual({ hug: false, same: true });
});

it('requests, cancels and keeps existing friendships', () => {
  const s = () => useSocial.getState();
  expect(s().stateOf('sol')).toBe('none');
  expect(s().toggleFriend('sol')).toBe('requested');
  expect(s().stateOf('sol')).toBe('requested');
  expect(s().toggleFriend('sol')).toBe('none');
  expect(s().toggleFriend('jun')).toBe('friends');
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest src/domain/demoData.test.ts src/domain/social.test.ts src/state/socialStore.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

`mobile/src/domain/demoData.ts`:

```ts
import { addDays } from '@/lib/dates';
import type { Entry } from './types';

type Seed = Omit<Entry, 'id' | 'createdAt' | 'date' | 'feelings' | 'prompt' | 'vis' | 'photos' | 'voices' | 'stickers'> &
  Partial<Pick<Entry, 'prompt' | 'vis' | 'photos' | 'voices' | 'stickers'>> & { daysAgo: number };

const SEEDS: Seed[] = [
  { daysAgo: 1, time: '10:02 pm', mood: 72, vis: 'friends', text: 'Made pasta with Jun. Burned the garlic, ate it anyway. Laughed more than I have in weeks.', prompt: 'Who did you feel close to today?', photos: [{ id: 'demo-p1', uri: '', label: 'photo · dinner' }], stickers: ['cozy'] },
  { daysAgo: 2, time: '9:15 pm', mood: 28, text: 'Presentation went fine but I felt shaky all afternoon. Walking home helped.', voices: [{ id: 'demo-v1', uri: '', seconds: 38 }] },
  { daysAgo: 3, time: '8:40 pm', mood: 55, text: 'Slow Sunday. Laundry, a library book, nothing else.', stickers: ['calm'] },
  { daysAgo: 5, time: '6:12 pm', mood: 84, vis: 'public', text: 'Found a bench by the river and just stayed for an hour. Didn’t check my phone once.', photos: [{ id: 'demo-p2', uri: '', label: 'photo · river' }, { id: 'demo-p3', uri: '', label: 'photo · bench' }] },
  { daysAgo: 7, time: '9:30 pm', mood: 46, text: 'New month. Trying to write a little every night, even if it’s one line.' },
  { daysAgo: 10, time: '1:04 am', mood: 18, text: 'Couldn’t sleep. Writing this so it stops looping in my head.', prompt: 'What’s taking up the most room in your head right now?', stickers: ['tired'] },
  { daysAgo: 14, time: '5:20 pm', mood: 66, text: 'Sunlight on the kitchen floor at 5pm. That’s it, that’s the entry.', photos: [{ id: 'demo-p4', uri: '', label: 'photo · kitchen' }] },
  { daysAgo: 18, time: '3:45 pm', mood: 92, text: 'Got the apartment!!', stickers: ['proud'] },
];

export function demoEntries(today: string): Entry[] {
  return SEEDS.map(({ daysAgo, ...s }, i) => {
    const date = addDays(today, -daysAgo);
    return {
      id: `demo-${i + 1}`, createdAt: Date.parse(`${date}T12:00:00`) + (SEEDS.length - i), date, feelings: [],
      prompt: '', vis: 'private', photos: [], voices: [], stickers: [], ...s,
    };
  });
}
```

`mobile/src/domain/social.ts`:

```ts
import { ramp } from '@/theme/tokens';
import type { FriendState, Person, Post } from './types';

export const PEOPLE: Person[] = [
  { id: 'jun', name: 'Jun', initial: 'J', color: ramp.accent2[300], bio: 'Cooks too much, writes about it after.', friendState: 'friends' },
  { id: 'ana', name: 'Ana', initial: 'A', color: ramp.accent[300], bio: 'Second year of nursing school.', friendState: 'friends' },
  { id: 'leo', name: 'Leo', initial: 'L', color: ramp.neutral[300], bio: 'Learning to be okay with slow days.', friendState: 'friends' },
  { id: 'sol', name: 'Sol Rivera', initial: 'S', color: ramp.accent[400], bio: 'Writing one line a day since June.', friendState: 'none' },
  { id: 'kit', name: 'Kit', initial: 'K', color: ramp.accent2[200], bio: 'Night shifts and small joys.', friendState: 'none' },
];

export const POSTS: Post[] = [
  { id: 'p1', authorId: 'jun', when: 'Today · 8:50 pm', vis: 'friends', prompt: 'Who did you feel close to today?', text: 'Maya came over and we burned the garlic again. Best dinner this month.', photoLabel: 'photo · two plates', hug: 2, same: 1 },
  { id: 'p2', authorId: 'sol', when: 'Today · 7:15 pm', vis: 'public', prompt: '', text: 'Line 112: the bus driver waited for me. Small thing, carried it all day.', photoLabel: '', hug: 41, same: 18 },
  { id: 'p3', authorId: 'ana', when: 'Today · 6:02 pm', vis: 'friends', prompt: 'What’s taking up the most room in your head right now?', text: 'Exam on Friday. Writing it down so it takes up less space.', photoLabel: '', hug: 5, same: 3 },
  { id: 'p4', authorId: 'kit', when: 'Yesterday · 4:30 am', vis: 'public', prompt: 'Describe one sound you heard today.', text: 'The first bird at 4:30, right as my shift ended. Felt like it was for me.', photoLabel: 'photo · empty street at dawn', hug: 63, same: 22 },
  { id: 'p5', authorId: 'leo', when: 'Yesterday · 10:40 pm', vis: 'public', prompt: '', text: 'Didn’t do much today and I’m trying not to make that mean anything.', photoLabel: '', hug: 12, same: 30 },
  { id: 'p6', authorId: 'sol', when: 'Tue 6 Oct · 9:00 pm', vis: 'public', prompt: 'Name something small you’re looking forward to.', text: 'Line 111: new socks. I am easy to please.', photoLabel: '', hug: 27, same: 9 },
  { id: 'p7', authorId: 'jun', when: 'Mon 5 Oct · 11:10 pm', vis: 'friends', prompt: '', text: 'Long day at the shop. Repotted the basil when I got home and felt human again.', photoLabel: 'photo · basil', hug: 3, same: 0 },
];

export const personById = (id: string): Person => PEOPLE.find((p) => p.id === id) ?? PEOPLE[0];

export type FriendOverrides = Record<string, FriendState>;
export const friendStateOf = (p: Person, o: FriendOverrides): FriendState => o[p.id] ?? p.friendState;

type StateOf = (personId: string) => FriendState;

export const feedFor = (tab: 'friends' | 'public', posts: Post[], stateOf: StateOf): Post[] =>
  tab === 'friends' ? posts.filter((p) => stateOf(p.authorId) === 'friends') : posts.filter((p) => p.vis === 'public');

export function profileView(personId: string, posts: Post[], stateOf: StateOf): { visible: Post[]; hidden: number } {
  const all = posts.filter((p) => p.authorId === personId);
  const isFriend = stateOf(personId) === 'friends';
  const visible = all.filter((p) => p.vis === 'public' || isFriend);
  return { visible, hidden: all.length - visible.length };
}

export const nextFriendState = (s: FriendState): FriendState => (s === 'none' ? 'requested' : s === 'requested' ? 'none' : s);
```

`mobile/src/state/socialStore.ts`:

```ts
import { create } from 'zustand';
import type { FriendState } from '@/domain/types';
import { friendStateOf, nextFriendState, personById, type FriendOverrides } from '@/domain/social';

interface SocialState {
  overrides: FriendOverrides;
  reacts: Record<string, { hug?: boolean; same?: boolean }>;
  toggleReact(postId: string, key: 'hug' | 'same'): void;
  toggleFriend(personId: string): FriendState;
  stateOf(personId: string): FriendState;
}

export const useSocial = create<SocialState>()((set, get) => ({
  overrides: {},
  reacts: {},
  toggleReact: (postId, key) =>
    set((s) => ({ reacts: { ...s.reacts, [postId]: { ...s.reacts[postId], [key]: !s.reacts[postId]?.[key] } } })),
  stateOf: (id) => friendStateOf(personById(id), get().overrides),
  toggleFriend(id) {
    const next = nextFriendState(get().stateOf(id));
    set((s) => ({ overrides: { ...s.overrides, [id]: next } }));
    return next;
  },
}));
```

Modify `mobile/src/state/index.ts`: at the end of `bootstrapState`, add demo seeding for first launch in development builds:

```ts
import { DEMO_DATA } from '@/config';
import { demoEntries } from '@/domain/demoData';
import { todayIso } from '@/lib/dates';
// ...inside bootstrapState(), after the Promise.all load:
  if (DEMO_DATA && !useSettings.getState().settings.onboarded && useEntries.getState().entries.length === 0) {
    await useEntries.getState().replaceAll(demoEntries(todayIso()));
  }
```

- [ ] **Step 4: Run to verify they pass**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest && npx tsc --noEmit`
Expected: PASS for the whole suite so far.

- [ ] **Step 5: Commit**

```bash
cd /Users/luckyangelo/Dev/journ-al
git add mobile
git commit -m "feat: add demo pages, social sample data and feed rules"
```

---

### Task 9: UI primitives

**Files:**
- Create: `mobile/src/ui/Icon.tsx`, `Button.tsx`, `Chip.tsx`, `Segmented.tsx`, `Toggle.tsx`, `Toast.tsx`, `Sheet.tsx`, `ScreenFade.tsx`, `Avatar.tsx` (all in `mobile/src/ui/`)
- Modify: `mobile/jest.setup.ts`
- Test: `mobile/src/ui/Button.test.tsx`, `mobile/src/ui/controls.test.tsx`, `mobile/src/ui/Sheet.test.tsx`

**Interfaces:**
- Consumes: `colors`, `ramp`, `radii`, `shadows`, `layout`, `heading`, `body`, `fontFamily`, `useToast`.
- Produces:
  - `<Icon name={IconName} size?={number} color?={string} />`; `IconName = 'house'|'calendar'|'users'|'user'|'plus'|'x'|'arrow-left'|'chevron-left'|'chevron-right'|'chevron-down'|'image'|'mic'|'smile'|'lock'|'globe'|'pencil'|'delete'|'play'|'pause'`
  - `<Button label onPress variant?='primary'|'ghost'|'outline' height?={number} fontSize?={number} disabled? accessibilityLabel? testID? style? />` (primary = Caprasimo 18, ghost/outline = Figtree 600 15; `fontSize` overrides)
  - `<Chip label selected onPress height?={number} fill?={boolean} />` (`fill` stretches it to the parent’s width; label is 15px when `height >= 56`, else 13px)
  - `<Segmented<K extends string> options={{ key: K; label: string }[]} value={K} onChange={(k: K) => void} />`
  - `<Toggle value onChange accessibilityLabel />`
  - `<ToastHost />` (reads `useToast`)
  - `<Sheet visible onClose title?>{children}</Sheet>` (slides up 280ms, scrim 35%, top radius 32)
  - `<ScreenFade style?>{children}</ScreenFade>` (fade + translateY 10→0, 300ms)
  - `<Avatar initial color size?={number} onPress? />`

- [ ] **Step 1: Test setup and failing tests**

Append to `mobile/jest.setup.ts`:

```ts
import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
```

(If the installed Reanimated major version documents a different Jest setup, follow its docs; the intent is only that animated components render synchronously in tests.)

`mobile/src/ui/Button.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Button } from './Button';

it('calls onPress', () => {
  const onPress = jest.fn();
  render(<Button label="Continue" onPress={onPress} />);
  fireEvent.press(screen.getByText('Continue'));
  expect(onPress).toHaveBeenCalledTimes(1);
});

it('does not fire when disabled and reports the disabled state', () => {
  const onPress = jest.fn();
  render(<Button label="Continue" onPress={onPress} disabled />);
  fireEvent.press(screen.getByText('Continue'));
  expect(onPress).not.toHaveBeenCalled();
  expect(screen.getByRole('button')).toBeDisabled();
});
```

`mobile/src/ui/controls.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Chip } from './Chip';
import { Segmented } from './Segmented';
import { Toggle } from './Toggle';

it('Chip reports selection and presses', () => {
  const onPress = jest.fn();
  render(<Chip label="calm" selected onPress={onPress} />);
  expect(screen.getByRole('button', { name: 'calm' })).toBeSelected();
  fireEvent.press(screen.getByText('calm'));
  expect(onPress).toHaveBeenCalled();
});

it('Segmented switches value', () => {
  const onChange = jest.fn();
  render(<Segmented options={[{ key: 'cal', label: 'Calendar' }, { key: 'list', label: 'List' }]} value="cal" onChange={onChange} />);
  fireEvent.press(screen.getByText('List'));
  expect(onChange).toHaveBeenCalledWith('list');
});

it('Toggle flips and exposes switch semantics', () => {
  const onChange = jest.fn();
  render(<Toggle value={false} onChange={onChange} accessibilityLabel="Nightly nudge" />);
  const sw = screen.getByRole('switch', { name: 'Nightly nudge' });
  expect(sw).not.toBeChecked();
  fireEvent.press(sw);
  expect(onChange).toHaveBeenCalledWith(true);
});
```

`mobile/src/ui/Sheet.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Sheet } from './Sheet';

it('renders children only while visible and closes from the scrim', () => {
  const onClose = jest.fn();
  const { rerender } = render(<Sheet visible={false} onClose={onClose}><Text>inside</Text></Sheet>);
  expect(screen.queryByText('inside')).toBeNull();
  rerender(<Sheet visible onClose={onClose} title="Who can read this page?"><Text>inside</Text></Sheet>);
  expect(screen.getByText('inside')).toBeTruthy();
  expect(screen.getByText('Who can read this page?')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Close'));
  expect(onClose).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest src/ui`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

`mobile/src/ui/Icon.tsx`:

```tsx
import {
  House, Calendar, Users, User, Plus, X, ArrowLeft, ChevronLeft, ChevronRight, ChevronDown, Image, Mic, Smile,
  Lock, Globe, Pencil, Delete, Play, Pause,
} from 'lucide-react-native';
import { colors } from '@/theme/tokens';

const icons = {
  house: House, calendar: Calendar, users: Users, user: User, plus: Plus, x: X, 'arrow-left': ArrowLeft,
  'chevron-left': ChevronLeft, 'chevron-right': ChevronRight, 'chevron-down': ChevronDown, image: Image, mic: Mic,
  smile: Smile, lock: Lock, globe: Globe, pencil: Pencil, delete: Delete, play: Play, pause: Pause,
} as const;

export type IconName = keyof typeof icons;

export function Icon({ name, size = 20, color = colors.text }: { name: IconName; size?: number; color?: string }) {
  const Cmp = icons[name];
  return <Cmp size={size} color={color} strokeWidth={2.75} />;
}
```

(If a Lucide name differs in the installed version, e.g. `House` vs `Home`, import the exported name and keep the key.)

`mobile/src/ui/Button.tsx`:

```tsx
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { colors, ramp, radii } from '@/theme/tokens';
import { body, heading } from '@/theme/type';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'outline';
  height?: number;
  fontSize?: number;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, onPress, variant = 'primary', height, fontSize, disabled, accessibilityLabel, testID, style }: Props) {
  const h = height ?? (variant === 'ghost' ? 48 : 56);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        { height: h, minHeight: 44 },
        variant === 'primary' && { backgroundColor: pressed ? ramp.accent[600] : colors.accent },
        variant === 'ghost' && { backgroundColor: pressed ? ramp.accent[100] : 'transparent' },
        variant === 'outline' && { borderWidth: 1.5, borderColor: colors.divider, backgroundColor: pressed ? ramp.neutral[200] : 'transparent' },
        disabled && { opacity: 0.45 },
        style,
      ]}
    >
      <Text
        style={
          variant === 'primary'
            ? [heading(fontSize ?? 18, 1), { color: colors.bg }]
            : [body(fontSize ?? 15, 'semi'), { color: variant === 'ghost' ? ramp.accent[700] : colors.text }]
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
});
```

`mobile/src/ui/Chip.tsx`:

```tsx
import { Pressable, Text } from 'react-native';
import { colors, ramp, radii } from '@/theme/tokens';
import { body } from '@/theme/type';

export function Chip({ label, selected, onPress, height = 36, fill = false }: { label: string; selected: boolean; onPress: () => void; height?: number; fill?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={{ top: Math.max(0, (44 - height) / 2), bottom: Math.max(0, (44 - height) / 2) }}
      style={{
        height, paddingHorizontal: 14, borderRadius: radii.pill, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
        alignSelf: fill ? 'stretch' : 'auto',
        backgroundColor: selected ? ramp.accent2[600] : 'transparent',
        borderColor: selected ? ramp.accent2[600] : colors.divider,
      }}
    >
      <Text style={[body(height >= 56 ? 15 : 13, 'semi'), { color: selected ? ramp.neutral[100] : ramp.neutral[800] }]}>{label}</Text>
    </Pressable>
  );
}
```

`mobile/src/ui/Segmented.tsx`:

```tsx
import { Pressable, Text, View } from 'react-native';
import { colors, radii } from '@/theme/tokens';
import { body } from '@/theme/type';

export function Segmented<K extends string>({
  options, value, onChange,
}: { options: { key: K; label: string }[]; value: K; onChange: (k: K) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: colors.surface, borderRadius: radii.pill, padding: 4 }}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.key)}
            hitSlop={{ top: 4, bottom: 4 }}
            style={{ height: 36, paddingHorizontal: 16, borderRadius: radii.pill, justifyContent: 'center', backgroundColor: on ? colors.accent : 'transparent' }}
          >
            <Text style={[body(14, 'semi'), { color: on ? colors.bg : colors.text }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
```

`mobile/src/ui/Toggle.tsx`:

```tsx
import { Pressable, View } from 'react-native';
import { ramp } from '@/theme/tokens';

export function Toggle({ value, onChange, accessibilityLabel }: { value: boolean; onChange: (v: boolean) => void; accessibilityLabel: string }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      hitSlop={6}
      style={{ width: 52, height: 32, borderRadius: 16, backgroundColor: value ? ramp.accent2[600] : ramp.neutral[400], justifyContent: 'center' }}
    >
      <View style={{ position: 'absolute', top: 4, left: value ? 24 : 4, width: 24, height: 24, borderRadius: 12, backgroundColor: ramp.neutral[100] }} />
    </Pressable>
  );
}
```

`mobile/src/ui/ScreenFade.tsx`:

```tsx
import { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export function ScreenFade({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
  }, [p]);
  const anim = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ translateY: (1 - p.value) * 10 }] }));
  return <Animated.View style={[{ flex: 1 }, style, anim]}>{children}</Animated.View>;
}
```

`mobile/src/ui/Sheet.tsx`:

```tsx
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, radii } from '@/theme/tokens';
import { heading } from '@/theme/type';
import { Icon } from './Icon';

export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title?: string; children: React.ReactNode }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(visible ? 1 : 0, { duration: 280, easing: Easing.bezier(0.3, 0.9, 0.4, 1) });
  }, [visible, p]);
  const panel = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - p.value) * 520 }] }));
  const scrim = useAnimatedStyle(() => ({ opacity: p.value }));
  if (!visible) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }, scrim]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" accessibilityRole="button" />
      </Animated.View>
      <Animated.View style={[styles.panel, panel]}>
        <View style={styles.handle} />
        {title ? <Text style={heading(22)}>{title}</Text> : null}
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.bg, borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet, paddingTop: 12, paddingHorizontal: 22, paddingBottom: 26, gap: 16 },
  handle: { width: 40, height: 5, borderRadius: 999, backgroundColor: ramp.neutral[400], alignSelf: 'center' },
});
```

(Matches the prototype's sheets: a 40×5 grab handle, a Caprasimo 22 title, no close button; the scrim is the dismiss target and is labelled `Close`. Remove the unused `Icon` import from `Sheet.tsx` and import `ramp` from `@/theme/tokens`. The sheet unmounts immediately when `visible` turns false, so there is no slide-out; that is acceptable for v1.)

`mobile/src/ui/Toast.tsx`:

```tsx
import { Text, View } from 'react-native';
import { colors, ramp, radii } from '@/theme/tokens';
import { body } from '@/theme/type';
import { useToast } from '@/state/toastStore';

export function ToastHost() {
  const message = useToast((s) => s.message);
  if (!message) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 92, alignItems: 'center', zIndex: 20 }}>
      <View accessibilityLiveRegion="polite" style={{ backgroundColor: ramp.neutral[900], paddingVertical: 10, paddingHorizontal: 16, borderRadius: radii.pill }}>
        <Text style={[body(13, 'semi'), { color: colors.bg }]}>{message}</Text>
      </View>
    </View>
  );
}
```

`mobile/src/ui/Avatar.tsx`:

```tsx
import { Pressable, Text } from 'react-native';
import { ramp } from '@/theme/tokens';
import { heading } from '@/theme/type';

export function Avatar({ initial, color = ramp.accent2[300], size = 40, onPress }: { initial: string; color?: string; size?: number; onPress?: () => void }) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : 'image'}
      accessibilityLabel={`Avatar ${initial}`}
      hitSlop={Math.max(0, (44 - size) / 2)}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={[heading(Math.round(size * 0.4), 1), { color: ramp.accent2[900] }]}>{initial}</Text>
    </Pressable>
  );
}
```

- [ ] **Step 4: Run to verify they pass**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest src/ui && npx tsc --noEmit`
Expected: PASS. If a RNTL matcher (`toBeChecked`, `toBeSelected`) is not available, add `import '@testing-library/react-native/extend-expect'` (or the version-appropriate matcher import) to `jest.setup.ts`.

- [ ] **Step 5: Commit**

```bash
cd /Users/luckyangelo/Dev/journ-al
git add mobile
git commit -m "feat: add shared UI primitives"
```

### Task 10: Mood blob and mood slider

**Files:**
- Create: `mobile/src/ui/Blob.tsx`, `mobile/src/ui/MoodBlob.tsx`, `mobile/src/ui/MoodSlider.tsx`
- Test: `mobile/src/ui/MoodSlider.test.tsx`

**Interfaces:**
- Consumes: `blobPath`, `Radii`, `moodColor`, `moodRadii`, `moodRotation`, `valueFromX`, `ramp`, `shadows`.
- Produces:
  - `<Blob radii={Radii} size={number} color={string} rotate?={number}>{children?}</Blob>` (SVG shape with CSS-style elliptical corners; children are centred on top and tilt with it)
  - `<MoodBlob value={number} size={number} />` (colour, shape and tilt all derive from `value`)
  - `<MoodSlider value={number} onChange={(v: number) => void} size?={'large' | 'compact'} />` — `large`: 12px track, 30px thumb, 3px border; `compact`: 8px track, 24px thumb. Both have a 44px touch height. Accessible as an adjustable control (`increment`/`decrement` change the value by 5).

- [ ] **Step 1: Write the failing test**

`mobile/src/ui/MoodSlider.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';
import { MoodSlider } from './MoodSlider';

const adjust = (name: 'increment' | 'decrement') =>
  fireEvent(screen.getByRole('adjustable'), 'accessibilityAction', { nativeEvent: { actionName: name } });

it('exposes the current value to screen readers', () => {
  render(<MoodSlider value={62} onChange={() => {}} />);
  expect(screen.getByRole('adjustable')).toHaveAccessibilityValue({ min: 0, max: 100, now: 62 });
});

it('steps by 5 with accessibility actions and stays within 0-100', () => {
  const onChange = jest.fn();
  const { rerender } = render(<MoodSlider value={62} onChange={onChange} />);
  adjust('increment');
  expect(onChange).toHaveBeenLastCalledWith(67);
  adjust('decrement');
  expect(onChange).toHaveBeenLastCalledWith(57);
  rerender(<MoodSlider value={98} onChange={onChange} />);
  adjust('increment');
  expect(onChange).toHaveBeenLastCalledWith(100);
  rerender(<MoodSlider value={2} onChange={onChange} />);
  adjust('decrement');
  expect(onChange).toHaveBeenLastCalledWith(0);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest src/ui/MoodSlider.test.tsx`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

`mobile/src/ui/Blob.tsx`:

```tsx
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { blobPath, type Radii } from '@/lib/blob';

export function Blob({
  radii, size, color, rotate = 0, children,
}: { radii: Radii; size: number; color: string; rotate?: number; children?: React.ReactNode }) {
  return (
    <View style={{ width: size, height: size, transform: [{ rotate: `${rotate}deg` }] }} pointerEvents="none">
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Path d={blobPath(radii, size)} fill={color} />
      </Svg>
      {children ? <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>{children}</View> : null}
    </View>
  );
}
```

`mobile/src/ui/MoodBlob.tsx`:

```tsx
import { moodColor, moodRadii, moodRotation } from '@/lib/mood';
import { Blob } from './Blob';

export function MoodBlob({ value, size }: { value: number; size: number }) {
  return <Blob radii={moodRadii(value)} size={size} color={moodColor(value)} rotate={size >= 80 ? moodRotation(value) : 0} />;
}
```

(The prototype tilts only the 88px Today blob; the 44px Write blob has no rotation.)

`mobile/src/ui/MoodSlider.tsx`:

```tsx
import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { moodColor } from '@/lib/mood';
import { valueFromX } from '@/lib/slider';
import { ramp, shadows } from '@/theme/tokens';

interface Props { value: number; onChange: (v: number) => void; size?: 'large' | 'compact' }

export function MoodSlider({ value, onChange, size = 'large' }: Props) {
  const [width, setWidth] = useState(0);
  const track = size === 'large' ? 12 : 8;
  const thumb = size === 'large' ? 30 : 24;

  const pan = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-4, 4])
    .failOffsetY([-14, 14])
    .onBegin((e) => onChange(valueFromX(e.x, width)))
    .onUpdate((e) => onChange(valueFromX(e.x, width)));

  const step = (d: number) => onChange(Math.max(0, Math.min(100, value + d)));

  return (
    <GestureDetector gesture={pan}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Mood"
        accessibilityValue={{ min: 0, max: 100, now: value }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 5 : -5)}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        style={{ height: 44, justifyContent: 'center' }}
      >
        <LinearGradient
          colors={[ramp.accent2[600], ramp.neutral[300], ramp.accent[500]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: track, borderRadius: 999 }}
        />
        <View
          pointerEvents="none"
          style={[
            {
              position: 'absolute', left: (width * value) / 100 - thumb / 2, width: thumb, height: thumb, borderRadius: thumb / 2,
              backgroundColor: ramp.neutral[100], borderWidth: 3, borderColor: moodColor(value),
            },
            shadows.md,
          ]}
        />
      </View>
    </GestureDetector>
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest src/ui && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/luckyangelo/Dev/journ-al
git add mobile
git commit -m "feat: add mood blob and accessible mood slider"
```

---

### Task 11: App shell: root layout, start gate, bottom navigation and FAB

**Files:**
- Create: `mobile/src/ui/Screen.tsx`, `mobile/src/ui/BottomNav.tsx`, `mobile/src/ui/Fab.tsx`, `mobile/src/features/write/useNewPage.ts`
- Modify (replace Task 1 stubs): `mobile/app/_layout.tsx`, `mobile/app/index.tsx`
- Create: `mobile/app/(tabs)/_layout.tsx`, and titled screens `mobile/app/(tabs)/index.tsx`, `timeline.tsx`, `me.tsx`, `friends/_layout.tsx`, `friends/index.tsx` (each is a one-line screen with its title now and is fully replaced in Tasks 14, 15, 18, 19)
- Test: `mobile/src/ui/BottomNav.test.tsx`

**Interfaces:**
- Consumes: `bootstrapState`, `useSettings`, `useAppFonts`, `ToastHost`, `useTimelineUi`, `useEntries`, `defaultDateForNewPage`, `todayIso`.
- Produces:
  - `<Screen scroll? topPad? bottomPad? gap?>` (safe-area padding, bg, enter animation, 22px side padding)
  - `<BottomNav {...BottomTabBarProps} />` (76px + bottom inset, surface bg, 4 items)
  - `<Fab />` (renders only when the path is `/` or `/timeline`)
  - `useNewPage(): () => void` — opens `/write?date=…` using `defaultDateForNewPage`
  - Route contract: `/onboarding`, `/pin?after=today|me`, `/write?entryId=&prompt=&date=`, `/(tabs)` (`/`, `/timeline`, `/friends`, `/friends/[id]`, `/me`)

- [ ] **Step 1: Write the failing test**

`mobile/src/ui/BottomNav.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomNav } from './BottomNav';

const routes = ['index', 'timeline', 'friends', 'me'].map((name) => ({ key: name, name }));
const titles: Record<string, string> = { index: 'Today', timeline: 'Timeline', friends: 'Friends', me: 'Me' };

function setup(index = 0) {
  const navigation = { emit: jest.fn(() => ({ defaultPrevented: false })), navigate: jest.fn() };
  const props = {
    state: { index, routes, key: 's', routeNames: routes.map((r) => r.name), type: 'tab', stale: false, history: [] },
    descriptors: Object.fromEntries(routes.map((r) => [r.key, { options: { title: titles[r.name] } }])),
    navigation,
    insets: { top: 0, bottom: 0, left: 0, right: 0 },
  } as never;
  render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <BottomNav {...props} />
    </SafeAreaProvider>,
  );
  return navigation;
}

it('shows the four destinations and marks the focused one', () => {
  setup(1);
  expect(screen.getAllByRole('tab')).toHaveLength(4);
  expect(screen.getByRole('tab', { name: 'Timeline' })).toBeSelected();
  expect(screen.getByRole('tab', { name: 'Today' })).not.toBeSelected();
});

it('navigates on press', () => {
  const nav = setup(0);
  fireEvent.press(screen.getByRole('tab', { name: 'Me' }));
  expect(nav.navigate).toHaveBeenCalledWith('me', undefined);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest src/ui/BottomNav.test.tsx`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

`mobile/src/ui/Screen.tsx`:

```tsx
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout } from '@/theme/tokens';
import { ScreenFade } from './ScreenFade';

interface Props { children: React.ReactNode; scroll?: boolean; topPad?: number; bottomPad?: number; gap?: number }

export function Screen({ children, scroll = true, topPad = 14, bottomPad = 110, gap = 24 }: Props) {
  const { top } = useSafeAreaInsets();
  const pad = { paddingTop: top + topPad, paddingHorizontal: layout.screenPadding, gap };
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenFade>
        {scroll ? (
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ ...pad, paddingBottom: bottomPad }}>
            {children}
          </ScrollView>
        ) : (
          <View style={{ flex: 1, ...pad }}>{children}</View>
        )}
      </ScreenFade>
    </View>
  );
}
```

`mobile/src/ui/BottomNav.tsx`:

```tsx
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, radii, ramp } from '@/theme/tokens';
import { body } from '@/theme/type';
import { Icon, type IconName } from './Icon';

const ICONS: Record<string, IconName> = { index: 'house', timeline: 'calendar', friends: 'users', me: 'user' };

export function BottomNav({ state, descriptors, navigation }: BottomTabBarProps) {
  const { bottom } = useSafeAreaInsets();
  return (
    <View style={{ height: layout.navHeight + bottom, paddingBottom: bottom, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center' }}>
      {state.routes.map((route, i) => {
        const focused = state.index === i;
        const label = descriptors[route.key].options.title ?? route.name;
        const fg = focused ? ramp.accent[900] : ramp.neutral[700];
        const onPress = () => {
          const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !e.defaultPrevented) navigation.navigate(route.name, route.params);
        };
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: focused }}
            onPress={onPress}
            style={{ flex: 1, alignItems: 'center', gap: 4, minHeight: layout.hitTarget }}
          >
            <View style={{ width: 60, height: 32, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? ramp.accent[300] : 'transparent' }}>
              <Icon name={ICONS[route.name] ?? 'house'} size={22} color={fg} />
            </View>
            <Text style={[body(12, focused ? 'bold' : 'semi'), { color: fg }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
```

`mobile/src/features/write/useNewPage.ts`:

```ts
import { useRouter, usePathname } from 'expo-router';
import { useEntries } from '@/state';
import { useTimelineUi } from '@/state/timelineStore';
import { defaultDateForNewPage } from '@/domain/draft';
import { todayIso } from '@/lib/dates';

export function useNewPage(): () => void {
  const router = useRouter();
  const pathname = usePathname();
  return () => {
    const { mode, selDay } = useTimelineUi.getState();
    const date = defaultDateForNewPage({
      route: pathname.startsWith('/timeline') ? 'timeline' : 'today',
      mode, selDay, today: todayIso(),
      selDayHasEntries: useEntries.getState().entries.some((e) => e.date === selDay),
    });
    router.push({ pathname: '/write', params: { date } });
  };
}
```

`mobile/src/ui/Fab.tsx`:

```tsx
import { Pressable, Text } from 'react-native';
import { usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, radii, ramp, shadows } from '@/theme/tokens';
import { heading } from '@/theme/type';
import { useNewPage } from '@/features/write/useNewPage';
import { Icon } from './Icon';

export function Fab() {
  const pathname = usePathname();
  const { bottom } = useSafeAreaInsets();
  const newPage = useNewPage();
  if (pathname !== '/' && !pathname.startsWith('/timeline')) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="New page"
      onPress={newPage}
      style={({ pressed }) => [
        {
          position: 'absolute', right: layout.fabInset, bottom: layout.navHeight + bottom + layout.fabInset, height: layout.fabHeight,
          paddingLeft: 18, paddingRight: 22, borderRadius: radii.fab, flexDirection: 'row', alignItems: 'center', gap: 10,
          backgroundColor: pressed ? ramp.accent[600] : colors.accent,
        },
        shadows.lg,
      ]}
    >
      <Icon name="pencil" size={20} color={colors.bg} />
      <Text style={[heading(16, 1), { color: colors.bg }]}>New page</Text>
    </Pressable>
  );
}
```

`mobile/app/(tabs)/_layout.tsx`:

```tsx
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { BottomNav } from '@/ui/BottomNav';
import { Fab } from '@/ui/Fab';

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs tabBar={(p) => <BottomNav {...p} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" options={{ title: 'Today' }} />
        <Tabs.Screen name="timeline" options={{ title: 'Timeline' }} />
        <Tabs.Screen name="friends" options={{ title: 'Friends' }} />
        <Tabs.Screen name="me" options={{ title: 'Me' }} />
      </Tabs>
      <Fab />
    </View>
  );
}
```

`mobile/app/(tabs)/friends/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';
import { colors } from '@/theme/tokens';

export default function FriendsLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'fade' }} />;
}
```

Titled screens (each replaced later; they exist so the shell boots and navigation can be checked by hand). Example `mobile/app/(tabs)/index.tsx`; make the other four identical except for the title text (`Your pages`, `Others’ pages`, `Me`):

```tsx
import { Text } from 'react-native';
import { Screen } from '@/ui/Screen';
import { heading } from '@/theme/type';

export default function TodayScreen() {
  return (
    <Screen>
      <Text style={heading(34)}>Today</Text>
    </Screen>
  );
}
```

(`friends/index.tsx` uses `Others’ pages` — note the typographic apostrophe; the prototype's straight `Others'` is replaced for consistency with the copy rule.)

`mobile/app/index.tsx`:

```tsx
import { Redirect } from 'expo-router';
import { useSettings } from '@/state';

export default function Start() {
  const onboarded = useSettings((s) => s.settings.onboarded);
  return <Redirect href={onboarded ? '/(tabs)' : '/onboarding'} />;
}
```

`mobile/app/_layout.tsx`:

```tsx
import 'react-native-gesture-handler';
import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { bootstrapState } from '@/state';
import { useAppFonts } from '@/theme/fonts';
import { colors } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { Button } from '@/ui/Button';
import { ToastHost } from '@/ui/Toast';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const fontsReady = useAppFonts();
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');

  const boot = useCallback(() => {
    setState('loading');
    bootstrapState().then(() => setState('ready'), () => setState('failed'));
  }, []);
  useEffect(boot, [boot]);

  useEffect(() => {
    if (fontsReady && state !== 'loading') SplashScreen.hideAsync().catch(() => {});
  }, [fontsReady, state]);

  if (!fontsReady || state === 'loading') return null;

  if (state === 'failed') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: 30, justifyContent: 'center', gap: 16 }}>
        <Text style={heading(28)}>We couldn’t open your journal.</Text>
        <Text style={body(15)}>Your pages are safe on this phone. Try again in a moment.</Text>
        <Button label="Try again" onPress={boot} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'fade' }} />
        <ToastHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

(`Stack` auto-registers `index`, `onboarding`, `pin`, `write`, `(tabs)` from the file system.)

- [ ] **Step 4: Run tests, typecheck, then boot the app on an Android emulator or device**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest && npx tsc --noEmit`
Expected: PASS.

Run: `npx expo start --android` (needs a dev build because of native modules: if Expo Go rejects a module, run `npx expo run:android` once).
Expected: the app opens on a "Onboarding"-less redirect (the `/onboarding` route does not exist yet, so Expo Router shows its unmatched-route screen; that is correct until Task 12). Temporarily check the shell by setting `onboarded` true: with `EXPO_PUBLIC_DEMO_DATA=1` not set, open `/(tabs)` via `npx uri-scheme open "journal:///" --android` and confirm four tabs, the active pill moving, and the New page button only on Today/Timeline.

- [ ] **Step 5: Commit**

```bash
cd /Users/luckyangelo/Dev/journ-al
git add mobile
git commit -m "feat: add app shell, start gate, bottom navigation and FAB"
```

---

### Task 12: Onboarding

**Files:**
- Create: `mobile/src/features/onboarding/onboardingLogic.ts`, `mobile/src/features/onboarding/OnboardingScreen.tsx`, `mobile/app/onboarding.tsx`
- Test: `mobile/src/features/onboarding/onboardingLogic.test.ts`, `mobile/src/features/onboarding/OnboardingScreen.test.tsx`

**Interfaces:**
- Consumes: `useSettings` (`update`), `TIMES`, `Button`, `Chip`, `Blob`, `Icon`, `Screen`-style layout, `parseRadii`, route `/pin?after=today`.
- Produces:
  - `ONBOARDING_CTA: string[]` = `['Let’s begin', 'Continue', 'Continue', 'Set a PIN']`, `canContinue(step: number, name: string): boolean`
  - `<OnboardingScreen />` (4 steps), route `/onboarding` (Me → "Replay the welcome" simply pushes it; the name and reminder choices start from the saved settings)

Behaviour: step 2 saves `name` (trimmed) on Continue; step 3 saves `remind`/`remindTime` on Continue ("No reminders" sets `remind: false`); step 4 "Set a PIN" → `/pin?after=today`; "Not now" sets `onboarded: true` and goes to the tabs. Android hardware Back goes to the previous step; on step 1 it exits the app as usual.

- [ ] **Step 1: Write the failing tests**

`mobile/src/features/onboarding/onboardingLogic.test.ts`:

```ts
import { ONBOARDING_CTA, canContinue } from './onboardingLogic';

it('has the four CTAs', () => {
  expect(ONBOARDING_CTA).toEqual(['Let’s begin', 'Continue', 'Continue', 'Set a PIN']);
});

it('requires a real name only on the name step', () => {
  expect(canContinue(0, '')).toBe(true);
  expect(canContinue(1, '')).toBe(false);
  expect(canContinue(1, '   ')).toBe(false);
  expect(canContinue(1, ' Maya ')).toBe(true);
  expect(canContinue(2, '')).toBe(true);
  expect(canContinue(3, '')).toBe(true);
});
```

`mobile/src/features/onboarding/OnboardingScreen.test.tsx`:

```tsx
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSettings } from '@/state';
import { OnboardingScreen } from './OnboardingScreen';

const mockReplace = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace, push: mockPush }), useLocalSearchParams: () => ({}) }));
jest.mock('@/state', () => {
  const { create } = require('zustand');
  const update = jest.fn(async () => {});
  return {
    useSettings: Object.assign(
      create(() => ({ settings: { name: '', remind: true, remindTime: '9:00 pm', lockOn: false, onboarded: false }, update })),
      { __update: update },
    ),
  };
});

const update = (useSettings as unknown as { __update: jest.Mock }).__update;
const wrap = () =>
  render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <OnboardingScreen />
    </SafeAreaProvider>,
  );

beforeEach(() => { jest.clearAllMocks(); });

it('walks through the steps and saves name and reminder time', async () => {
  wrap();
  expect(screen.getByText('A softer place to put your day.')).toBeTruthy();
  fireEvent.press(screen.getByText('Let’s begin'));

  expect(screen.getByText('What should we call you?')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  fireEvent.changeText(screen.getByPlaceholderText('Your first name'), '   ');
  expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  fireEvent.changeText(screen.getByPlaceholderText('Your first name'), ' Maya ');
  await act(async () => { fireEvent.press(screen.getByText('Continue')); });
  expect(update).toHaveBeenCalledWith({ name: 'Maya' });

  expect(screen.getByText('When do you usually wind down?')).toBeTruthy();
  fireEvent.press(screen.getByText('10:00 pm'));
  await act(async () => { fireEvent.press(screen.getByText('Continue')); });
  expect(update).toHaveBeenCalledWith({ remind: true, remindTime: '10:00 pm' });

  expect(screen.getByText('Keep your pages private?')).toBeTruthy();
  fireEvent.press(screen.getByText('Set a PIN'));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/pin', params: { after: 'today' } });
});

it('"No reminders" turns the reminder off', async () => {
  wrap();
  fireEvent.press(screen.getByText('Let’s begin'));
  fireEvent.changeText(screen.getByPlaceholderText('Your first name'), 'Maya');
  await act(async () => { fireEvent.press(screen.getByText('Continue')); });
  fireEvent.press(screen.getByText('No reminders'));
  await act(async () => { fireEvent.press(screen.getByText('Continue')); });
  expect(update).toHaveBeenCalledWith(expect.objectContaining({ remind: false }));
});

it('"Not now" finishes onboarding without a PIN', async () => {
  wrap();
  fireEvent.press(screen.getByText('Let’s begin'));
  fireEvent.changeText(screen.getByPlaceholderText('Your first name'), 'Maya');
  await act(async () => { fireEvent.press(screen.getByText('Continue')); });
  await act(async () => { fireEvent.press(screen.getByText('Continue')); });
  await act(async () => { fireEvent.press(screen.getByText('Not now')); });
  expect(update).toHaveBeenCalledWith({ onboarded: true });
  expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest src/features/onboarding`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

`mobile/src/features/onboarding/onboardingLogic.ts`:

```ts
export const ONBOARDING_CTA = ['Let’s begin', 'Continue', 'Continue', 'Set a PIN'];

export const canContinue = (step: number, name: string): boolean => step !== 1 || name.trim().length > 0;
```

`mobile/src/features/onboarding/OnboardingScreen.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { parseRadii } from '@/lib/blob';
import { TIMES } from '@/lib/time';
import { useSettings } from '@/state';
import { colors, radii, ramp } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { Blob } from '@/ui/Blob';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { Icon } from '@/ui/Icon';
import { ScreenFade } from '@/ui/ScreenFade';
import { ONBOARDING_CTA, canContinue } from './onboardingLogic';

const BLOB = parseRadii('58% 42% 38% 62% / 64% 46% 54% 36%');
const CIRCLE = parseRadii('50%');

export function OnboardingScreen() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const settings = useSettings((s) => s.settings);
  const update = useSettings((s) => s.update);
  const [step, setStep] = useState(0);
  const [name, setName] = useState(settings.name);
  const [time, setTime] = useState<string | null>(settings.remind ? settings.remindTime : null);

  useEffect(() => {
    if (step === 0) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { setStep((s) => s - 1); return true; });
    return () => sub.remove();
  }, [step]);

  const next = async () => {
    if (!canContinue(step, name)) return;
    if (step === 1) await update({ name: name.trim() });
    if (step === 2) await update({ remind: time !== null, remindTime: time ?? settings.remindTime });
    if (step === 3) return router.push({ pathname: '/pin', params: { after: 'today' } });
    setStep(step + 1);
  };
  const skipPin = async () => {
    await update({ onboarded: true });
    router.replace('/(tabs)');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenFade style={{ paddingTop: top + 10, paddingHorizontal: 26, paddingBottom: bottom + 26, gap: 20 }}>
        <View style={{ height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {step > 0 ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => setStep(step - 1)} style={styles.back}>
              <Icon name="arrow-left" size={22} />
            </Pressable>
          ) : <View />}
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={{ height: 8, width: i === step ? 26 : 8, borderRadius: 4, backgroundColor: i <= step ? colors.accent : ramp.neutral[300] }} />
            ))}
          </View>
        </View>

        <View style={{ flex: 1, gap: step === 0 ? 20 : 16, paddingTop: step === 0 ? 0 : 40 }}>
          {step === 0 && (
            <>
              <View style={{ height: 270 }}>
                <View style={{ position: 'absolute', left: 0, top: 30 }}><Blob radii={CIRCLE} size={190} color={ramp.accent[300]} /></View>
                <View style={{ position: 'absolute', right: 6, top: 0 }}><Blob radii={BLOB} size={150} color={ramp.accent2[300]} /></View>
                <View style={{ position: 'absolute', left: 150, top: 170 }}><Blob radii={CIRCLE} size={92} color={ramp.accent[500]} /></View>
              </View>
              <Text style={heading(36, 1.08)}>A softer place to put your day.</Text>
              <Text style={[body(16, 'body', 1.5), { color: ramp.neutral[800] }]}>A mood, a few words, maybe a photo. Two minutes is plenty.</Text>
            </>
          )}
          {step === 1 && (
            <>
              <Text style={heading(32)}>What should we call you?</Text>
              <Text style={[body(15), { color: ramp.neutral[700] }]}>Only you will ever see this.</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your first name"
                placeholderTextColor={ramp.neutral[500]}
                maxLength={40}
                autoCapitalize="words"
                autoCorrect={false}
                style={styles.input}
              />
            </>
          )}
          {step === 2 && (
            <>
              <Text style={heading(32)}>When do you usually wind down?</Text>
              <Text style={[body(15, 'body', 1.5), { color: ramp.neutral[700] }]}>We’ll send one gentle nudge a night. Never more.</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
                {TIMES.map((t) => (
                  <View key={t} style={{ width: '48%' }}>
                    <WideChip label={t} selected={time === t} onPress={() => setTime(t)} />
                  </View>
                ))}
                <View style={{ width: '100%' }}>
                  <WideChip label="No reminders" selected={time === null} onPress={() => setTime(null)} />
                </View>
              </View>
            </>
          )}
          {step === 3 && (
            <>
              <View style={styles.lockCircle}><Icon name="lock" size={44} color={ramp.accent2[800]} /></View>
              <Text style={heading(32)}>Keep your pages private?</Text>
              <Text style={[body(15, 'body', 1.5), { color: ramp.neutral[700] }]}>
                Add a 4-digit PIN and the app will ask for it every time it opens. You can change this later.
              </Text>
            </>
          )}
        </View>

        <View style={{ gap: 6 }}>
          <Button label={ONBOARDING_CTA[step]} onPress={next} disabled={!canContinue(step, name)} />
          {step === 3 && <Button label="Not now" variant="ghost" onPress={skipPin} />}
        </View>
      </ScreenFade>
    </View>
  );
}

/** 56px full-width pill used for the reminder choices. */
function WideChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Chip label={label} selected={selected} onPress={onPress} height={56} fill />;
}

const styles = StyleSheet.create({
  back: { width: 44, height: 44, marginLeft: -10, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  input: {
    height: 56, borderRadius: radii.pill, borderWidth: 1.5, borderColor: colors.divider, backgroundColor: ramp.neutral[100],
    paddingHorizontal: 22, fontFamily: 'Figtree_400Regular', fontSize: 18, color: colors.text, marginTop: 8,
  },
  lockCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: ramp.accent2[200], alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
});
```

`mobile/app/onboarding.tsx`:

```tsx
import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';

export default OnboardingScreen;
```

- [ ] **Step 4: Run to verify they pass**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest && npx tsc --noEmit`
Expected: PASS. Then on the emulator: fresh install lands on step 1; dots grow; the keyboard does not cover the CTA on step 2; hardware Back moves back one step.

- [ ] **Step 5: Commit**

```bash
cd /Users/luckyangelo/Dev/journ-al
git add mobile
git commit -m "feat: add four-step onboarding"
```

---

### Task 13: PIN lock, biometrics and app lock overlay

**Files:**
- Create: `mobile/src/lib/pinMachine.ts`, `mobile/src/data/pinVault.ts`, `mobile/src/data/pinVaultInstance.ts`, `mobile/src/services/biometrics.ts`, `mobile/src/features/lock/PinPad.tsx`, `mobile/src/features/lock/LockOverlay.tsx`, `mobile/src/features/lock/reconcileLock.ts`, `mobile/src/features/lock/useRelockOnBackground.ts`, `mobile/app/pin.tsx`
- Modify: `mobile/src/state/lockStore.ts`, `mobile/src/state/index.ts` (reconcile on boot), `mobile/app/_layout.tsx` (overlay + relock hook)
- Test: `mobile/src/lib/pinMachine.test.ts`, `mobile/src/data/pinVault.test.ts`, `mobile/src/services/biometrics.test.ts`, `mobile/src/features/lock/PinPad.test.tsx`, `mobile/src/features/lock/reconcileLock.test.ts`, `mobile/src/features/lock/useRelockOnBackground.test.ts`, `mobile/src/state/lockStore.test.ts`

**Interfaces:**
- Produces:
  - `type PinMode = 'unlock' | 'set' | 'confirm'`; `interface PinState { mode: PinMode; buf: string; tmp: string; err: string; done: null | { kind: 'unlocked' } | { kind: 'set'; pin: string } }`
  - `initialPin(mode: 'unlock' | 'set'): PinState`, `type PinAction = { type: 'press'; digit: string } | { type: 'del' } | { type: 'advance' } | { type: 'unlockResult'; ok: boolean; pin: string }`, `pinReducer(s: PinState, a: PinAction): PinState`, `pinCopy(s: PinState, name: string): { title: string; sub: string; isError: boolean }`, `PIN_ERR_WRONG`, `PIN_ERR_MISMATCH`
  - `interface PinVault { save(pin: string): Promise<void>; verify(pin: string): Promise<boolean>; clear(): Promise<void>; has(): Promise<boolean> }`, `createPinVault(deps: { store: KeyValueStore; digest(input: string): Promise<string>; randomSalt(): Promise<string> }): PinVault`, `pinVault` (real instance: SecureStore + SHA-256 + random salt)
  - `biometricAvailable(): Promise<boolean>`, `promptBiometric(): Promise<boolean>`
  - `<PinPad mode name verify? onUnlocked? onSetComplete? onCancel? biometric? />`, `<LockOverlay />`
  - `useLock` gains `suspended: number` and `withoutRelock<T>(fn: () => Promise<T>): Promise<T>` (used around the system photo/camera/microphone/notification dialogs so they don't re-lock the app)
  - `reconcileLock(lockOn: boolean, vault: Pick<PinVault, 'has'>): Promise<boolean>`

Design decisions: unlock is an overlay above the navigator so a locked app never loses its place or an in-progress draft; the PIN set/confirm flow is the `/pin` route. The app re-locks whenever it goes to the background (the spec: "ask for it every time it opens"). The prototype's "your PIN is …" hint is not built.

- [ ] **Step 1: Write the failing tests**

`mobile/src/lib/pinMachine.test.ts`:

```ts
import { initialPin, pinReducer, pinCopy, PIN_ERR_WRONG, PIN_ERR_MISMATCH, type PinState, type PinAction } from './pinMachine';

const run = (s: PinState, ...actions: PinAction[]) => actions.reduce(pinReducer, s);
const digits = (d: string): PinAction[] => [...d].map((digit) => ({ type: 'press', digit }));

describe('set flow', () => {
  it('goes set -> confirm -> done when both entries match', () => {
    let s = run(initialPin('set'), ...digits('1234'), { type: 'advance' });
    expect(s).toMatchObject({ mode: 'confirm', buf: '', tmp: '1234', err: '' });
    s = run(s, ...digits('1234'), { type: 'advance' });
    expect(s.done).toEqual({ kind: 'set', pin: '1234' });
  });

  it('returns to set with a message when the confirmation differs', () => {
    const s = run(initialPin('set'), ...digits('1234'), { type: 'advance' }, ...digits('1235'), { type: 'advance' });
    expect(s).toMatchObject({ mode: 'set', buf: '', tmp: '', err: PIN_ERR_MISMATCH, done: null });
    expect(PIN_ERR_MISMATCH).toBe('Those didn’t match. Start again.');
  });
});

describe('input edge cases', () => {
  it('ignores taps after four digits', () => {
    expect(run(initialPin('set'), ...digits('123456')).buf).toBe('1234');
  });
  it('backspace on an empty buffer is a no-op', () => {
    const s = initialPin('set');
    expect(pinReducer(s, { type: 'del' })).toEqual(s);
  });
  it('backspace removes the last digit and clears an error', () => {
    const s = run({ ...initialPin('set'), err: PIN_ERR_MISMATCH }, ...digits('12'), { type: 'del' });
    expect(s).toMatchObject({ buf: '1', err: '' });
  });
  it('typing clears a previous error', () => {
    expect(run({ ...initialPin('set'), err: PIN_ERR_MISMATCH }, ...digits('1')).err).toBe('');
  });
  it('advance does nothing until four digits are in', () => {
    const s = run(initialPin('set'), ...digits('12'));
    expect(pinReducer(s, { type: 'advance' })).toEqual(s);
  });
  it('ignores input once finished', () => {
    const done = run(initialPin('set'), ...digits('1234'), { type: 'advance' }, ...digits('1234'), { type: 'advance' });
    expect(run(done, ...digits('9'), { type: 'del' })).toEqual(done);
  });
});

describe('unlock flow', () => {
  it('finishes on a correct PIN', () => {
    const s = run(initialPin('unlock'), ...digits('1234'), { type: 'unlockResult', ok: true, pin: '1234' });
    expect(s.done).toEqual({ kind: 'unlocked' });
  });
  it('clears the dots and shows an error on a wrong PIN', () => {
    const s = run(initialPin('unlock'), ...digits('9999'), { type: 'unlockResult', ok: false, pin: '9999' });
    expect(s).toMatchObject({ buf: '', err: PIN_ERR_WRONG, done: null });
    expect(PIN_ERR_WRONG).toBe('That’s not it. Try again.');
  });
  it('ignores a stale result for digits the user already deleted', () => {
    const s = run(initialPin('unlock'), ...digits('1234'), { type: 'del' }, { type: 'unlockResult', ok: true, pin: '1234' });
    expect(s).toMatchObject({ buf: '123', done: null });
  });
  it('advance never completes an unlock by itself', () => {
    const s = run(initialPin('unlock'), ...digits('1234'), { type: 'advance' });
    expect(s.done).toBeNull();
  });
});

describe('pinCopy', () => {
  it('has the exact titles and subtitles', () => {
    expect(pinCopy(initialPin('unlock'), 'Maya')).toEqual({ title: 'Welcome back, Maya.', sub: 'Enter your PIN', isError: false });
    expect(pinCopy(initialPin('unlock'), '').title).toBe('Welcome back, friend.');
    expect(pinCopy(initialPin('set'), '')).toEqual({ title: 'Choose a PIN', sub: 'Four digits you’ll remember.', isError: false });
    expect(pinCopy({ ...initialPin('set'), mode: 'confirm' }, '')).toEqual({ title: 'Once more', sub: 'Type the same four digits.', isError: false });
    expect(pinCopy({ ...initialPin('set'), err: PIN_ERR_MISMATCH }, '')).toMatchObject({ sub: PIN_ERR_MISMATCH, isError: true });
  });
});
```

`mobile/src/data/pinVault.test.ts`:

```ts
/** @jest-environment node */
import { createPinVault, type KeyValueStore } from './pinVault';

function setup() {
  const mem = new Map<string, string>();
  const store: KeyValueStore = {
    get: async (k) => mem.get(k) ?? null,
    set: async (k, v) => { mem.set(k, v); },
    del: async (k) => { mem.delete(k); },
  };
  let n = 0;
  const vault = createPinVault({ store, digest: async (s) => `h(${s})`, randomSalt: async () => `salt${++n}` });
  return { vault, mem };
}

it('verifies the saved PIN and rejects others', async () => {
  const { vault } = setup();
  await vault.save('1234');
  expect(await vault.verify('1234')).toBe(true);
  expect(await vault.verify('1235')).toBe(false);
});

it('never stores the PIN in plain text', async () => {
  const { vault, mem } = setup();
  await vault.save('4821');
  expect([...mem.values()].join('|')).not.toContain('4821');
});

it('uses a fresh salt for every save', async () => {
  const { vault, mem } = setup();
  await vault.save('1234');
  const first = [...mem.values()][0];
  await vault.save('1234');
  expect([...mem.values()][0]).not.toBe(first);
});

it('reports has() and forgets on clear()', async () => {
  const { vault } = setup();
  expect(await vault.has()).toBe(false);
  expect(await vault.verify('1234')).toBe(false);
  await vault.save('1234');
  expect(await vault.has()).toBe(true);
  await vault.clear();
  expect(await vault.has()).toBe(false);
  expect(await vault.verify('1234')).toBe(false);
});

it('only accepts exactly four digits', async () => {
  const { vault } = setup();
  await expect(vault.save('12a4')).rejects.toThrow();
  await expect(vault.save('123')).rejects.toThrow();
  await vault.save('1234');
  expect(await vault.verify('12a4')).toBe(false);
  expect(await vault.verify('')).toBe(false);
});
```

`mobile/src/services/biometrics.test.ts`:

```ts
import * as LocalAuthentication from 'expo-local-authentication';
import { biometricAvailable, promptBiometric } from './biometrics';

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(), isEnrolledAsync: jest.fn(), authenticateAsync: jest.fn(),
}));
const la = LocalAuthentication as jest.Mocked<typeof LocalAuthentication>;

it('is available only with hardware and an enrolled biometric', async () => {
  la.hasHardwareAsync.mockResolvedValue(true);
  la.isEnrolledAsync.mockResolvedValue(true);
  expect(await biometricAvailable()).toBe(true);
  la.isEnrolledAsync.mockResolvedValue(false);
  expect(await biometricAvailable()).toBe(false);
  la.hasHardwareAsync.mockResolvedValue(false);
  expect(await biometricAvailable()).toBe(false);
});

it('reports the prompt result and treats errors as a failure', async () => {
  la.authenticateAsync.mockResolvedValue({ success: true } as never);
  expect(await promptBiometric()).toBe(true);
  la.authenticateAsync.mockResolvedValue({ success: false, error: 'user_cancel' } as never);
  expect(await promptBiometric()).toBe(false);
  la.authenticateAsync.mockRejectedValue(new Error('boom'));
  expect(await promptBiometric()).toBe(false);
});
```

`mobile/src/features/lock/PinPad.test.tsx`:

```tsx
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PinPad } from './PinPad';

const wrap = (ui: React.ReactElement) =>
  render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{ui}</SafeAreaProvider>);
const tap = (d: string) => fireEvent.press(screen.getByText(d));
const type = (s: string) => [...s].forEach(tap);
const tick = async () => { await act(async () => { jest.advanceTimersByTime(250); }); };

it('set flow: choose, confirm, complete', async () => {
  const onSetComplete = jest.fn();
  wrap(<PinPad mode="set" name="Maya" onSetComplete={onSetComplete} onCancel={() => {}} />);
  expect(screen.getByText('Choose a PIN')).toBeTruthy();
  type('1234'); await tick();
  expect(screen.getByText('Once more')).toBeTruthy();
  type('1234'); await tick();
  expect(onSetComplete).toHaveBeenCalledWith('1234');
});

it('set flow: a mismatch restarts with a message', async () => {
  wrap(<PinPad mode="set" name="Maya" onSetComplete={jest.fn()} onCancel={() => {}} />);
  type('1234'); await tick();
  type('1111'); await tick();
  expect(screen.getByText('Those didn’t match. Start again.')).toBeTruthy();
  expect(screen.getByText('Choose a PIN')).toBeTruthy();
});

it('unlock flow: wrong PIN shows the error, right PIN unlocks', async () => {
  const verify = jest.fn(async (p: string) => p === '2468');
  const onUnlocked = jest.fn();
  wrap(<PinPad mode="unlock" name="Maya" verify={verify} onUnlocked={onUnlocked} />);
  expect(screen.getByText('Welcome back, Maya.')).toBeTruthy();
  type('1111'); await tick();
  expect(screen.getByText('That’s not it. Try again.')).toBeTruthy();
  expect(onUnlocked).not.toHaveBeenCalled();
  type('2468'); await tick();
  expect(onUnlocked).toHaveBeenCalledTimes(1);
});

it('does not verify while fewer than four digits are entered, and backspace works', async () => {
  const verify = jest.fn(async () => false);
  wrap(<PinPad mode="unlock" name="" verify={verify} />);
  type('12'); await tick();
  expect(verify).not.toHaveBeenCalled();
  fireEvent.press(screen.getByLabelText('Delete'));
  fireEvent.press(screen.getByLabelText('Delete'));
  fireEvent.press(screen.getByLabelText('Delete'));
  type('1234'); await tick();
  expect(verify).toHaveBeenCalledTimes(1);
  expect(verify).toHaveBeenCalledWith('1234');
});

it('offers Cancel only while setting a PIN', () => {
  const onCancel = jest.fn();
  const { unmount } = wrap(<PinPad mode="set" name="" onCancel={onCancel} onSetComplete={jest.fn()} />);
  fireEvent.press(screen.getByText('Cancel'));
  expect(onCancel).toHaveBeenCalled();
  unmount();
  wrap(<PinPad mode="unlock" name="" verify={async () => false} />);
  expect(screen.queryByText('Cancel')).toBeNull();
});

it('tries biometrics once on mount in unlock mode', async () => {
  const biometric = jest.fn(async () => true);
  const onUnlocked = jest.fn();
  wrap(<PinPad mode="unlock" name="" verify={async () => false} biometric={biometric} onUnlocked={onUnlocked} />);
  await act(async () => {});
  expect(biometric).toHaveBeenCalledTimes(1);
  expect(onUnlocked).toHaveBeenCalledTimes(1);
});
```

`mobile/src/features/lock/reconcileLock.test.ts`:

```ts
import { reconcileLock } from './reconcileLock';

it('keeps the lock when a PIN exists', async () => {
  expect(await reconcileLock(true, { has: async () => true })).toBe(true);
});
it('drops the lock flag when the PIN is gone (e.g. restored backup) so the user is not locked out', async () => {
  expect(await reconcileLock(true, { has: async () => false })).toBe(false);
});
it('stays off when it was off', async () => {
  expect(await reconcileLock(false, { has: async () => true })).toBe(false);
});
it('keeps the lock if secure storage cannot be read', async () => {
  expect(await reconcileLock(true, { has: async () => { throw new Error('keystore'); } })).toBe(true);
});
```

`mobile/src/state/lockStore.test.ts`:

```ts
import { useLock } from './lockStore';

beforeEach(() => useLock.setState({ locked: false, suspended: 0 }));

it('locks and unlocks', () => {
  useLock.getState().lock();
  expect(useLock.getState().locked).toBe(true);
  useLock.getState().unlock();
  expect(useLock.getState().locked).toBe(false);
});

it('withoutRelock marks the app suspended during the call and for a short tail after', async () => {
  const seen: number[] = [];
  const result = await useLock.getState().withoutRelock(async () => {
    seen.push(useLock.getState().suspended);
    return 'ok';
  });
  expect(result).toBe('ok');
  expect(seen).toEqual([1]);
  expect(useLock.getState().suspended).toBe(1);
  jest.advanceTimersByTime(1100);
  expect(useLock.getState().suspended).toBe(0);
});

it('withoutRelock releases even when the call throws', async () => {
  await expect(useLock.getState().withoutRelock(async () => { throw new Error('x'); })).rejects.toThrow('x');
  jest.advanceTimersByTime(1100);
  expect(useLock.getState().suspended).toBe(0);
});
```

`mobile/src/features/lock/useRelockOnBackground.test.ts`:

```ts
import { AppState } from 'react-native';
import { renderHook } from '@testing-library/react-native';
import { useSettings } from '@/state';
import { useLock } from '@/state/lockStore';
import { useRelockOnBackground } from './useRelockOnBackground';

jest.mock('@/state', () => {
  const { create } = require('zustand');
  return { useSettings: create(() => ({ settings: { lockOn: true } })) };
});

let handler: (s: string) => void = () => {};
beforeEach(() => {
  useLock.setState({ locked: false, suspended: 0 });
  (useSettings as unknown as { setState: (s: unknown) => void }).setState({ settings: { lockOn: true } });
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_t, h) => { handler = h as never; return { remove: jest.fn() } as never; });
});

it('locks when the app leaves the foreground and app lock is on', () => {
  renderHook(() => useRelockOnBackground());
  handler('background');
  expect(useLock.getState().locked).toBe(true);
});

it('does nothing when app lock is off', () => {
  (useSettings as unknown as { setState: (s: unknown) => void }).setState({ settings: { lockOn: false } });
  renderHook(() => useRelockOnBackground());
  handler('background');
  expect(useLock.getState().locked).toBe(false);
});

it('does not lock while a system dialog (picker, camera, permission) is open', () => {
  useLock.setState({ suspended: 1 });
  renderHook(() => useRelockOnBackground());
  handler('background');
  expect(useLock.getState().locked).toBe(false);
});

it('ignores returning to the foreground', () => {
  renderHook(() => useRelockOnBackground());
  handler('active');
  expect(useLock.getState().locked).toBe(false);
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest src/lib/pinMachine.test.ts src/data/pinVault.test.ts src/services src/features/lock src/state/lockStore.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

`mobile/src/lib/pinMachine.ts`:

```ts
export type PinMode = 'unlock' | 'set' | 'confirm';

export interface PinState {
  mode: PinMode;
  buf: string;
  tmp: string;
  err: string;
  done: null | { kind: 'unlocked' } | { kind: 'set'; pin: string };
}

export type PinAction =
  | { type: 'press'; digit: string }
  | { type: 'del' }
  | { type: 'advance' }
  | { type: 'unlockResult'; ok: boolean; pin: string };

export const PIN_ERR_WRONG = 'That’s not it. Try again.';
export const PIN_ERR_MISMATCH = 'Those didn’t match. Start again.';

export const initialPin = (mode: 'unlock' | 'set'): PinState => ({ mode, buf: '', tmp: '', err: '', done: null });

export function pinReducer(s: PinState, a: PinAction): PinState {
  if (s.done) return s;
  switch (a.type) {
    case 'press':
      return s.buf.length >= 4 ? s : { ...s, buf: s.buf + a.digit, err: '' };
    case 'del':
      return s.buf.length === 0 ? s : { ...s, buf: s.buf.slice(0, -1), err: '' };
    case 'advance':
      if (s.buf.length !== 4) return s;
      if (s.mode === 'set') return { ...s, mode: 'confirm', tmp: s.buf, buf: '', err: '' };
      if (s.mode === 'confirm') {
        return s.buf === s.tmp
          ? { ...s, done: { kind: 'set', pin: s.buf }, buf: '' }
          : { ...s, mode: 'set', tmp: '', buf: '', err: PIN_ERR_MISMATCH };
      }
      return s;
    case 'unlockResult':
      if (s.mode !== 'unlock' || s.buf !== a.pin) return s;
      return a.ok ? { ...s, done: { kind: 'unlocked' }, buf: '' } : { ...s, buf: '', err: PIN_ERR_WRONG };
  }
}

export function pinCopy(s: PinState, name: string): { title: string; sub: string; isError: boolean } {
  const title = s.mode === 'unlock' ? `Welcome back, ${name || 'friend'}.` : s.mode === 'set' ? 'Choose a PIN' : 'Once more';
  const sub = s.err || (s.mode === 'unlock' ? 'Enter your PIN' : s.mode === 'set' ? 'Four digits you’ll remember.' : 'Type the same four digits.');
  return { title, sub, isError: !!s.err };
}
```

`mobile/src/data/pinVault.ts`:

```ts
export interface KeyValueStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
}

export interface PinVault {
  save(pin: string): Promise<void>;
  verify(pin: string): Promise<boolean>;
  clear(): Promise<void>;
  has(): Promise<boolean>;
}

const KEY = 'journal.pin.v1';
const isPin = (p: string) => /^\d{4}$/.test(p);

export function createPinVault(deps: {
  store: KeyValueStore;
  digest(input: string): Promise<string>;
  randomSalt(): Promise<string>;
}): PinVault {
  return {
    async save(pin) {
      if (!isPin(pin)) throw new Error('PIN must be exactly four digits');
      const salt = await deps.randomSalt();
      await deps.store.set(KEY, `${salt}:${await deps.digest(salt + pin)}`);
    },
    async verify(pin) {
      if (!isPin(pin)) return false;
      const stored = await deps.store.get(KEY);
      if (!stored) return false;
      const i = stored.indexOf(':');
      return stored.slice(i + 1) === (await deps.digest(stored.slice(0, i) + pin));
    },
    clear: () => deps.store.del(KEY),
    async has() {
      return (await deps.store.get(KEY)) !== null;
    },
  };
}
```

`mobile/src/data/pinVaultInstance.ts` (the only file that touches the native modules):

```ts
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { createPinVault } from './pinVault';

const hex = (b: Uint8Array) => [...b].map((x) => x.toString(16).padStart(2, '0')).join('');

export const pinVault = createPinVault({
  store: {
    get: (k) => SecureStore.getItemAsync(k),
    set: (k, v) => SecureStore.setItemAsync(k, v),
    del: (k) => SecureStore.deleteItemAsync(k),
  },
  digest: (s) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, s),
  randomSalt: async () => hex(await Crypto.getRandomBytesAsync(16)),
});
```

`mobile/src/services/biometrics.ts`:

```ts
import * as LocalAuthentication from 'expo-local-authentication';

export async function biometricAvailable(): Promise<boolean> {
  try {
    return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
  } catch {
    return false;
  }
}

export async function promptBiometric(): Promise<boolean> {
  try {
    const r = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock your journal', cancelLabel: 'Use PIN', disableDeviceFallback: true });
    return r.success;
  } catch {
    return false;
  }
}
```

`mobile/src/features/lock/reconcileLock.ts`:

```ts
import type { PinVault } from '@/data/pinVault';

/** An OS backup can restore the database but not the keystore; never lock the user out of a PIN that no longer exists. */
export async function reconcileLock(lockOn: boolean, vault: Pick<PinVault, 'has'>): Promise<boolean> {
  if (!lockOn) return false;
  try {
    return await vault.has();
  } catch {
    return true;
  }
}
```

Replace `mobile/src/state/lockStore.ts`:

```ts
import { create } from 'zustand';

interface LockState {
  locked: boolean;
  suspended: number;
  lock(): void;
  unlock(): void;
  withoutRelock<T>(fn: () => Promise<T>): Promise<T>;
}

export const useLock = create<LockState>()((set) => ({
  locked: false,
  suspended: 0,
  lock: () => set({ locked: true }),
  unlock: () => set({ locked: false }),
  async withoutRelock(fn) {
    set((s) => ({ suspended: s.suspended + 1 }));
    try {
      return await fn();
    } finally {
      // The OS can report "background" a beat after the system dialog closes, so hold the guard briefly.
      setTimeout(() => set((s) => ({ suspended: Math.max(0, s.suspended - 1) })), 1000);
    }
  },
}));
```

`mobile/src/features/lock/useRelockOnBackground.ts`:

```ts
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useSettings } from '@/state';
import { useLock } from '@/state/lockStore';

export function useRelockOnBackground(): void {
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') return;
      const { suspended, lock } = useLock.getState();
      if (useSettings.getState().settings.lockOn && suspended === 0) lock();
    });
    return () => sub.remove();
  }, []);
}
```

`mobile/src/features/lock/PinPad.tsx`:

```tsx
import { useEffect, useReducer, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { initialPin, pinCopy, pinReducer } from '@/lib/pinMachine';
import { colors, ramp } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';

interface Props {
  mode: 'unlock' | 'set';
  name: string;
  verify?: (pin: string) => Promise<boolean>;
  onUnlocked?: () => void;
  onSetComplete?: (pin: string) => void;
  onCancel?: () => void;
  biometric?: () => Promise<boolean>;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

export function PinPad({ mode, name, verify, onUnlocked, onSetComplete, onCancel, biometric }: Props) {
  const { top, bottom } = useSafeAreaInsets();
  const [s, dispatch] = useReducer(pinReducer, mode, initialPin);
  const copy = pinCopy(s, name);

  // Four digits in: wait a beat so the last dot is visible, then advance or verify.
  useEffect(() => {
    if (s.done || s.buf.length !== 4) return;
    const pin = s.buf;
    const t = setTimeout(async () => {
      if (s.mode === 'unlock') {
        const ok = verify ? await verify(pin).catch(() => false) : false;
        dispatch({ type: 'unlockResult', ok, pin });
      } else {
        dispatch({ type: 'advance' });
      }
    }, 180);
    return () => clearTimeout(t);
  }, [s.buf, s.mode, s.done, verify]);

  useEffect(() => {
    if (!s.done) return;
    if (s.done.kind === 'unlocked') onUnlocked?.();
    else onSetComplete?.(s.done.pin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.done]);

  const triedBiometric = useRef(false);
  const tryBiometric = async () => {
    if (biometric && (await biometric())) onUnlocked?.();
  };
  useEffect(() => {
    if (mode !== 'unlock' || !biometric || triedBiometric.current) return;
    triedBiometric.current = true;
    tryBiometric();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', paddingTop: top + 56, paddingBottom: bottom + 26, paddingHorizontal: 30, gap: 14, backgroundColor: colors.bg }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: ramp.accent2[200], alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="lock" size={26} color={ramp.accent2[800]} />
      </View>
      <Text style={[heading(28), { textAlign: 'center' }]}>{copy.title}</Text>
      <Text accessibilityLiveRegion="polite" style={[body(15), { minHeight: 22, textAlign: 'center', color: copy.isError ? ramp.accent[700] : ramp.neutral[700] }]}>
        {copy.sub}
      </Text>
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 10, marginBottom: 26 }}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: s.err ? colors.accent : colors.text, backgroundColor: i < s.buf.length ? colors.text : 'transparent' }}
          />
        ))}
      </View>
      <View style={{ width: 76 * 3 + 26 * 2, flexDirection: 'row', flexWrap: 'wrap', columnGap: 26, rowGap: 14 }}>
        {KEYS.map((k, i) =>
          k === '' ? (
            <View key={i} style={{ width: 76, height: 76 }} />
          ) : (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={k === 'del' ? 'Delete' : k}
              onPress={() => dispatch(k === 'del' ? { type: 'del' } : { type: 'press', digit: k })}
              style={({ pressed }) => ({
                width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center',
                backgroundColor: k === 'del' ? 'transparent' : pressed ? ramp.accent[300] : ramp.neutral[200],
              })}
            >
              {k === 'del' ? <Icon name="delete" size={26} /> : <Text style={heading(28, 1)}>{k}</Text>}
            </Pressable>
          ),
        )}
      </View>
      <View style={{ marginTop: 'auto', alignItems: 'center', gap: 4 }}>
        {mode === 'unlock' && biometric ? <Button label="Use biometrics" variant="ghost" onPress={tryBiometric} height={44} /> : null}
        {mode === 'set' && onCancel ? <Button label="Cancel" variant="ghost" onPress={onCancel} height={44} /> : null}
      </View>
    </View>
  );
}
```

(`getByText('1')` in the tests matches the digit; `getByLabelText('Delete')` matches the backspace key.)

`mobile/src/features/lock/LockOverlay.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { pinVault } from '@/data/pinVaultInstance';
import { biometricAvailable, promptBiometric } from '@/services/biometrics';
import { useSettings } from '@/state';
import { useLock } from '@/state/lockStore';
import { PinPad } from './PinPad';

export function LockOverlay() {
  const locked = useLock((s) => s.locked);
  const unlock = useLock((s) => s.unlock);
  const name = useSettings((s) => s.settings.name);
  const [bio, setBio] = useState<boolean | null>(null); // null = still checking; PinPad mounts after this resolves

  useEffect(() => {
    if (!locked) {
      setBio(null);
      return;
    }
    let alive = true;
    biometricAvailable().then((v) => alive && setBio(v));
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true); // Back must not reveal pages behind the lock
    return () => {
      alive = false;
      sub.remove();
    };
  }, [locked]);

  if (!locked || bio === null) return null;
  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 100 }]}>
      <PinPad mode="unlock" name={name} verify={pinVault.verify} onUnlocked={unlock} biometric={bio ? promptBiometric : undefined} />
    </View>
  );
}
```

`mobile/app/pin.tsx`:

```tsx
import { useRouter, useLocalSearchParams } from 'expo-router';
import { pinVault } from '@/data/pinVaultInstance';
import { PinPad } from '@/features/lock/PinPad';
import { useSettings } from '@/state';
import { useToast } from '@/state/toastStore';

export default function PinRoute() {
  const router = useRouter();
  const { after } = useLocalSearchParams<{ after?: string }>();
  const settings = useSettings((s) => s.settings);
  const update = useSettings((s) => s.update);
  const show = useToast((s) => s.show);
  const target = after === 'me' ? '/(tabs)/me' : '/(tabs)';

  return (
    <PinPad
      mode="set"
      name={settings.name}
      onCancel={async () => {
        await update({ onboarded: true });
        router.replace(target);
      }}
      onSetComplete={async (pin) => {
        try {
          await pinVault.save(pin);
          await update({ lockOn: true, onboarded: true });
          show('App lock is on');
          router.replace(target);
        } catch {
          show('Couldn’t save your PIN. Try again.');
          router.replace('/pin');
        }
      }}
    />
  );
}
```

Modify `mobile/src/state/index.ts` `bootstrapState` (after loading, before the lock check):

```ts
import { reconcileLock } from '@/features/lock/reconcileLock';
import { pinVault } from '@/data/pinVaultInstance';
// ...
  const { lockOn, onboarded } = useSettings.getState().settings;
  const stillOn = await reconcileLock(lockOn, pinVault);
  if (lockOn && !stillOn) await useSettings.getState().update({ lockOn: false });
  if (stillOn && onboarded) useLock.getState().lock();
```

(replacing the earlier `if (lockOn && onboarded) …` lines).

Modify `mobile/app/_layout.tsx`: import `LockOverlay` and `useRelockOnBackground`; call `useRelockOnBackground()` at the top of `RootLayout` (before any early return, to respect the rules of hooks) and render `<LockOverlay />` after `<Stack … />` and before `<ToastHost />`.

- [ ] **Step 4: Run to verify they pass**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest && npx tsc --noEmit`
Expected: PASS. On the emulator: finish onboarding with "Set a PIN"; background and reopen the app → the PIN pad appears; a wrong PIN shows the error and clears the dots; Android Back does not dismiss the lock.

- [ ] **Step 5: Commit**

```bash
cd /Users/luckyangelo/Dev/journ-al
git add mobile
git commit -m "feat: add PIN lock with secure storage, biometrics and re-lock on background"
```

---

### Task 14: Entry card and the Today screen

**Files:**
- Create: `mobile/src/ui/EntryCard.tsx`, `mobile/src/features/today/deck.ts`, `mobile/src/features/today/CheckInCard.tsx`, `mobile/src/features/today/PromptDeck.tsx`, `mobile/src/features/today/TodayScreen.tsx`
- Modify (replace the Task 11 stub): `mobile/app/(tabs)/index.tsx`
- Test: `mobile/src/ui/EntryCard.test.tsx`, `mobile/src/features/today/deck.test.ts`, `mobile/src/features/today/TodayScreen.test.tsx`

**Interfaces:**
- Consumes: `summarizeEntry`, `useEntries`, `useSettings`, `useCheckin`, `useTimelineUi`, `MoodBlob`, `MoodSlider`, `Chip`, `PROMPTS`, `promptFor`, `MOODS`, `moodIndex`, `fmtLong`, `greeting`, `todayIso`, `Avatar`.
- Produces:
  - `<EntryCard entry={Entry} onPress={() => void} variant?={'date' | 'time'} lines?={number} />` (variant `time` shows the clock time instead of the date, used for a single day; `lines` default 3, pass `0` for no clamp)
  - `FEELINGS = ['grateful','tired','anxious','proud','lonely','calm']`
  - `deckCards(deckIdx: number, moodIdx: number): DeckCard[]` returned in paint order (depth 2, 1, 0); `DeckCard = { n: number; depth: 0 | 1 | 2; bg: string; ink: string; text: string; kicker: string; counter: string }`
  - `behindTransform(depth: 1 | 2, shift: number): { translateY: number; scale: number }`, `shiftFor(dx: number): number`, `SWIPE_THRESHOLD = 90`, `FLY_DISTANCE = 460`, `SHIFT_DISTANCE = 120`
  - `<TodayScreen />`

- [ ] **Step 1: Write the failing tests**

`mobile/src/features/today/deck.test.ts`:

```ts
import { ramp } from '@/theme/tokens';
import { PROMPTS } from '@/domain/prompts';
import { deckCards, behindTransform, shiftFor, SWIPE_THRESHOLD, FLY_DISTANCE } from './deck';

describe('deckCards', () => {
  it('returns three cards in paint order with the top card last', () => {
    const cards = deckCards(0, 2);
    expect(cards.map((c) => c.depth)).toEqual([2, 1, 0]);
    expect(cards[2]).toMatchObject({
      n: 0, text: PROMPTS[2], bg: ramp.accent[200], ink: ramp.accent[900], kicker: 'For an okay day', counter: '1 / 6',
    });
    expect(cards[1]).toMatchObject({ n: 1, bg: ramp.accent2[200], ink: ramp.accent2[900] });
    expect(cards[0]).toMatchObject({ n: 2, bg: ramp.neutral[200], ink: ramp.neutral[900] });
  });

  it('cycles colours and the counter as the deck advances', () => {
    expect(deckCards(3, 0)[2]).toMatchObject({ bg: ramp.accent[200], counter: '4 / 6' });
    expect(deckCards(6, 0)[2].counter).toBe('1 / 6');
  });

  it('uses the right article in the kicker', () => {
    expect(deckCards(0, 0)[2].kicker).toBe('For a heavy day');
    expect(deckCards(0, 4)[2].kicker).toBe('For a bright day');
    expect(deckCards(0, 2)[2].kicker).toBe('For an okay day');
  });

  it('offsets the prompt order by the mood bucket', () => {
    expect(deckCards(0, 0)[2].text).toBe(PROMPTS[0]);
    expect(deckCards(0, 3)[2].text).toBe(PROMPTS[3]);
  });
});

describe('deck motion', () => {
  it('stacks cards behind the top one and lifts them as the top card is dragged away', () => {
    expect(behindTransform(1, 0)).toEqual({ translateY: 14, scale: 0.95 });
    expect(behindTransform(2, 0)).toEqual({ translateY: 28, scale: 0.9 });
    expect(behindTransform(1, 1)).toEqual({ translateY: 0, scale: 1 });
    expect(behindTransform(2, 1)).toEqual({ translateY: 14, scale: 0.95 });
  });
  it('maps drag distance to a 0..1 shift', () => {
    expect(shiftFor(0)).toBe(0);
    expect(shiftFor(-60)).toBe(0.5);
    expect(shiftFor(400)).toBe(1);
  });
  it('has the spec thresholds', () => {
    expect(SWIPE_THRESHOLD).toBe(90);
    expect(FLY_DISTANCE).toBe(460);
  });
});
```

`mobile/src/ui/EntryCard.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { Entry } from '@/domain/types';
import { EntryCard } from './EntryCard';

const entry = (over: Partial<Entry> = {}): Entry => ({
  id: 'a', createdAt: 1, date: '2026-10-03', time: '6:12 pm', mood: 84, feelings: [], text: 'Found a bench by the river.',
  prompt: '', vis: 'public', photos: [{ id: '1', uri: '' }, { id: '2', uri: '' }], voices: [], stickers: [], ...over,
});

it('shows date, mood, audience tag, text and media summary', () => {
  render(<EntryCard entry={entry()} onPress={() => {}} />);
  expect(screen.getByText('Sat, 3 Oct · Bright')).toBeTruthy();
  expect(screen.getByText('Public')).toBeTruthy();
  expect(screen.getByText('Found a bench by the river.')).toBeTruthy();
  expect(screen.getByText('2 photos')).toBeTruthy();
});

it('shows the clock time instead of the date in the day variant, and no tag for private pages', () => {
  render(<EntryCard entry={entry({ vis: 'private' })} variant="time" onPress={() => {}} />);
  expect(screen.getByText('6:12 pm · Bright')).toBeTruthy();
  expect(screen.queryByText('Public')).toBeNull();
});

it('says "No words, just moments." for a page with only a sticker', () => {
  render(<EntryCard entry={entry({ text: '', photos: [], stickers: ['calm'], vis: 'private' })} onPress={() => {}} />);
  expect(screen.getByText('No words, just moments.')).toBeTruthy();
  expect(screen.getByText('calm')).toBeTruthy();
});

it('opens on press and clamps long text to three lines by default', () => {
  const onPress = jest.fn();
  render(<EntryCard entry={entry({ text: 'x '.repeat(400) })} onPress={onPress} />);
  fireEvent.press(screen.getByRole('button'));
  expect(onPress).toHaveBeenCalled();
  expect(screen.getByTestId('entry-text').props.numberOfLines).toBe(3);
});
```

`mobile/src/features/today/TodayScreen.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { demoEntries } from '@/domain/demoData';
import { useCheckin } from '@/state/checkinStore';
import { TodayScreen } from './TodayScreen';

const mockPush = jest.fn();
const mockNavigate = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, navigate: mockNavigate }), usePathname: () => '/' }));
jest.mock('@/state', () => {
  const { create } = require('zustand');
  const { demoEntries } = require('@/domain/demoData');
  return {
    useSettings: create(() => ({ settings: { name: 'Maya', remind: true, remindTime: '9:00 pm', lockOn: false, onboarded: true } })),
    useEntries: create(() => ({ entries: demoEntries('2026-10-08') })),
  };
});

const wrap = () =>
  render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <TodayScreen />
    </SafeAreaProvider>,
  );

beforeEach(() => { jest.clearAllMocks(); useCheckin.setState({ mood: 62, feelings: [] }); });

it('greets by name and shows the check-in, prompts and the two latest pages', () => {
  wrap();
  expect(screen.getByText(/, Maya\.$/)).toBeTruthy();
  expect(screen.getByText('How are you arriving?')).toBeTruthy();
  expect(screen.getByText('Good')).toBeTruthy();
  expect(screen.getByText('Nice. Hold onto it')).toBeTruthy();
  expect(screen.getByText('Tonight’s prompts')).toBeTruthy();
  expect(screen.getByText('Wed, 7 Oct · Good')).toBeTruthy();
  expect(screen.getByText('Tue, 6 Oct · Low')).toBeTruthy();
  expect(screen.queryByText('Mon, 5 Oct · Okay')).toBeNull(); // only the two latest pages
});

it('toggles feeling chips', () => {
  wrap();
  fireEvent.press(screen.getByRole('button', { name: 'tired' }));
  expect(useCheckin.getState().feelings).toEqual(['tired']);
  fireEvent.press(screen.getByRole('button', { name: 'tired' }));
  expect(useCheckin.getState().feelings).toEqual([]);
});

it('starts a page from the top prompt card', () => {
  wrap();
  const buttons = screen.getAllByText('Write this');
  fireEvent.press(buttons[buttons.length - 1]); // cards are painted back to front, so the top card is last
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/write', params: { prompt: expect.any(String) } });
});

it('"See all" opens the Timeline in list mode', () => {
  wrap();
  fireEvent.press(screen.getByText('See all'));
  expect(mockNavigate).toHaveBeenCalledWith('/timeline');
});

it('opens a recent page for editing', () => {
  wrap();
  fireEvent.press(screen.getAllByRole('button', { name: /Made pasta|Presentation/ })[0]);
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/write', params: { entryId: expect.any(String) } });
});
```

(The last test uses the card's accessible name, which `EntryCard` builds from its text; with demo data the two latest pages begin "Made pasta…" and "Presentation…". `demoEntries('2026-10-08')` is fixed so the test is deterministic; the date line shows the real current date, which the test does not assert.)

- [ ] **Step 2: Run to verify they fail**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest src/features/today src/ui/EntryCard.test.tsx`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

`mobile/src/features/today/deck.ts`:

```ts
import { promptFor } from '@/domain/prompts';
import { MOODS } from '@/lib/mood';
import { ramp } from '@/theme/tokens';

export const SWIPE_THRESHOLD = 90;
export const FLY_DISTANCE = 460;
export const SHIFT_DISTANCE = 120;
export const FEELINGS = ['grateful', 'tired', 'anxious', 'proud', 'lonely', 'calm'];

const COLORS = [
  [ramp.accent[200], ramp.accent[900]],
  [ramp.accent2[200], ramp.accent2[900]],
  [ramp.neutral[200], ramp.neutral[900]],
] as const;

export interface DeckCard { n: number; depth: 0 | 1 | 2; bg: string; ink: string; text: string; kicker: string; counter: string }

const article = (w: string) => (/^[aeiou]/i.test(w) ? 'an' : 'a');

export function deckCards(deckIdx: number, moodIdx: number): DeckCard[] {
  const word = MOODS[moodIdx][0].toLowerCase();
  return ([2, 1, 0] as const).map((depth) => {
    const n = deckIdx + depth;
    return {
      n, depth, bg: COLORS[n % 3][0], ink: COLORS[n % 3][1], text: promptFor(n, moodIdx),
      kicker: `For ${article(word)} ${word} day`, counter: `${(n % 6) + 1} / 6`,
    };
  });
}

export const shiftFor = (dx: number): number => Math.min(1, Math.abs(dx) / SHIFT_DISTANCE);

export function behindTransform(depth: 1 | 2, shift: number): { translateY: number; scale: number } {
  const d = depth - shift;
  return { translateY: d * 14, scale: 1 - d * 0.05 };
}
```

`mobile/src/ui/EntryCard.tsx`:

```tsx
import { Pressable, Text, View } from 'react-native';
import { summarizeEntry } from '@/domain/entrySummary';
import type { Entry } from '@/domain/types';
import { radii, ramp, shadows } from '@/theme/tokens';
import { body } from '@/theme/type';

interface Props { entry: Entry; onPress: () => void; variant?: 'date' | 'time'; lines?: number }

export function EntryCard({ entry, onPress, variant = 'date', lines = 3 }: Props) {
  const s = summarizeEntry(entry);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={s.text}
      onPress={onPress}
      style={({ pressed }) => [
        { backgroundColor: pressed ? ramp.accent[100] : ramp.neutral[100], borderRadius: radii.card, paddingVertical: 16, paddingHorizontal: 18, gap: 8 },
        shadows.sm,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: s.color }} />
        <Text style={[body(12, 'semi'), { color: ramp.neutral[700] }]}>
          {variant === 'date' ? s.dateLabel : s.time} · {s.moodLabel}
        </Text>
        {s.visLabel ? (
          <View style={{ marginLeft: 'auto', paddingVertical: 3, paddingHorizontal: 10, borderRadius: radii.pill, backgroundColor: s.visBg }}>
            <Text style={[body(11, 'bold'), { color: s.visFg }]}>{s.visLabel}</Text>
          </View>
        ) : null}
      </View>
      <Text testID="entry-text" numberOfLines={lines || undefined} style={body(16, 'body', 1.45)}>
        {s.text}
      </Text>
      {s.meta ? <Text style={[body(12, 'semi'), { color: ramp.accent2[700] }]}>{s.meta}</Text> : null}
    </Pressable>
  );
}
```

`mobile/src/features/today/CheckInCard.tsx`:

```tsx
import { Text, View } from 'react-native';
import { MOODS, moodIndex } from '@/lib/mood';
import { useCheckin } from '@/state/checkinStore';
import { radii, ramp, colors } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { Chip } from '@/ui/Chip';
import { MoodBlob } from '@/ui/MoodBlob';
import { MoodSlider } from '@/ui/MoodSlider';
import { FEELINGS } from './deck';

export function CheckInCard() {
  const { mood, feelings, setMood, toggleFeeling } = useCheckin();
  const [label, hint] = MOODS[moodIndex(mood)];
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radii.container, paddingTop: 22, paddingHorizontal: 20, paddingBottom: 18, gap: 18 }}>
      <Text style={body(15, 'semi')}>How are you arriving?</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
        <MoodBlob value={mood} size={88} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={heading(30)}>{label}</Text>
          <Text style={[body(13), { color: ramp.neutral[700] }]}>{hint}</Text>
        </View>
      </View>
      <MoodSlider value={mood} onChange={setMood} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: -10 }}>
        <Text style={[body(12), { color: ramp.neutral[700] }]}>Heavy</Text>
        <Text style={[body(12), { color: ramp.neutral[700] }]}>Bright</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {FEELINGS.map((f) => (
          <Chip key={f} label={f} selected={feelings.includes(f)} onPress={() => toggleFeeling(f)} />
        ))}
      </View>
    </View>
  );
}
```

`mobile/src/features/today/PromptDeck.tsx`:

```tsx
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { colors, radii, ramp, shadows } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { FLY_DISTANCE, SHIFT_DISTANCE, SWIPE_THRESHOLD, deckCards, type DeckCard } from './deck';

const EASE = Easing.bezier(0.3, 0.9, 0.4, 1);

export function PromptDeck({ moodIdx, onWrite }: { moodIdx: number; onWrite: (prompt: string) => void }) {
  const [idx, setIdx] = useState(0);
  const tx = useSharedValue(0);
  const advance = useCallback(() => {
    setIdx((i) => i + 1);
    tx.value = 0;
  }, [tx]);

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-14, 14])
    .onUpdate((e) => { tx.value = e.translationX; })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > SWIPE_THRESHOLD) {
        const dir = e.translationX > 0 ? 1 : -1;
        tx.value = withTiming(dir * FLY_DISTANCE, { duration: 260, easing: EASE }, (finished) => {
          if (finished) runOnJS(advance)();
        });
      } else {
        tx.value = withTiming(0, { duration: 260, easing: EASE });
      }
    });

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text style={body(15, 'semi')}>Tonight’s prompts</Text>
        <Text style={[body(12), { color: ramp.neutral[700] }]}>swipe to skip</Text>
      </View>
      <View style={{ height: 244 }}>
        {deckCards(idx, moodIdx).map((c) => (
          <Card key={c.n} card={c} tx={tx} pan={pan} onWrite={() => onWrite(c.text)} />
        ))}
      </View>
    </View>
  );
}

function Card({ card, tx, pan, onWrite }: { card: DeckCard; tx: SharedValue<number>; pan: ReturnType<typeof Gesture.Pan>; onWrite: () => void }) {
  const top = card.depth === 0;
  const style = useAnimatedStyle(() => {
    if (top) return { transform: [{ translateX: tx.value }, { rotate: `${tx.value / 16}deg` }] };
    const shift = interpolate(Math.abs(tx.value), [0, SHIFT_DISTANCE], [0, 1], 'clamp');
    const d = card.depth - shift;
    return { transform: [{ translateY: d * 14 }, { scale: 1 - d * 0.05 }] };
  });

  const body_ = (
    <Animated.View
      style={[
        { position: 'absolute', left: 0, right: 0, top: 0, height: 212, borderRadius: radii.container, backgroundColor: card.bg, padding: 22, justifyContent: 'space-between', zIndex: 10 - card.depth },
        shadows.sm,
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[body(11, 'bold'), { color: card.ink, letterSpacing: 0.88, textTransform: 'uppercase' }]}>{card.kicker}</Text>
        <Text style={[body(12), { color: card.ink, opacity: 0.75 }]}>{card.counter}</Text>
      </View>
      <Text style={[heading(23, 1.2), { color: card.ink }]}>{card.text}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityElementsHidden={!top}
        importantForAccessibility={top ? 'yes' : 'no-hide-descendants'}
        pointerEvents={top ? 'auto' : 'none'}
        onPress={onWrite}
        style={({ pressed }) => ({ alignSelf: 'flex-start', height: 44, paddingHorizontal: 20, borderRadius: radii.pill, justifyContent: 'center', backgroundColor: pressed ? ramp.accent[600] : colors.accent })}
      >
        <Text style={[heading(15, 1), { color: colors.bg }]}>Write this</Text>
      </Pressable>
    </Animated.View>
  );
  return top ? <GestureDetector gesture={pan}>{body_}</GestureDetector> : body_;
}
```

`mobile/src/features/today/TodayScreen.tsx`:

```tsx
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { moodIndex } from '@/lib/mood';
import { fmtLong, greeting, todayIso } from '@/lib/dates';
import { useEntries, useSettings } from '@/state';
import { useCheckin } from '@/state/checkinStore';
import { useTimelineUi } from '@/state/timelineStore';
import { ramp } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { Avatar } from '@/ui/Avatar';
import { EntryCard } from '@/ui/EntryCard';
import { Screen } from '@/ui/Screen';
import { CheckInCard } from './CheckInCard';
import { PromptDeck } from './PromptDeck';

export function TodayScreen() {
  const router = useRouter();
  const name = useSettings((s) => s.settings.name);
  const entries = useEntries((s) => s.entries);
  const mood = useCheckin((s) => s.mood);
  const today = todayIso();

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[body(13, 'semi'), { color: ramp.neutral[700] }]}>{fmtLong(today)}</Text>
        <Avatar initial={(name || 'M').trim().charAt(0).toUpperCase()} onPress={() => router.navigate('/me')} />
      </View>
      <Text style={heading(34, 1.08)}>{`${greeting(new Date().getHours())}, ${name || 'friend'}.`}</Text>
      <CheckInCard />
      <PromptDeck moodIdx={moodIndex(mood)} onWrite={(prompt) => router.push({ pathname: '/write', params: { prompt } })} />
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text style={body(15, 'semi')}>Recent pages</Text>
          <Pressable
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => { useTimelineUi.getState().setMode('list'); router.navigate('/timeline'); }}
          >
            <Text style={[body(13, 'semi'), { color: ramp.accent[700] }]}>See all</Text>
          </Pressable>
        </View>
        {entries.slice(0, 2).map((e) => (
          <EntryCard key={e.id} entry={e} onPress={() => router.push({ pathname: '/write', params: { entryId: e.id } })} />
        ))}
        {entries.length === 0 ? (
          <Text style={[body(15), { color: ramp.neutral[700] }]}>Your first page is one tap away.</Text>
        ) : null}
      </View>
    </Screen>
  );
}
```

`mobile/app/(tabs)/index.tsx`:

```tsx
import { TodayScreen } from '@/features/today/TodayScreen';

export default TodayScreen;
```

- [ ] **Step 4: Run to verify they pass, then check the interaction on a device**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest && npx tsc --noEmit`
Expected: PASS.

On the emulator with `EXPO_PUBLIC_DEMO_DATA=1`: dragging the slider changes blob colour, shape and tilt without lag; dragging the top prompt card rotates it, releasing past ~90px flings it and the next card rises into place; a short drag springs back; vertical scrolling over the deck still works; "Write this" opens `/write` (404 until Task 16, which is expected).

- [ ] **Step 5: Commit**

```bash
cd /Users/luckyangelo/Dev/journ-al
git add mobile
git commit -m "feat: add entry card and Today screen with check-in and prompt deck"
```

### Task 15: Timeline (calendar and list)

**Files:**
- Create: `mobile/src/features/timeline/groupByMonth.ts`, `mobile/src/features/timeline/MonthCalendar.tsx`, `mobile/src/features/timeline/TimelineScreen.tsx`
- Modify (replace Task 11 stub): `mobile/app/(tabs)/timeline.tsx`
- Test: `mobile/src/features/timeline/groupByMonth.test.ts`, `mobile/src/features/timeline/TimelineScreen.test.tsx`

**Interfaces:**
- Consumes: `monthGrid`, `shiftMonth`, `MONTHS`, `fmtLong`, `todayIso`, `moodColor`, `useEntries`, `useTimelineUi` (`mode`, `year`, `month`, `selDay`, `setMode`, `select`, `shift`), `EntryCard`, `Segmented`, `Icon`, `Screen`.
- Produces:
  - `groupByMonth(entries: Entry[]): { title: string /* 'October 2026' */; entries: Entry[] }[]` (input already newest-first)
  - `<MonthCalendar year month today selDay entries onSelect={(iso: string) => void} onPrev onNext />`
  - `<TimelineScreen />`
  - Write route contract used here: `router.push({ pathname: '/write', params: { date } })` and `{ entryId }`.

- [ ] **Step 1: Write the failing tests**

`mobile/src/features/timeline/groupByMonth.test.ts`:

```ts
import { demoEntries } from '@/domain/demoData';
import { groupByMonth } from './groupByMonth';

it('groups newest-first entries under month headings', () => {
  const groups = groupByMonth(demoEntries('2026-10-08'));
  expect(groups.map((g) => [g.title, g.entries.length])).toEqual([['October 2026', 5], ['September 2026', 3]]);
});

it('returns nothing for no entries', () => {
  expect(groupByMonth([])).toEqual([]);
});

it('keeps the same month in different years apart', () => {
  const [a, b] = demoEntries('2026-10-08');
  const groups = groupByMonth([a, { ...b, date: '2025-10-06' }]);
  expect(groups.map((g) => g.title)).toEqual(['October 2026', 'October 2025']);
});
```

`mobile/src/features/timeline/TimelineScreen.test.tsx`:

```tsx
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTimelineUi } from '@/state/timelineStore';
import { TimelineScreen } from './TimelineScreen';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }), usePathname: () => '/timeline' }));
jest.mock('@/state', () => {
  const { create } = require('zustand');
  const { demoEntries } = require('@/domain/demoData');
  return { useEntries: create(() => ({ entries: demoEntries('2026-10-08') })) };
});

const wrap = () =>
  render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <TimelineScreen />
    </SafeAreaProvider>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  jest.setSystemTime(new Date(2026, 9, 8, 21, 41));
  useTimelineUi.setState({ mode: 'cal', year: 2026, month: 9, selDay: '2026-10-08' });
});

describe('calendar', () => {
  it('shows the month, a Monday-first header and the empty state for a day without pages', () => {
    wrap();
    expect(screen.getByText('Your pages')).toBeTruthy();
    expect(screen.getByText('October 2026')).toBeTruthy();
    expect(screen.getAllByText('M').length).toBeGreaterThan(0);
    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.getByText('Nothing written this day.')).toBeTruthy();
  });

  it('selecting a day with a page lists it with its time, and opens it for editing', () => {
    wrap();
    fireEvent.press(screen.getByLabelText('Saturday, 3 October, 1 page'));
    expect(screen.getByText('Saturday, 3 October')).toBeTruthy();
    expect(screen.getByText('6:12 pm · Bright')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: /Found a bench/ }));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/write', params: { entryId: 'demo-4' } });
  });

  it('writes for a past day that has no page', () => {
    wrap();
    fireEvent.press(screen.getByLabelText('Sunday, 4 October'));
    fireEvent.press(screen.getByText('Write for this day'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/write', params: { date: '2026-10-04' } });
  });

  it('disables future days', () => {
    wrap();
    expect(screen.getByLabelText('Friday, 9 October')).toBeDisabled();
  });

  it('navigates months, wrapping the year', () => {
    useTimelineUi.setState({ year: 2026, month: 11, selDay: '2026-10-08' });
    wrap();
    expect(screen.getByText('December 2026')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Next month'));
    expect(screen.getByText('January 2027')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Previous month'));
    fireEvent.press(screen.getByLabelText('Previous month'));
    expect(screen.getByText('November 2026')).toBeTruthy();
  });

  it('hides "Write for this day" when the selected day is in the future', () => {
    useTimelineUi.setState({ selDay: '2026-10-20' });
    wrap();
    expect(screen.getByText('Nothing written this day.')).toBeTruthy();
    expect(screen.queryByText('Write for this day')).toBeNull();
  });
});

describe('list', () => {
  it('groups all pages under month headings', async () => {
    wrap();
    await act(async () => { fireEvent.press(screen.getByText('List')); });
    expect(screen.getByText('October 2026')).toBeTruthy();
    expect(screen.getByText('September 2026')).toBeTruthy();
    expect(screen.getByText('Wed, 7 Oct · Good')).toBeTruthy();
    expect(screen.getByText('Sun, 20 Sep · Bright')).toBeTruthy();
  });
});
```

(Dates: 2026-10-03 is a Saturday, 2026-10-04 a Sunday, 2026-10-09 a Friday, 2026-09-20 a Sunday.)

- [ ] **Step 2: Run to verify they fail**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest src/features/timeline`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

`mobile/src/features/timeline/groupByMonth.ts`:

```ts
import type { Entry } from '@/domain/types';
import { MONTHS } from '@/lib/dates';

export function groupByMonth(entries: Entry[]): { title: string; entries: Entry[] }[] {
  const out: { title: string; entries: Entry[] }[] = [];
  for (const e of entries) {
    const title = `${MONTHS[+e.date.slice(5, 7) - 1]} ${e.date.slice(0, 4)}`;
    const last = out[out.length - 1];
    if (last && last.title === title) last.entries.push(e);
    else out.push({ title, entries: [e] });
  }
  return out;
}
```

`mobile/src/features/timeline/MonthCalendar.tsx`:

```tsx
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Entry } from '@/domain/types';
import { monthGrid, type DayCell } from '@/lib/calendar';
import { MONTHS, fmtLong } from '@/lib/dates';
import { moodColor } from '@/lib/mood';
import { colors, radii, ramp } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { Icon } from '@/ui/Icon';

interface Props {
  year: number; month: number; today: string; selDay: string; entries: Entry[];
  onSelect: (iso: string) => void; onPrev: () => void; onNext: () => void;
}

export function MonthCalendar({ year, month, today, selDay, entries, onSelect, onPrev, onNext }: Props) {
  const { offset, days } = monthGrid(year, month, today, entries);
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radii.container, paddingTop: 16, paddingHorizontal: 14, paddingBottom: 18, gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <NavButton label="Previous month" icon="chevron-left" onPress={onPrev} />
        <Text style={heading(20)}>{`${MONTHS[month]} ${year}`}</Text>
        <NavButton label="Next month" icon="chevron-right" onPress={onNext} />
      </View>
      <View style={{ flexDirection: 'row' }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <Text key={i} style={[body(11, 'bold'), { flex: 1, textAlign: 'center', color: ramp.neutral[700] }]}>{d}</Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 6 }}>
        {Array.from({ length: offset }, (_, i) => <View key={`b${i}`} style={{ width: `${100 / 7}%` }} />)}
        {days.map((d) => (
          <View key={d.iso} style={{ width: `${100 / 7}%`, alignItems: 'center' }}>
            <Day d={d} selected={d.iso === selDay} onPress={() => onSelect(d.iso)} />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 6 }}>
        <Text style={[body(11), { color: ramp.neutral[700] }]}>Heavy</Text>
        <LinearGradient colors={[ramp.accent2[600], ramp.accent[500]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: 72, height: 8, borderRadius: 4 }} />
        <Text style={[body(11), { color: ramp.neutral[700] }]}>Bright</Text>
      </View>
    </View>
  );
}

function NavButton({ label, icon, onPress }: { label: string; icon: 'chevron-left' | 'chevron-right'; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? ramp.neutral[300] : 'transparent' })}
    >
      <Icon name={icon} size={20} />
    </Pressable>
  );
}

function Day({ d, selected, onPress }: { d: DayCell; selected: boolean; onPress: () => void }) {
  const has = d.count > 0;
  const fg = has ? ramp.neutral[100] : d.future ? ramp.neutral[500] : colors.text;
  const label = `${fmtLong(d.iso)}${has ? `, ${d.count} ${d.count === 1 ? 'page' : 'pages'}` : ''}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: d.future, selected }}
      disabled={d.future}
      onPress={onPress}
      hitSlop={3}
      style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: has ? moodColor(d.avgMood as number) : 'transparent' }}
    >
      {d.today ? <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 19, borderWidth: 2, borderColor: colors.accent }} /> : null}
      {selected ? <View pointerEvents="none" style={{ position: 'absolute', top: -4.5, left: -4.5, right: -4.5, bottom: -4.5, borderRadius: 23.5, borderWidth: 2.5, borderColor: colors.text }} /> : null}
      <Text style={[body(13, has || d.today ? 'bold' : 'body'), { color: fg }]}>{d.day}</Text>
    </Pressable>
  );
}
```

`mobile/src/features/timeline/TimelineScreen.tsx`:

```tsx
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { fmtLong, todayIso } from '@/lib/dates';
import { useEntries } from '@/state';
import { useTimelineUi } from '@/state/timelineStore';
import { ramp } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { Button } from '@/ui/Button';
import { EntryCard } from '@/ui/EntryCard';
import { Screen } from '@/ui/Screen';
import { Segmented } from '@/ui/Segmented';
import { MonthCalendar } from './MonthCalendar';
import { groupByMonth } from './groupByMonth';

export function TimelineScreen() {
  const router = useRouter();
  const entries = useEntries((s) => s.entries);
  const { mode, year, month, selDay, setMode, select, shift } = useTimelineUi();
  const today = todayIso();
  const open = (entryId: string) => router.push({ pathname: '/write', params: { entryId } });
  const dayEntries = entries.filter((e) => e.date === selDay);

  return (
    <Screen gap={20}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={heading(32)}>Your pages</Text>
        <Segmented options={[{ key: 'cal', label: 'Calendar' }, { key: 'list', label: 'List' }]} value={mode} onChange={setMode} />
      </View>

      {mode === 'cal' ? (
        <>
          <MonthCalendar
            year={year} month={month} today={today} selDay={selDay} entries={entries}
            onSelect={select} onPrev={() => shift(-1)} onNext={() => shift(1)}
          />
          <View style={{ gap: 12 }}>
            <Text style={body(15, 'semi')}>{selDay === today ? 'Today' : fmtLong(selDay)}</Text>
            {dayEntries.map((e) => (
              <EntryCard key={e.id} entry={e} variant="time" lines={0} onPress={() => open(e.id)} />
            ))}
            {dayEntries.length === 0 ? (
              <View style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: ramp.neutral[400], borderRadius: 28, padding: 22, alignItems: 'flex-start', gap: 12 }}>
                <Text style={[body(15), { color: ramp.neutral[700] }]}>Nothing written this day.</Text>
                {selDay <= today ? (
                  <Button
                    label="Write for this day" variant="outline" height={44} fontSize={14}
                    onPress={() => router.push({ pathname: '/write', params: { date: selDay } })}
                  />
                ) : null}
              </View>
            ) : null}
          </View>
        </>
      ) : (
        <View style={{ gap: 12 }}>
          {groupByMonth(entries).map((g) => (
            <View key={g.title} style={{ gap: 12 }}>
              <Text style={[body(12, 'bold'), { color: ramp.accent[700], letterSpacing: 0.96, textTransform: 'uppercase', marginTop: 8 }]}>{g.title}</Text>
              {g.entries.map((e) => <EntryCard key={e.id} entry={e} onPress={() => open(e.id)} />)}
            </View>
          ))}
          {entries.length === 0 ? <Text style={[body(15), { color: ramp.neutral[700] }]}>No pages yet. Your first one is a tap away.</Text> : null}
        </View>
      )}
    </Screen>
  );
}
```

`mobile/app/(tabs)/timeline.tsx`:

```tsx
import { TimelineScreen } from '@/features/timeline/TimelineScreen';

export default TimelineScreen;
```

- [ ] **Step 4: Run to verify they pass**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/luckyangelo/Dev/journ-al
git add mobile
git commit -m "feat: add Timeline with mood-coloured calendar and grouped list"
```

---

### Task 16: Write screen: text, mood, visibility, stickers, save and discard guard

**Files:**
- Create: `mobile/src/lib/id.ts`, `mobile/src/features/write/useDraft.ts`, `mobile/src/features/write/useDiscardGuard.ts`, `mobile/src/features/write/VisibilityPill.tsx`, `mobile/src/features/write/Stickers.tsx`, `mobile/src/features/write/AttachmentsRow.tsx`, `mobile/src/features/write/Toolbar.tsx`, `mobile/src/features/write/WriteScreen.tsx`, `mobile/app/write.tsx`
- Test: `mobile/src/features/write/WriteScreen.test.tsx`

**Interfaces:**
- Consumes: `newDraft`, `editDraft`, `draftReducer`, `hasContent`, `isDirty`, `saveToast`, `COPY`, `VIS`, `VIS_ORDER`, `VIS_FOOTNOTE`, `STICKERS`, `stickerStyle`, `blobFor`, `tiltFor`, `fmtShort`, `useEntries`, `useCheckin`, `useToast`, `useTimelineUi`, `MoodBlob`, `MoodSlider`, `Sheet`, `Blob`, `Button`, `Icon`.
- Produces:
  - `newId(): string` (`expo-crypto` `randomUUID`)
  - `useDraft(params: { entryId?: string; prompt?: string; date?: string }): { original: Entry | null; initial: Entry; draft: Entry; dispatch: (a: DraftAction) => void }` (snapshots the stored entry once on mount)
  - `useDiscardGuard(shouldGuard: () => boolean, onDiscard: () => void): () => void` — intercepts every way of leaving (close button, Android Back, gesture) with the alert "Discard this page?"; the returned function disarms the guard (call it right before navigating away after a successful save)
  - `<AttachmentsRow draft dispatch />` (stickers only in this task), `<Toolbar onSticker onPhoto? onVoice? recording? />` (Photo and Voice pills render only when their handler is supplied)
  - `<StickerBlob name size rotate onPress label />`, `<StickerSheet visible onClose onPick={(name: string) => void} />`
  - `<VisibilityPill value onPress />`, `<VisibilitySheet visible value onClose onPick={(v: Visibility) => void} />`
  - Route `/write` params: `entryId?`, `prompt?`, `date?`

Rules from the spec: Save with no text and no media toasts `Add a word, a photo, anything`; on success the app goes back and toasts `Saved to today’s page` (+ ` · shared with friends` / ` · public`); choosing Public toasts `This page will be public once saved`; the page can be started from a prompt (card with a remove x) and the text field placeholder is `Start anywhere. One word is enough.`.

- [ ] **Step 1: Write the failing tests**

`mobile/src/features/write/WriteScreen.test.tsx`:

```tsx
import { Alert } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { demoEntries } from '@/domain/demoData';
import { useToast } from '@/state/toastStore';
import { WriteScreen } from './WriteScreen';

const mockBack = jest.fn();
let mockParams: Record<string, string> = {};
const mockListeners: Record<string, (e: unknown) => void> = {};
const mockDispatch = jest.fn();
const mockSave = jest.fn(async () => {});

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => mockParams,
  useNavigation: () => ({ addListener: (t: string, h: (e: unknown) => void) => { mockListeners[t] = h; return () => {}; }, dispatch: mockDispatch }),
}));
jest.mock('@/lib/id', () => ({ newId: () => 'new-1' }));
jest.mock('@/state', () => {
  const { create } = require('zustand');
  const { demoEntries } = require('@/domain/demoData');
  return { useEntries: create(() => ({ entries: demoEntries('2026-10-08'), save: mockSave })) };
});

const wrap = () =>
  render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <WriteScreen />
    </SafeAreaProvider>,
  );
const saved = () => (mockSave.mock.calls[0] as unknown as [Record<string, unknown>])[0];
const leave = () => {
  const e = { preventDefault: jest.fn(), data: { action: { type: 'GO_BACK' } } };
  mockListeners.beforeRemove(e);
  return e;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  useToast.setState({ message: '' });
  jest.setSystemTime(new Date(2026, 9, 8, 21, 41));
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

describe('new page', () => {
  it('shows the date, time and placeholder', () => {
    wrap();
    expect(screen.getByText('Thu, 8 Oct · 9:41 pm')).toBeTruthy();
    expect(screen.getByPlaceholderText('Start anywhere. One word is enough.')).toBeTruthy();
  });

  it.each(['', '   \n  '])('refuses to save an empty page (%j)', async (text) => {
    wrap();
    fireEvent.changeText(screen.getByPlaceholderText('Start anywhere. One word is enough.'), text);
    await act(async () => { fireEvent.press(screen.getByText('Save')); });
    expect(mockSave).not.toHaveBeenCalled();
    expect(mockBack).not.toHaveBeenCalled();
    expect(useToast.getState().message).toBe('Add a word, a photo, anything');
  });

  it('saves a page that has only a sticker', async () => {
    wrap();
    fireEvent.press(screen.getByText('Sticker'));
    expect(screen.getByText('Add a sticker')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Add calm sticker' }));
    expect(screen.getByRole('button', { name: 'Remove calm sticker' })).toBeTruthy();
    await act(async () => { fireEvent.press(screen.getByText('Save')); });
    expect(saved()).toMatchObject({ id: 'new-1', stickers: ['calm'], text: '', vis: 'private', date: '2026-10-08', time: '9:41 pm' });
    expect(useToast.getState().message).toBe('Saved to today’s page');
    expect(mockBack).toHaveBeenCalled();
  });

  it('removes a sticker when tapped', () => {
    wrap();
    fireEvent.press(screen.getByText('Sticker'));
    fireEvent.press(screen.getByRole('button', { name: 'Add cozy sticker' }));
    fireEvent.press(screen.getByRole('button', { name: 'Remove cozy sticker' }));
    expect(screen.queryByRole('button', { name: 'Remove cozy sticker' })).toBeNull();
  });

  it('saves words with the chosen audience and says so', async () => {
    wrap();
    fireEvent.changeText(screen.getByPlaceholderText('Start anywhere. One word is enough.'), 'hello');
    fireEvent.press(screen.getByText('Only me'));
    expect(screen.getByText('Who can read this page?')).toBeTruthy();
    fireEvent.press(screen.getByText('Friends'));
    await act(async () => { fireEvent.press(screen.getByText('Save')); });
    expect(saved()).toMatchObject({ text: 'hello', vis: 'friends' });
    expect(useToast.getState().message).toBe('Saved to today’s page · shared with friends');
  });

  it('warns immediately when Public is chosen', () => {
    wrap();
    fireEvent.press(screen.getByText('Only me'));
    fireEvent.press(screen.getByText('Public'));
    expect(useToast.getState().message).toBe('This page will be public once saved');
    expect(screen.getByText('Public')).toBeTruthy();
  });

  it('starts from a prompt that can be removed', () => {
    mockParams = { prompt: 'Who did you feel close to today?' };
    wrap();
    expect(screen.getByText('Who did you feel close to today?')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Remove prompt'));
    expect(screen.queryByText('Who did you feel close to today?')).toBeNull();
  });

  it('writes for a back-dated day', async () => {
    mockParams = { date: '2026-10-03' };
    wrap();
    expect(screen.getByText('Sat, 3 Oct · 9:41 pm')).toBeTruthy();
    fireEvent.changeText(screen.getByPlaceholderText('Start anywhere. One word is enough.'), 'late entry');
    await act(async () => { fireEvent.press(screen.getByText('Save')); });
    expect(saved()).toMatchObject({ date: '2026-10-03' });
    expect(useToast.getState().message).toBe('Saved');
  });
});

describe('editing an existing page', () => {
  it('loads it and keeps its id, time and creation stamp on save', async () => {
    mockParams = { entryId: 'demo-1' };
    wrap();
    expect(screen.getByDisplayValue(/Made pasta with Jun/)).toBeTruthy();
    expect(screen.getByText('Wed, 7 Oct · 10:02 pm')).toBeTruthy();
    fireEvent.changeText(screen.getByDisplayValue(/Made pasta with Jun/), 'Edited');
    await act(async () => { fireEvent.press(screen.getByText('Save')); });
    const original = demoEntries('2026-10-08')[0];
    expect(saved()).toMatchObject({ id: 'demo-1', time: '10:02 pm', createdAt: original.createdAt, text: 'Edited', vis: 'friends' });
    expect(useToast.getState().message).toBe('Saved · shared with friends');
  });
});

describe('leaving without saving', () => {
  it('lets a clean page go without asking', () => {
    wrap();
    expect(leave().preventDefault).not.toHaveBeenCalled();
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('asks before throwing away words', () => {
    wrap();
    fireEvent.changeText(screen.getByPlaceholderText('Start anywhere. One word is enough.'), 'something I meant');
    const e = leave();
    expect(e.preventDefault).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith('Discard this page?', 'Your words and attachments won’t be saved.', expect.any(Array));
    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as { text: string; onPress?: () => void }[];
    expect(buttons.map((b) => b.text)).toEqual(['Keep writing', 'Discard']);
    buttons[1].onPress?.();
    expect(mockDispatch).toHaveBeenCalledWith(e.data.action);
  });

  it('does not ask again after a successful save', async () => {
    wrap();
    fireEvent.changeText(screen.getByPlaceholderText('Start anywhere. One word is enough.'), 'saved words');
    await act(async () => { fireEvent.press(screen.getByText('Save')); });
    expect(leave().preventDefault).not.toHaveBeenCalled();
  });

  it('close button leaves a clean page straight away', () => {
    wrap();
    fireEvent.press(screen.getByLabelText('Close'));
    expect(mockBack).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest src/features/write`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

`mobile/src/lib/id.ts`:

```ts
import * as Crypto from 'expo-crypto';

export const newId = (): string => Crypto.randomUUID();
```

`mobile/src/features/write/useDraft.ts`:

```ts
import { useMemo, useReducer } from 'react';
import { draftReducer, editDraft, newDraft, type DraftAction } from '@/domain/draft';
import type { Entry } from '@/domain/types';
import { newId } from '@/lib/id';
import { useEntries } from '@/state';
import { useCheckin } from '@/state/checkinStore';

interface Params { entryId?: string; prompt?: string; date?: string }

export function useDraft(params: Params): { original: Entry | null; initial: Entry; draft: Entry; dispatch: (a: DraftAction) => void } {
  // Snapshot once: later changes to the stored list must not rewrite what the user is typing.
  const { original, initial } = useMemo(() => {
    const found = params.entryId ? useEntries.getState().entries.find((e) => e.id === params.entryId) ?? null : null;
    const { mood, feelings } = useCheckin.getState();
    const first = found
      ? editDraft(found)
      : newDraft({ id: newId(), now: new Date(), mood, feelings, date: params.date, prompt: params.prompt });
    return { original: found, initial: first };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [draft, dispatch] = useReducer(draftReducer, initial);
  return { original, initial, draft, dispatch };
}
```

`mobile/src/features/write/useDiscardGuard.ts`:

```ts
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from 'expo-router';

export function useDiscardGuard(shouldGuard: () => boolean, onDiscard: () => void): () => void {
  const navigation = useNavigation();
  const disarmed = useRef(false);
  useEffect(
    () =>
      navigation.addListener('beforeRemove', (e) => {
        if (disarmed.current || !shouldGuard()) return;
        e.preventDefault();
        Alert.alert('Discard this page?', 'Your words and attachments won’t be saved.', [
          { text: 'Keep writing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              disarmed.current = true;
              onDiscard();
              navigation.dispatch(e.data.action);
            },
          },
        ]);
      }),
    [navigation, shouldGuard, onDiscard],
  );
  return () => { disarmed.current = true; };
}
```

`mobile/src/features/write/Stickers.tsx`:

```tsx
import { Pressable, Text, View } from 'react-native';
import { STICKERS, blobFor, stickerStyle, tiltFor } from '@/domain/stickers';
import { heading } from '@/theme/type';
import { Blob } from '@/ui/Blob';
import { Sheet } from '@/ui/Sheet';

export function StickerBlob({ name, size, rotate = 0, fontSize, label, onPress }: {
  name: string; size: number; rotate?: number; fontSize: number; label: string; onPress: () => void;
}) {
  const st = stickerStyle(name);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={Math.max(0, (44 - size) / 2)}>
      <Blob radii={blobFor(name)} size={size} color={st.bg} rotate={rotate}>
        <Text style={[heading(fontSize, 1), { color: st.ink }]}>{name}</Text>
      </Blob>
    </Pressable>
  );
}

export function StickerSheet({ visible, onClose, onPick }: { visible: boolean; onClose: () => void; onPick: (name: string) => void }) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Add a sticker">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 }}>
        {STICKERS.map((s) => (
          <View key={s.name} style={{ width: '25%', alignItems: 'center' }}>
            <StickerBlob name={s.name} size={70} fontSize={14} label={`Add ${s.name} sticker`} onPress={() => onPick(s.name)} />
          </View>
        ))}
      </View>
    </Sheet>
  );
}
```

`mobile/src/features/write/VisibilityPill.tsx`:

```tsx
import { Pressable, Text, View } from 'react-native';
import { VIS, VIS_FOOTNOTE, VIS_ORDER } from '@/domain/visibility';
import type { Visibility } from '@/domain/types';
import { colors, radii, ramp } from '@/theme/tokens';
import { body } from '@/theme/type';
import { Icon } from '@/ui/Icon';
import { Sheet } from '@/ui/Sheet';

export function VisibilityPill({ value, onPress }: { value: Visibility; onPress: () => void }) {
  const v = VIS[value];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${v.label}. Change who can read this page`}
      onPress={onPress}
      hitSlop={{ top: 2, bottom: 2 }}
      style={{ alignSelf: 'flex-start', height: 40, paddingLeft: 12, paddingRight: 14, borderRadius: radii.pill, borderWidth: 1.5, borderColor: v.border, backgroundColor: v.bg, flexDirection: 'row', alignItems: 'center', gap: 8 }}
    >
      <Icon name={v.icon} size={16} color={v.fg} />
      <Text style={[body(13, 'semi'), { color: v.fg }]}>{v.label}</Text>
      <Icon name="chevron-down" size={14} color={v.fg} />
    </Pressable>
  );
}

export function VisibilitySheet({ visible, value, onClose, onPick }: { visible: boolean; value: Visibility; onClose: () => void; onPick: (v: Visibility) => void }) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Who can read this page?">
      {VIS_ORDER.map((k) => {
        const v = VIS[k];
        const on = k === value;
        return (
          <Pressable
            key={k}
            accessibilityRole="button"
            accessibilityLabel={`${v.label}. ${v.desc}`}
            accessibilityState={{ selected: on }}
            onPress={() => onPick(k)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 26, borderWidth: 2, borderColor: on ? colors.accent : 'transparent', backgroundColor: on ? ramp.accent[100] : ramp.neutral[100] }}
          >
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: v.iconBg, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={v.icon} size={20} color={v.iconFg} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={body(16, 'bold')}>{v.label}</Text>
              <Text style={[body(13, 'body', 1.4), { color: ramp.neutral[700] }]}>{v.desc}</Text>
            </View>
          </Pressable>
        );
      })}
      <Text style={[body(12, 'body', 1.45), { color: ramp.neutral[700], paddingHorizontal: 6 }]}>{VIS_FOOTNOTE}</Text>
    </Sheet>
  );
}
```

`mobile/src/features/write/AttachmentsRow.tsx` (stickers only here; Task 17 replaces this file):

```tsx
import { View } from 'react-native';
import type { DraftAction } from '@/domain/draft';
import type { Entry } from '@/domain/types';
import { tiltFor } from '@/domain/stickers';
import { StickerBlob } from './Stickers';

export function AttachmentsRow({ draft, dispatch }: { draft: Entry; dispatch: (a: DraftAction) => void }) {
  if (!draft.stickers.length) return null;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
      {draft.stickers.map((name, i) => (
        <StickerBlob
          key={`${name}-${i}`} name={name} size={72} fontSize={15} rotate={tiltFor(name)}
          label={`Remove ${name} sticker`} onPress={() => dispatch({ type: 'removeSticker', index: i })}
        />
      ))}
    </View>
  );
}
```

`mobile/src/features/write/Toolbar.tsx`:

```tsx
import { Pressable, Text, View } from 'react-native';
import { colors, radii, ramp } from '@/theme/tokens';
import { body } from '@/theme/type';
import { Icon, type IconName } from '@/ui/Icon';

function Pill({ icon, label, onPress, active }: { icon: IconName; label: string; onPress: () => void; active?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({ flex: 1, height: 48, borderRadius: radii.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: active ? ramp.accent[300] : pressed ? ramp.accent[100] : ramp.neutral[100] })}
    >
      <Icon name={icon} size={18} />
      <Text style={body(14, 'semi')}>{label}</Text>
    </Pressable>
  );
}

export function Toolbar({ onSticker, onPhoto, onVoice, recording }: { onSticker: () => void; onPhoto?: () => void; onVoice?: () => void; recording?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: colors.surface }}>
      {onPhoto ? <Pill icon="image" label="Photo" onPress={onPhoto} /> : null}
      {onVoice ? <Pill icon="mic" label="Voice" onPress={onVoice} active={recording} /> : null}
      <Pill icon="smile" label="Sticker" onPress={onSticker} />
    </View>
  );
}
```

`mobile/src/features/write/WriteScreen.tsx`:

```tsx
import { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COPY, saveToast } from '@/domain/copy';
import { hasContent, isDirty } from '@/domain/draft';
import { fmtShort, todayIso } from '@/lib/dates';
import { MOODS, moodIndex } from '@/lib/mood';
import { useEntries } from '@/state';
import { useTimelineUi } from '@/state/timelineStore';
import { useToast } from '@/state/toastStore';
import { colors, ramp } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { MoodBlob } from '@/ui/MoodBlob';
import { MoodSlider } from '@/ui/MoodSlider';
import { ScreenFade } from '@/ui/ScreenFade';
import { AttachmentsRow } from './AttachmentsRow';
import { StickerSheet } from './Stickers';
import { Toolbar } from './Toolbar';
import { VisibilityPill, VisibilitySheet } from './VisibilityPill';
import { useDiscardGuard } from './useDiscardGuard';
import { useDraft } from './useDraft';

export function WriteScreen() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const params = useLocalSearchParams<{ entryId?: string; prompt?: string; date?: string }>();
  const show = useToast((s) => s.show);
  const { original, initial, draft, dispatch } = useDraft(params);
  const [visOpen, setVisOpen] = useState(false);
  const [stickerOpen, setStickerOpen] = useState(false);

  const draftRef = useRef(draft);
  draftRef.current = draft;
  const shouldGuard = useCallback(() => isDirty(draftRef.current, initial), [initial]);
  const onDiscard = useCallback(() => {}, []); // Task 17 deletes files added during this session here
  const disarm = useDiscardGuard(shouldGuard, onDiscard);

  const save = async () => {
    const d = draftRef.current;
    if (!hasContent(d)) return show(COPY.emptySave);
    await useEntries.getState().save(d);
    useTimelineUi.getState().reset(d.date);
    show(saveToast(d, todayIso()));
    disarm();
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenFade style={{ paddingTop: top }}>
        <View style={{ height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => router.back()} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={22} />
          </Pressable>
          <Text style={[body(14, 'semi'), { color: ramp.neutral[700] }]}>{fmtShort(draft.date) + (draft.time ? ` · ${draft.time}` : '')}</Text>
          <Button label="Save" onPress={save} height={44} fontSize={15} />
        </View>

        {/* Android resizes the window for the keyboard (softwareKeyboardLayoutMode: "resize"), so no KeyboardAvoidingView is needed. */}
        <View style={{ flex: 1 }}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: 6, paddingHorizontal: 22, paddingBottom: 20, gap: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <MoodBlob value={draft.mood} size={44} />
              <Text style={[heading(20), { width: 70 }]}>{MOODS[moodIndex(draft.mood)][0]}</Text>
              <View style={{ flex: 1 }}>
                <MoodSlider size="compact" value={draft.mood} onChange={(value) => dispatch({ type: 'mood', value })} />
              </View>
            </View>

            <VisibilityPill value={draft.vis} onPress={() => setVisOpen(true)} />

            {draft.prompt ? (
              <View style={{ backgroundColor: ramp.accent[200], borderRadius: 26, paddingVertical: 16, paddingLeft: 18, paddingRight: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <Text style={[heading(19, 1.25), { flex: 1, color: ramp.accent[900] }]}>{draft.prompt}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Remove prompt" hitSlop={6} onPress={() => dispatch({ type: 'clearPrompt' })} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="x" size={16} color={ramp.accent[800]} />
                </Pressable>
              </View>
            ) : null}

            <TextInput
              value={draft.text}
              onChangeText={(value) => dispatch({ type: 'text', value })}
              placeholder={COPY.writePlaceholder}
              placeholderTextColor={ramp.neutral[500]}
              multiline
              autoFocus={!original}
              textAlignVertical="top"
              style={{ minHeight: 170, padding: 0, fontFamily: 'Figtree_400Regular', fontSize: 18, lineHeight: 28, color: colors.text }}
            />

            <AttachmentsRow draft={draft} dispatch={dispatch} />
          </ScrollView>
        </View>

        <Toolbar onSticker={() => setStickerOpen(true)} />
      </ScreenFade>

      <StickerSheet
        visible={stickerOpen}
        onClose={() => setStickerOpen(false)}
        onPick={(name) => { dispatch({ type: 'addSticker', name }); setStickerOpen(false); }}
      />
      <VisibilitySheet
        visible={visOpen}
        value={draft.vis}
        onClose={() => setVisOpen(false)}
        onPick={(v) => {
          dispatch({ type: 'vis', value: v });
          setVisOpen(false);
          if (v === 'public') show(COPY.publicHeadsUp);
        }}
      />
    </View>
  );
}
```

`mobile/app/write.tsx`:

```tsx
import { WriteScreen } from '@/features/write/WriteScreen';

export default WriteScreen;
```

Also register the route as a full-screen modal-style push in `mobile/app/_layout.tsx` by adding, inside the root `<Stack>`: `<Stack.Screen name="write" options={{ animation: 'slide_from_bottom' }} />` (children of `Stack` replace the self-closing form).

Note for the visibility pill test: the pill's visible label is the text "Only me"; the sheet rows also render "Friends"/"Public" text, and after picking, the pill text changes. In the "warns immediately" test the final `getByText('Public')` therefore matches the pill only once the sheet has closed (the sheet unmounts when `visible` is false).

- [ ] **Step 4: Run to verify it passes**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest && npx tsc --noEmit`
Expected: PASS. If `getByText('Save')` is ambiguous with other text, scope with `getByRole('button', { name: 'Save' })`.

On the emulator: Today → "Write this" opens the editor with the prompt card; typing, sticker sheet, visibility sheet (slide 280 ms, scrim), Save returns to the previous screen with the toast above the nav; closing with text shows the discard alert; Android Back behaves the same.

- [ ] **Step 5: Commit**

```bash
cd /Users/luckyangelo/Dev/journ-al
git add mobile
git commit -m "feat: add Write screen with mood, visibility, stickers, save and discard guard"
```

---

### Task 17: Photos and voice notes

**Files:**
- Create: `mobile/src/data/mediaStore.ts`, `mobile/src/services/photoPicker.ts`, `mobile/src/features/write/useVoiceRecorder.ts`, `mobile/src/ui/PhotoTile.tsx`, `mobile/src/features/write/VoicePill.tsx`, `mobile/src/features/write/RecordingBanner.tsx`, `mobile/src/features/write/PhotoSheet.tsx`
- Modify: `mobile/src/features/write/AttachmentsRow.tsx` (full version), `mobile/src/features/write/WriteScreen.tsx` (wire photo, voice, discard cleanup, save cleanup)
- Test: `mobile/src/data/mediaStore.test.ts`, `mobile/src/services/photoPicker.test.ts`, `mobile/src/features/write/useVoiceRecorder.test.tsx`, `mobile/src/ui/PhotoTile.test.tsx`, `mobile/src/features/write/WriteScreen.media.test.tsx`

**Interfaces:**
- Consumes: `newId`, `Photo`, `Voice`, `addedUris`, `orphanedUris`, `useLock.withoutRelock`, `secs`, `ramp`, `Icon`, `Sheet`, `Button`.
- Produces:
  - `persistMedia(srcUri: string, id: string, ext: string): string` (copies into `Paths.document/media/<id>.<ext>`, returns the new uri), `deleteMedia(uri: string): void` (never throws)
  - `type PickResult = { ok: true; photos: Photo[] } | { ok: false; reason: 'denied' | 'cancelled' }`, `pickPhotos(source: 'library' | 'camera'): Promise<PickResult>`
  - `useVoiceRecorder(): { recording: boolean; seconds: number; start(): Promise<'started' | 'denied' | 'error'>; stop(commit: boolean): Promise<Voice | null> }`
  - `<PhotoTile size? height? radius label? uri? rotate? onRemove? />` (striped placeholder when `uri` is empty)
  - `<VoicePill voice onRemove />`, `<RecordingBanner seconds onDone />`, `<PhotoSheet visible onClose onPick={(s: 'library' | 'camera') => void} />`

Spec: photo tiles 104×104, radius 24, rotated ±2°, each with a remove x; voice pills 52px tall in accent-200 with a play circle, waveform and duration; recording banner "Listening… 0:07" + "Done" with a pulsing dot; a recording shorter than a second counts as 1s.

- [ ] **Step 1: Write the failing tests**

`mobile/src/data/mediaStore.test.ts`:

```ts
/** @jest-environment node */
const mockCreate = jest.fn();
const mockCopy = jest.fn();
const mockDelete = jest.fn();
let mockDirExists = false;
let mockFileExists = true;

jest.mock('expo-file-system', () => ({
  Paths: { document: 'file:///doc' },
  Directory: class { uri: string; constructor(...p: string[]) { this.uri = p.join('/'); } get exists() { return mockDirExists; } create = mockCreate; },
  File: class {
    uri: string;
    constructor(...p: (string | { uri: string })[]) { this.uri = p.map((x) => (typeof x === 'string' ? x : x.uri)).join('/'); }
    get exists() { return mockFileExists; }
    copy = mockCopy;
    delete = mockDelete;
  },
}));

import { deleteMedia, persistMedia } from './mediaStore';

beforeEach(() => { jest.clearAllMocks(); mockDirExists = false; mockFileExists = true; });

it('creates the media folder once and copies the file into it', () => {
  const uri = persistMedia('file:///cache/pick.jpg', 'abc', 'jpg');
  expect(mockCreate).toHaveBeenCalledWith({ intermediates: true });
  expect(mockCopy).toHaveBeenCalledTimes(1);
  expect(uri).toBe('file:///doc/media/abc.jpg');
  mockDirExists = true;
  persistMedia('file:///cache/pick2.jpg', 'def', 'jpg');
  expect(mockCreate).toHaveBeenCalledTimes(1);
});

it('deletes a file that exists and ignores one that does not', () => {
  deleteMedia('file:///doc/media/abc.jpg');
  expect(mockDelete).toHaveBeenCalledTimes(1);
  mockFileExists = false;
  deleteMedia('file:///doc/media/gone.jpg');
  expect(mockDelete).toHaveBeenCalledTimes(1);
});

it('never throws, and ignores empty uris (demo media)', () => {
  mockDelete.mockImplementationOnce(() => { throw new Error('io'); });
  expect(() => deleteMedia('file:///doc/media/abc.jpg')).not.toThrow();
  deleteMedia('');
  expect(mockDelete).toHaveBeenCalledTimes(1);
});
```

`mobile/src/services/photoPicker.test.ts`:

```ts
import * as ImagePicker from 'expo-image-picker';
import { useLock } from '@/state/lockStore';
import { pickPhotos } from './photoPicker';

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));
jest.mock('@/data/mediaStore', () => ({ persistMedia: (_src: string, id: string, ext: string) => `file:///doc/media/${id}.${ext}` }));
let mockN = 0;
jest.mock('@/lib/id', () => ({ newId: () => `id-${++mockN}` }));

const ip = ImagePicker as jest.Mocked<typeof ImagePicker>;
beforeEach(() => { jest.clearAllMocks(); mockN = 0; useLock.setState({ suspended: 0 }); });

it('returns the picked photos with persisted uris', async () => {
  ip.launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///cache/a.png' }, { uri: 'file:///cache/b.jpeg' }] } as never);
  const r = await pickPhotos('library');
  expect(r).toEqual({ ok: true, photos: [{ id: 'id-1', uri: 'file:///doc/media/id-1.png' }, { id: 'id-2', uri: 'file:///doc/media/id-2.jpeg' }] });
});

it('treats a cancelled picker as a no-op', async () => {
  ip.launchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: null } as never);
  expect(await pickPhotos('library')).toEqual({ ok: false, reason: 'cancelled' });
});

it('does not open the camera when permission is denied', async () => {
  ip.requestCameraPermissionsAsync.mockResolvedValue({ granted: false } as never);
  expect(await pickPhotos('camera')).toEqual({ ok: false, reason: 'denied' });
  expect(ip.launchCameraAsync).not.toHaveBeenCalled();
});

it('takes a photo when the camera is allowed', async () => {
  ip.requestCameraPermissionsAsync.mockResolvedValue({ granted: true } as never);
  ip.launchCameraAsync.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///cache/c' }] } as never);
  const r = await pickPhotos('camera');
  expect(r).toMatchObject({ ok: true, photos: [{ uri: 'file:///doc/media/id-1.jpg' }] });
});

it('keeps the app from re-locking while the system picker is open', async () => {
  let during = -1;
  ip.launchImageLibraryAsync.mockImplementation((async () => { during = useLock.getState().suspended; return { canceled: true, assets: null }; }) as never);
  await pickPhotos('library');
  expect(during).toBe(1);
});

it('reports an unexpected picker error as cancelled instead of crashing', async () => {
  ip.launchImageLibraryAsync.mockRejectedValue(new Error('boom'));
  expect(await pickPhotos('library')).toEqual({ ok: false, reason: 'cancelled' });
});
```

`mobile/src/features/write/useVoiceRecorder.test.tsx`:

```tsx
import { act, renderHook } from '@testing-library/react-native';
import { useLock } from '@/state/lockStore';
import { useVoiceRecorder } from './useVoiceRecorder';

const mockRecorder = { prepareToRecordAsync: jest.fn(async () => {}), record: jest.fn(), stop: jest.fn(async () => {}), uri: 'file:///cache/rec.m4a' };
const mockPermission = jest.fn();
const mockDelete = jest.fn();

jest.mock('expo-audio', () => ({
  useAudioRecorder: () => mockRecorder,
  RecordingPresets: { HIGH_QUALITY: {} },
  AudioModule: { requestRecordingPermissionsAsync: (...a: unknown[]) => mockPermission(...a) },
  setAudioModeAsync: jest.fn(async () => {}),
}));
jest.mock('@/data/mediaStore', () => ({ persistMedia: (_s: string, id: string, ext: string) => `file:///doc/media/${id}.${ext}`, deleteMedia: (u: string) => mockDelete(u) }));
jest.mock('@/lib/id', () => ({ newId: () => 'v-1' }));

beforeEach(() => { jest.clearAllMocks(); mockPermission.mockResolvedValue({ granted: true }); useLock.setState({ suspended: 0 }); });

it('refuses to start without microphone permission', async () => {
  mockPermission.mockResolvedValue({ granted: false });
  const { result } = renderHook(() => useVoiceRecorder());
  let r;
  await act(async () => { r = await result.current.start(); });
  expect(r).toBe('denied');
  expect(result.current.recording).toBe(false);
  expect(mockRecorder.record).not.toHaveBeenCalled();
});

it('reports an error instead of crashing when the recorder cannot start', async () => {
  mockRecorder.prepareToRecordAsync.mockRejectedValueOnce(new Error('busy'));
  const { result } = renderHook(() => useVoiceRecorder());
  let r;
  await act(async () => { r = await result.current.start(); });
  expect(r).toBe('error');
  expect(result.current.recording).toBe(false);
});

it('records, counts seconds and returns a persisted voice note on commit', async () => {
  const { result } = renderHook(() => useVoiceRecorder());
  await act(async () => { await result.current.start(); });
  expect(result.current.recording).toBe(true);
  await act(async () => { jest.advanceTimersByTime(7000); });
  expect(result.current.seconds).toBe(7);
  let voice;
  await act(async () => { voice = await result.current.stop(true); });
  expect(voice).toEqual({ id: 'v-1', uri: 'file:///doc/media/v-1.m4a', seconds: 7 });
  expect(result.current.recording).toBe(false);
});

it('counts a recording shorter than a second as 1s', async () => {
  const { result } = renderHook(() => useVoiceRecorder());
  await act(async () => { await result.current.start(); });
  let voice;
  await act(async () => { voice = await result.current.stop(true); });
  expect(voice).toMatchObject({ seconds: 1 });
});

it('discards the file when stopped without committing', async () => {
  const { result } = renderHook(() => useVoiceRecorder());
  await act(async () => { await result.current.start(); });
  let voice;
  await act(async () => { voice = await result.current.stop(false); });
  expect(voice).toBeNull();
  expect(mockDelete).toHaveBeenCalledWith('file:///cache/rec.m4a');
});

it('stop() when nothing is recording is a harmless no-op', async () => {
  const { result } = renderHook(() => useVoiceRecorder());
  let voice;
  await act(async () => { voice = await result.current.stop(true); });
  expect(voice).toBeNull();
  expect(mockRecorder.stop).not.toHaveBeenCalled();
});
```

`mobile/src/ui/PhotoTile.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';
import { PhotoTile } from './PhotoTile';

it('shows the label on the striped placeholder and a remove button', () => {
  const onRemove = jest.fn();
  render(<PhotoTile size={104} radius={24} label="photo · river" onRemove={onRemove} />);
  expect(screen.getByText('photo · river')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Remove photo'));
  expect(onRemove).toHaveBeenCalled();
});

it('has no remove button when read-only (feed)', () => {
  render(<PhotoTile height={170} radius={22} label="photo · basil" />);
  expect(screen.queryByLabelText('Remove photo')).toBeNull();
});

it('renders the image instead of the placeholder when it has a uri', () => {
  render(<PhotoTile size={104} radius={24} uri="file:///doc/media/a.jpg" label="ignored" />);
  expect(screen.queryByText('ignored')).toBeNull();
  expect(screen.getByLabelText('Photo')).toBeTruthy();
});
```

`mobile/src/features/write/WriteScreen.media.test.tsx`:

```tsx
import { Alert } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useToast } from '@/state/toastStore';
import { WriteScreen } from './WriteScreen';

const mockBack = jest.fn();
const mockListeners: Record<string, (e: unknown) => void> = {};
const mockSave = jest.fn(async () => {});
const mockStart = jest.fn();
const mockStop = jest.fn();
let mockRecording = false;
const mockPick = jest.fn();
const mockDelete = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => ({}),
  useNavigation: () => ({ addListener: (t: string, h: (e: unknown) => void) => { mockListeners[t] = h; return () => {}; }, dispatch: jest.fn() }),
}));
jest.mock('@/lib/id', () => ({ newId: () => 'new-1' }));
jest.mock('@/state', () => {
  const { create } = require('zustand');
  return { useEntries: create(() => ({ entries: [], save: mockSave })) };
});
jest.mock('./useVoiceRecorder', () => ({
  useVoiceRecorder: () => ({ recording: mockRecording, seconds: 7, start: mockStart, stop: mockStop }),
}));
jest.mock('@/services/photoPicker', () => ({ pickPhotos: (...a: unknown[]) => mockPick(...a) }));
jest.mock('expo-audio', () => ({
  useAudioPlayer: () => ({ play: jest.fn(), pause: jest.fn(), seekTo: jest.fn() }),
  useAudioPlayerStatus: () => ({ playing: false, didJustFinish: false, currentTime: 0, duration: 0 }),
}));
jest.mock('@/data/mediaStore', () => ({ deleteMedia: (u: string) => mockDelete(u), persistMedia: jest.fn() }));

const wrap = () =>
  render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <WriteScreen />
    </SafeAreaProvider>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockRecording = false;
  useToast.setState({ message: '' });
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

it('adds picked photos and shows them as removable tiles', async () => {
  mockPick.mockResolvedValue({ ok: true, photos: [{ id: 'p1', uri: 'file:///doc/media/p1.jpg' }] });
  wrap();
  fireEvent.press(screen.getByLabelText('Photo'));
  expect(screen.getByText('Add a photo')).toBeTruthy();
  await act(async () => { fireEvent.press(screen.getByText('Choose from gallery')); });
  expect(mockPick).toHaveBeenCalledWith('library');
  expect(screen.getAllByLabelText('Remove photo')).toHaveLength(1);
  fireEvent.press(screen.getByLabelText('Remove photo'));
  expect(screen.queryByLabelText('Remove photo')).toBeNull();
});

it('does nothing when the picker is cancelled and explains a denied camera', async () => {
  wrap();
  mockPick.mockResolvedValue({ ok: false, reason: 'cancelled' });
  fireEvent.press(screen.getByLabelText('Photo'));
  await act(async () => { fireEvent.press(screen.getByText('Choose from gallery')); });
  expect(screen.queryByLabelText('Remove photo')).toBeNull();
  expect(useToast.getState().message).toBe('');
  mockPick.mockResolvedValue({ ok: false, reason: 'denied' });
  fireEvent.press(screen.getByLabelText('Photo'));
  await act(async () => { fireEvent.press(screen.getByText('Take a photo')); });
  expect(useToast.getState().message).toBe('Camera permission is off');
});

it('explains a denied microphone and an engine error', async () => {
  wrap();
  mockStart.mockResolvedValue('denied');
  await act(async () => { fireEvent.press(screen.getByLabelText('Voice')); });
  expect(useToast.getState().message).toBe('Microphone permission is off');
  mockStart.mockResolvedValue('error');
  await act(async () => { fireEvent.press(screen.getByLabelText('Voice')); });
  expect(useToast.getState().message).toBe('Couldn’t start recording');
});

it('shows the banner while recording and adds the note when Done is pressed', async () => {
  mockRecording = true;
  mockStop.mockResolvedValue({ id: 'v1', uri: 'file:///doc/media/v1.m4a', seconds: 7 });
  wrap();
  expect(screen.getByText('Listening… 0:07')).toBeTruthy();
  await act(async () => { fireEvent.press(screen.getByText('Done')); });
  expect(mockStop).toHaveBeenCalledWith(true);
  expect(screen.getByText('0:07')).toBeTruthy();
});

it('saving while still recording keeps the recording', async () => {
  mockRecording = true;
  mockStop.mockResolvedValue({ id: 'v1', uri: 'file:///doc/media/v1.m4a', seconds: 7 });
  wrap();
  await act(async () => { fireEvent.press(screen.getByText('Save')); });
  expect(mockStop).toHaveBeenCalledWith(true);
  expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({ voices: [{ id: 'v1', uri: 'file:///doc/media/v1.m4a', seconds: 7 }] }));
});

it('discarding while recording stops without keeping it, and deletes photos added this session', async () => {
  mockPick.mockResolvedValue({ ok: true, photos: [{ id: 'p1', uri: 'file:///doc/media/p1.jpg' }] });
  wrap();
  fireEvent.press(screen.getByLabelText('Photo'));
  await act(async () => { fireEvent.press(screen.getByText('Choose from gallery')); });
  mockRecording = true;
  const e = { preventDefault: jest.fn(), data: { action: {} } };
  act(() => mockListeners.beforeRemove(e));
  expect(e.preventDefault).toHaveBeenCalled();
  const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as { onPress?: () => void }[];
  act(() => buttons[1].onPress?.());
  expect(mockStop).toHaveBeenCalledWith(false);
  expect(mockDelete).toHaveBeenCalledWith('file:///doc/media/p1.jpg');
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest src/data/mediaStore.test.ts src/services/photoPicker.test.ts src/features/write src/ui/PhotoTile.test.tsx`
Expected: FAIL, modules not found (the Task 16 tests still pass).

- [ ] **Step 3: Implement**

`mobile/src/data/mediaStore.ts`:

```ts
import { Directory, File, Paths } from 'expo-file-system';

const mediaDir = () => new Directory(Paths.document, 'media');

/** Copies a picked/recorded file into app storage (cache files can be purged) and returns its new uri. */
export function persistMedia(srcUri: string, id: string, ext: string): string {
  const dir = mediaDir();
  if (!dir.exists) dir.create({ intermediates: true });
  const dest = new File(dir, `${id}.${ext}`);
  new File(srcUri).copy(dest);
  return dest.uri;
}

export function deleteMedia(uri: string): void {
  if (!uri) return;
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    // Already gone or unreadable; nothing useful to do.
  }
}
```

`mobile/src/services/photoPicker.ts`:

```ts
import * as ImagePicker from 'expo-image-picker';
import { persistMedia } from '@/data/mediaStore';
import type { Photo } from '@/domain/types';
import { newId } from '@/lib/id';
import { useLock } from '@/state/lockStore';

export type PickResult = { ok: true; photos: Photo[] } | { ok: false; reason: 'denied' | 'cancelled' };

const extOf = (uri: string) => /\.(\w{2,5})(?:\?|$)/.exec(uri)?.[1]?.toLowerCase() ?? 'jpg';

export function pickPhotos(source: 'library' | 'camera'): Promise<PickResult> {
  return useLock.getState().withoutRelock(async (): Promise<PickResult> => {
    try {
      let result: ImagePicker.ImagePickerResult;
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) return { ok: false, reason: 'denied' };
        result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.8 });
      }
      if (result.canceled || !result.assets?.length) return { ok: false, reason: 'cancelled' };
      const photos = result.assets.map((a) => {
        const id = newId();
        return { id, uri: persistMedia(a.uri, id, extOf(a.uri)) };
      });
      return { ok: true, photos };
    } catch {
      return { ok: false, reason: 'cancelled' };
    }
  });
}
```

`mobile/src/features/write/useVoiceRecorder.ts`:

```ts
import { useEffect, useRef, useState } from 'react';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { deleteMedia, persistMedia } from '@/data/mediaStore';
import type { Voice } from '@/domain/types';
import { newId } from '@/lib/id';
import { useLock } from '@/state/lockStore';

export function useVoiceRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const secRef = useRef(0);
  const recRef = useRef(false);
  const timer = useRef<ReturnType<typeof setInterval>>();

  const start = (): Promise<'started' | 'denied' | 'error'> =>
    useLock.getState().withoutRelock(async () => {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) return 'denied';
      try {
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await recorder.prepareToRecordAsync();
        recorder.record();
      } catch {
        return 'error';
      }
      secRef.current = 0;
      setSeconds(0);
      recRef.current = true;
      setRecording(true);
      timer.current = setInterval(() => { secRef.current += 1; setSeconds(secRef.current); }, 1000);
      return 'started';
    });

  const stop = async (commit: boolean): Promise<Voice | null> => {
    if (!recRef.current) return null;
    recRef.current = false;
    clearInterval(timer.current);
    setRecording(false);
    try {
      await recorder.stop();
    } catch {
      return null;
    }
    const uri = recorder.uri;
    if (!uri) return null;
    if (!commit) {
      deleteMedia(uri);
      return null;
    }
    const id = newId();
    return { id, uri: persistMedia(uri, id, 'm4a'), seconds: Math.max(1, secRef.current) };
  };

  useEffect(() => () => clearInterval(timer.current), []);
  return { recording, seconds, start, stop };
}
```

`mobile/src/ui/PhotoTile.tsx`:

```tsx
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { ramp } from '@/theme/tokens';
import { Icon } from './Icon';

interface Props { size?: number; height?: number; radius: number; label?: string; uri?: string; rotate?: number; onRemove?: () => void }

export function PhotoTile({ size, height, radius, label = '', uri, rotate = 0, onRemove }: Props) {
  const w = size ?? '100%';
  const h = size ?? height;
  return (
    <View style={{ width: w, height: h, borderRadius: radius, overflow: 'hidden', transform: [{ rotate: `${rotate}deg` }], justifyContent: 'flex-end' }}>
      {uri ? (
        <Image accessibilityLabel="Photo" source={{ uri }} contentFit="cover" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      ) : (
        <>
          <Svg width="100%" height="100%" style={{ position: 'absolute' }}>
            <Defs>
              <Pattern id="stripes" width={16} height={16} patternUnits="userSpaceOnUse" patternTransform="rotate(135)">
                <Rect width={8} height={16} fill={ramp.neutral[200]} />
                <Rect x={8} width={8} height={16} fill={ramp.neutral[300]} />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#stripes)" />
          </Svg>
          {label ? <Text style={{ padding: size ? 10 : 12, fontFamily: 'monospace', fontSize: size ? 9.5 : 10, color: ramp.neutral[800] }}>{label}</Text> : null}
        </>
      )}
      {onRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Remove photo"
          onPress={onRemove}
          hitSlop={10}
          style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: ramp.neutral[100], alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="x" size={13} />
        </Pressable>
      ) : null}
    </View>
  );
}
```

`mobile/src/features/write/VoicePill.tsx`:

```tsx
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import type { Voice } from '@/domain/types';
import { secs } from '@/lib/dates';
import { colors, ramp } from '@/theme/tokens';
import { body } from '@/theme/type';
import { Icon } from '@/ui/Icon';

const BARS = [40, 75, 55, 95, 60, 35, 80, 100, 55, 70, 45, 30];

export function VoicePill({ voice, onRemove }: { voice: Voice; onRemove: () => void }) {
  const player = useAudioPlayer(voice.uri || null);
  const status = useAudioPlayerStatus(player);
  const [fake, setFake] = useState(false); // demo notes have no audio; just toggle the icon
  const playing = voice.uri ? status.playing : fake;
  const toggle = () => {
    if (!voice.uri) return setFake((f) => !f);
    if (status.playing) player.pause();
    else {
      if (status.didJustFinish || status.currentTime >= status.duration) player.seekTo(0);
      player.play();
    }
  };
  return (
    <View style={{ height: 52, borderRadius: 999, backgroundColor: ramp.accent[200], flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 7, paddingRight: 8 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={playing ? 'Pause voice note' : 'Play voice note'}
        onPress={toggle}
        hitSlop={3}
        style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}
      >
        <Icon name={playing ? 'pause' : 'play'} size={16} color={colors.bg} />
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, height: 24, width: 70 }}>
        {BARS.map((h, i) => <View key={i} style={{ flex: 1, height: `${h}%`, borderRadius: 2, backgroundColor: ramp.accent[600] }} />)}
      </View>
      <Text style={[body(12, 'bold'), { color: ramp.accent[800] }]}>{secs(voice.seconds)}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Remove voice note" onPress={onRemove} hitSlop={9} style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="x" size={13} color={ramp.accent[800]} />
      </Pressable>
    </View>
  );
}
```

(`useAudioPlayer(null)` is valid for a source-less player; if the installed expo-audio types reject `null`, pass `undefined`.)

`mobile/src/features/write/RecordingBanner.tsx`:

```tsx
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { secs } from '@/lib/dates';
import { colors, ramp } from '@/theme/tokens';
import { body } from '@/theme/type';
import { Button } from '@/ui/Button';

export function RecordingBanner({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withRepeat(withTiming(1, { duration: 550, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [p]);
  const dot = useAnimatedStyle(() => ({ transform: [{ scale: 1 + p.value * 0.35 }], opacity: 1 - p.value * 0.45 }));
  return (
    <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: ramp.accent[100], borderRadius: 999, paddingVertical: 8, paddingLeft: 18, paddingRight: 8 }}>
      <Animated.View style={[{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.accent }, dot]} />
      <Text style={[body(15, 'semi'), { flex: 1, color: ramp.accent[800] }]}>{`Listening… ${secs(seconds)}`}</Text>
      <Button label="Done" onPress={onDone} height={44} fontSize={14} />
    </View>
  );
}
```

`mobile/src/features/write/PhotoSheet.tsx`:

```tsx
import { Button } from '@/ui/Button';
import { Sheet } from '@/ui/Sheet';

export function PhotoSheet({ visible, onClose, onPick }: { visible: boolean; onClose: () => void; onPick: (s: 'library' | 'camera') => void }) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Add a photo">
      <Button label="Take a photo" variant="outline" onPress={() => onPick('camera')} />
      <Button label="Choose from gallery" variant="outline" onPress={() => onPick('library')} />
    </Sheet>
  );
}
```

Replace `mobile/src/features/write/AttachmentsRow.tsx`:

```tsx
import { View } from 'react-native';
import type { DraftAction } from '@/domain/draft';
import type { Entry } from '@/domain/types';
import { tiltFor } from '@/domain/stickers';
import { PhotoTile } from '@/ui/PhotoTile';
import { StickerBlob } from './Stickers';
import { VoicePill } from './VoicePill';

export function AttachmentsRow({ draft, dispatch }: { draft: Entry; dispatch: (a: DraftAction) => void }) {
  if (!draft.photos.length && !draft.voices.length && !draft.stickers.length) return null;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
      {draft.photos.map((p, i) => (
        <PhotoTile key={p.id} size={104} radius={24} uri={p.uri} label={p.label} rotate={i % 2 ? 2 : -2} onRemove={() => dispatch({ type: 'removePhoto', id: p.id })} />
      ))}
      {draft.voices.map((v) => <VoicePill key={v.id} voice={v} onRemove={() => dispatch({ type: 'removeVoice', id: v.id })} />)}
      {draft.stickers.map((name, i) => (
        <StickerBlob
          key={`${name}-${i}`} name={name} size={72} fontSize={15} rotate={tiltFor(name)}
          label={`Remove ${name} sticker`} onPress={() => dispatch({ type: 'removeSticker', index: i })}
        />
      ))}
    </View>
  );
}
```

Modify `WriteScreen.tsx`:

1. Imports: `draftReducer, addedUris, orphanedUris` from `@/domain/draft`; `deleteMedia` from `@/data/mediaStore`; `pickPhotos` from `@/services/photoPicker`; `useVoiceRecorder`; `RecordingBanner`; `PhotoSheet`.
2. State/handlers (inside `WriteScreen`, after `useDraft`):

```tsx
  const voice = useVoiceRecorder();
  const [photoOpen, setPhotoOpen] = useState(false);

  const addPhotos = async (source: 'library' | 'camera') => {
    setPhotoOpen(false);
    const r = await pickPhotos(source);
    if (r.ok) r.photos.forEach((photo) => dispatch({ type: 'addPhoto', photo }));
    else if (r.reason === 'denied') show('Camera permission is off');
  };

  const toggleVoice = async () => {
    if (voice.recording) {
      const v = await voice.stop(true);
      if (v) dispatch({ type: 'addVoice', voice: v });
      return;
    }
    const r = await voice.start();
    if (r === 'denied') show('Microphone permission is off');
    else if (r === 'error') show('Couldn’t start recording');
  };
```

3. Replace `shouldGuard` / `onDiscard`:

```tsx
  const shouldGuard = useCallback(() => voice.recording || isDirty(draftRef.current, initial), [voice.recording, initial]);
  const onDiscard = useCallback(() => {
    voice.stop(false);
    addedUris(original, draftRef.current).forEach(deleteMedia);
  }, [voice, original]);
```

4. In `save`, commit a running recording first and clean up files the page no longer uses:

```tsx
  const save = async () => {
    let d = draftRef.current;
    if (voice.recording) {
      const v = await voice.stop(true);
      if (v) d = draftReducer(d, { type: 'addVoice', voice: v });
    }
    if (!hasContent(d)) return show(COPY.emptySave);
    await useEntries.getState().save(d);
    orphanedUris(original, d).forEach(deleteMedia);
    useTimelineUi.getState().reset(d.date);
    show(saveToast(d, todayIso()));
    disarm();
    router.back();
  };
```

5. JSX: render `<RecordingBanner seconds={voice.seconds} onDone={toggleVoice} />` inside the scroll content after `<AttachmentsRow … />` when `voice.recording`; change the toolbar to `<Toolbar onSticker={…} onPhoto={() => setPhotoOpen(true)} onVoice={toggleVoice} recording={voice.recording} />`; add `<PhotoSheet visible={photoOpen} onClose={() => setPhotoOpen(false)} onPick={addPhotos} />` beside the other sheets.

The Task 16 tests in `WriteScreen.test.tsx` never touch the Photo/Voice pills, but `WriteScreen` now imports the recorder and picker, so add these two stubs near the top of that file (after its other `jest.mock` calls):

```tsx
jest.mock('./useVoiceRecorder', () => ({
  useVoiceRecorder: () => ({ recording: false, seconds: 0, start: jest.fn(), stop: jest.fn(async () => null) }),
}));
jest.mock('@/services/photoPicker', () => ({ pickPhotos: jest.fn() }));
```

Also append this to `mobile/jest.setup.ts` so any test that renders a voice pill or the recorder hook has a harmless default (`useVoiceRecorder.test.tsx` overrides it with its own mock):

```ts
jest.mock('expo-audio', () => ({
  useAudioPlayer: () => ({ play: jest.fn(), pause: jest.fn(), seekTo: jest.fn() }),
  useAudioPlayerStatus: () => ({ playing: false, didJustFinish: false, currentTime: 0, duration: 0 }),
  useAudioRecorder: () => ({ prepareToRecordAsync: jest.fn(), record: jest.fn(), stop: jest.fn(), uri: null }),
  RecordingPresets: { HIGH_QUALITY: {} },
  AudioModule: { requestRecordingPermissionsAsync: jest.fn(async () => ({ granted: true })) },
  setAudioModeAsync: jest.fn(async () => {}),
}));
```

- [ ] **Step 4: Run to verify they pass**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest && npx tsc --noEmit`
Expected: PASS.

On a physical Android device (camera and microphone are unreliable on emulators): add a gallery photo and a camera photo, record a note and play it back, save, reopen the page from the Timeline and confirm photo and note persist after force-closing the app; remove a photo and save, confirm the file is gone from `Paths.document/media` (via `adb shell run-as <package> ls files/media`); deny the microphone permission and confirm the toast; lock the app, take a photo with the camera, and confirm the lock does not trigger on return.

- [ ] **Step 5: Commit**

```bash
cd /Users/luckyangelo/Dev/journ-al
git add mobile
git commit -m "feat: add photo and voice-note attachments with permission handling and file cleanup"
```

---

### Task 18: Friends feed and profiles

**Files:**
- Create: `mobile/src/domain/profileCopy.ts`, `mobile/src/features/friends/PostCard.tsx`, `mobile/src/features/friends/FeedScreen.tsx`, `mobile/src/features/friends/ProfileScreen.tsx`
- Modify (replace stubs): `mobile/app/(tabs)/friends/index.tsx`; create `mobile/app/(tabs)/friends/[id].tsx`
- Test: `mobile/src/domain/profileCopy.test.ts`, `mobile/src/features/friends/FeedScreen.test.tsx`, `mobile/src/features/friends/ProfileScreen.test.tsx`

**Interfaces:**
- Consumes: `POSTS`, `PEOPLE`, `personById`, `feedFor`, `profileView`, `useSocial`, `VIS`, `PhotoTile`, `Avatar`, `Segmented`, `Screen`, `useToast`.
- Produces:
  - `countLabel(n: number): string`, `lockedNote(hidden: number): string`, `friendButton(s: FriendState): { label: string; filled: boolean }`
  - `<PostCard post variant?={'feed' | 'profile'} onOpenProfile? />`
  - `<FeedScreen />`, `<ProfileScreen personId={string} />`
  - Routes: `/friends` (feed), `/friends/[id]` (profile; unknown ids show a plain "We couldn’t find that profile." message)

- [ ] **Step 1: Write the failing tests**

`mobile/src/domain/profileCopy.test.ts`:

```ts
import { countLabel, lockedNote, friendButton } from './profileCopy';

it('pluralises the readable-pages count', () => {
  expect(countLabel(0)).toBe('0 pages you can read');
  expect(countLabel(1)).toBe('1 page you can read');
  expect(countLabel(2)).toBe('2 pages you can read');
});

it('writes the friends-only note, or nothing', () => {
  expect(lockedNote(0)).toBe('');
  expect(lockedNote(1)).toBe('1 more page is for friends only.');
  expect(lockedNote(2)).toBe('2 more pages are for friends only.');
});

it('labels the friend button for each state', () => {
  expect(friendButton('none')).toEqual({ label: 'Add friend', filled: true });
  expect(friendButton('requested')).toEqual({ label: 'Request sent', filled: false });
  expect(friendButton('friends')).toEqual({ label: 'Friends', filled: false });
});
```

`mobile/src/features/friends/FeedScreen.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSocial } from '@/state/socialStore';
import { FeedScreen } from './FeedScreen';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, back: jest.fn() }), usePathname: () => '/friends' }));

const wrap = () =>
  render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <FeedScreen />
    </SafeAreaProvider>,
  );

beforeEach(() => { jest.clearAllMocks(); useSocial.setState({ overrides: {}, reacts: {} }); });

it('starts on Friends with the explanatory note and only friends’ posts', () => {
  wrap();
  expect(screen.getByText('Others’ pages')).toBeTruthy();
  expect(screen.getByText('Pages your friends chose to share with you.')).toBeTruthy();
  expect(screen.getAllByText('Jun')).toHaveLength(2);
  expect(screen.getByText('Ana')).toBeTruthy();
  expect(screen.queryByText('Kit')).toBeNull();
});

it('Public shows every public post, from anyone', () => {
  wrap();
  fireEvent.press(screen.getByText('Public'));
  expect(screen.getByText('Pages anyone has made public. Tap a name to see more.')).toBeTruthy();
  expect(screen.getAllByText('Sol Rivera')).toHaveLength(2);
  expect(screen.getByText('Kit')).toBeTruthy();
  expect(screen.queryByText('Ana')).toBeNull();
});

it('toggles reactions and adjusts the counts', () => {
  wrap();
  fireEvent.press(screen.getByText('Sending a hug · 5'));
  expect(screen.getByText('Sending a hug · 6')).toBeTruthy();
  fireEvent.press(screen.getByText('Sending a hug · 6'));
  expect(screen.getByText('Sending a hug · 5')).toBeTruthy();
  fireEvent.press(screen.getByText('Same · 3'));
  expect(screen.getByText('Same · 4')).toBeTruthy();
});

it('opens a profile from the name', () => {
  wrap();
  fireEvent.press(screen.getAllByText('Ana')[0]);
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/friends/[id]', params: { id: 'ana' } });
});
```

`mobile/src/features/friends/ProfileScreen.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSocial } from '@/state/socialStore';
import { useToast } from '@/state/toastStore';
import { ProfileScreen } from './ProfileScreen';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), back: mockBack }) }));

const wrap = (id: string) =>
  render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <ProfileScreen personId={id} />
    </SafeAreaProvider>,
  );

beforeEach(() => { jest.clearAllMocks(); useSocial.setState({ overrides: {}, reacts: {} }); useToast.setState({ message: '' }); });

it('a non-friend sees public pages and can send, then cancel, a request', () => {
  wrap('sol');
  expect(screen.getByText('Sol Rivera')).toBeTruthy();
  expect(screen.getByText('Writing one line a day since June.')).toBeTruthy();
  expect(screen.getByText('2 pages you can read')).toBeTruthy();
  expect(screen.queryByText(/for friends only/)).toBeNull();
  fireEvent.press(screen.getByText('Add friend'));
  expect(screen.getByText('Request sent')).toBeTruthy();
  expect(useToast.getState().message).toBe('Friend request sent to Sol Rivera');
  fireEvent.press(screen.getByText('Request sent'));
  expect(screen.getByText('Add friend')).toBeTruthy();
});

it('a friend sees everything', () => {
  wrap('jun');
  expect(screen.getByText('Friends')).toBeTruthy();
  expect(screen.getByText('2 pages you can read')).toBeTruthy();
});

it('hides friends-only pages from non-friends and says how many', () => {
  useSocial.setState({ overrides: { jun: 'none' } });
  wrap('jun');
  expect(screen.getByText('0 pages you can read')).toBeTruthy();
  expect(screen.getByText('2 more pages are for friends only.')).toBeTruthy();
});

it('goes back', () => {
  wrap('sol');
  fireEvent.press(screen.getByLabelText('Back'));
  expect(mockBack).toHaveBeenCalled();
});

it('shows a plain message for an unknown profile', () => {
  wrap('nobody');
  expect(screen.getByText('We couldn’t find that profile.')).toBeTruthy();
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest src/domain/profileCopy.test.ts src/features/friends`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

`mobile/src/domain/profileCopy.ts`:

```ts
import type { FriendState } from './types';

export const countLabel = (n: number): string => `${n} ${n === 1 ? 'page' : 'pages'} you can read`;

export const lockedNote = (hidden: number): string =>
  hidden > 0 ? `${hidden} ${hidden === 1 ? 'more page is' : 'more pages are'} for friends only.` : '';

export function friendButton(s: FriendState): { label: string; filled: boolean } {
  if (s === 'friends') return { label: 'Friends', filled: false };
  if (s === 'requested') return { label: 'Request sent', filled: false };
  return { label: 'Add friend', filled: true };
}
```

`mobile/src/features/friends/PostCard.tsx`:

```tsx
import { Pressable, Text, View } from 'react-native';
import { personById } from '@/domain/social';
import type { Post } from '@/domain/types';
import { VIS } from '@/domain/visibility';
import { useSocial } from '@/state/socialStore';
import { colors, radii, ramp, shadows } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { Avatar } from '@/ui/Avatar';
import { PhotoTile } from '@/ui/PhotoTile';

function Reaction({ label, count, on, onPress }: { label: string; count: number; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      hitSlop={{ top: 4, bottom: 4 }}
      style={{ height: 36, paddingHorizontal: 14, borderRadius: radii.pill, borderWidth: 1.5, justifyContent: 'center', borderColor: on ? colors.accent : colors.divider, backgroundColor: on ? ramp.accent[200] : 'transparent' }}
    >
      <Text style={[body(13, 'semi'), { color: on ? ramp.accent[900] : ramp.neutral[800] }]}>{`${label} · ${count}`}</Text>
    </Pressable>
  );
}

export function PostCard({ post, variant = 'feed', onOpenProfile }: { post: Post; variant?: 'feed' | 'profile'; onOpenProfile?: () => void }) {
  const author = personById(post.authorId);
  const mine = useSocial((s) => s.reacts[post.id]) ?? {};
  const toggle = useSocial((s) => s.toggleReact);
  const v = VIS[post.vis];
  const tag = (
    <View style={{ paddingVertical: 3, paddingHorizontal: 10, borderRadius: radii.pill, backgroundColor: v.iconBg }}>
      <Text style={[body(11, 'bold'), { color: v.fg }]}>{v.label}</Text>
    </View>
  );
  const feed = variant === 'feed';
  return (
    <View style={[{ backgroundColor: ramp.neutral[100], borderRadius: radii.card, paddingVertical: 16, paddingHorizontal: 18, gap: feed ? 12 : 10 }, shadows.sm]}>
      {feed ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Avatar initial={author.initial} color={author.color} onPress={onOpenProfile} />
          <Pressable accessibilityRole="button" accessibilityLabel={`${author.name}, ${post.when}`} onPress={onOpenProfile} style={{ flex: 1, alignItems: 'flex-start' }}>
            <Text style={body(15, 'bold')}>{author.name}</Text>
            <Text style={[body(12), { color: ramp.neutral[700] }]}>{post.when}</Text>
          </Pressable>
          {tag}
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[body(12, 'semi'), { color: ramp.neutral[700], flex: 1 }]}>{post.when}</Text>
          {tag}
        </View>
      )}
      {post.prompt ? <Text style={[heading(16, 1.3), { color: ramp.accent[800] }]}>{post.prompt}</Text> : null}
      <Text style={body(16, 'body', 1.5)}>{post.text}</Text>
      {post.photoLabel ? <PhotoTile height={feed ? 170 : 150} radius={22} label={post.photoLabel} /> : null}
      {feed ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Reaction label="Sending a hug" count={post.hug + (mine.hug ? 1 : 0)} on={!!mine.hug} onPress={() => toggle(post.id, 'hug')} />
          <Reaction label="Same" count={post.same + (mine.same ? 1 : 0)} on={!!mine.same} onPress={() => toggle(post.id, 'same')} />
        </View>
      ) : null}
    </View>
  );
}
```

`mobile/src/features/friends/FeedScreen.tsx`:

```tsx
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { POSTS, feedFor } from '@/domain/social';
import { useSocial } from '@/state/socialStore';
import { ramp } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { Screen } from '@/ui/Screen';
import { Segmented } from '@/ui/Segmented';
import { PostCard } from './PostCard';

export function FeedScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'friends' | 'public'>('friends');
  const stateOf = useSocial((s) => s.stateOf);
  useSocial((s) => s.overrides); // re-render when a friendship changes
  const posts = feedFor(tab, POSTS, stateOf);
  return (
    <Screen gap={18} bottomPad={30}>
      <View style={{ gap: 14 }}>
        <Text style={heading(32)}>Others’ pages</Text>
        <Segmented options={[{ key: 'friends', label: 'Friends' }, { key: 'public', label: 'Public' }]} value={tab} onChange={setTab} />
        <Text style={[body(13, 'body', 1.45), { color: ramp.neutral[700] }]}>
          {tab === 'friends' ? 'Pages your friends chose to share with you.' : 'Pages anyone has made public. Tap a name to see more.'}
        </Text>
      </View>
      {posts.map((p) => (
        <PostCard key={p.id} post={p} onOpenProfile={() => router.push({ pathname: '/friends/[id]', params: { id: p.authorId } })} />
      ))}
    </Screen>
  );
}
```

`mobile/src/features/friends/ProfileScreen.tsx`:

```tsx
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { countLabel, friendButton, lockedNote } from '@/domain/profileCopy';
import { PEOPLE, POSTS, personById, profileView } from '@/domain/social';
import { useSocial } from '@/state/socialStore';
import { useToast } from '@/state/toastStore';
import { colors, radii, ramp } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { Icon } from '@/ui/Icon';
import { Screen } from '@/ui/Screen';
import { PostCard } from './PostCard';

export function ProfileScreen({ personId }: { personId: string }) {
  const router = useRouter();
  const stateOf = useSocial((s) => s.stateOf);
  useSocial((s) => s.overrides);
  const toggleFriend = useSocial((s) => s.toggleFriend);
  const show = useToast((s) => s.show);

  const back = (
    <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={{ width: 44, height: 44, marginLeft: -10, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="arrow-left" size={22} />
    </Pressable>
  );
  if (!PEOPLE.some((p) => p.id === personId)) {
    return (
      <Screen topPad={6} bottomPad={30} gap={18}>
        {back}
        <Text style={body(16)}>We couldn’t find that profile.</Text>
      </Screen>
    );
  }

  const person = personById(personId);
  const state = stateOf(personId);
  const { visible, hidden } = profileView(personId, POSTS, stateOf);
  const btn = friendButton(state);
  const note = lockedNote(hidden);

  return (
    <Screen topPad={6} bottomPad={30} gap={18}>
      {back}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: person.color, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={heading(32, 1)}>{person.initial}</Text>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={heading(28)}>{person.name}</Text>
          <Text style={[body(14, 'body', 1.4), { color: ramp.neutral[700] }]}>{person.bio}</Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={btn.label}
        onPress={() => {
          if (toggleFriend(personId) === 'requested') show(`Friend request sent to ${person.name}`);
        }}
        style={{ alignSelf: 'flex-start', height: 44, paddingHorizontal: 20, borderRadius: radii.pill, borderWidth: 1.5, justifyContent: 'center', borderColor: btn.filled ? colors.accent : colors.divider, backgroundColor: btn.filled ? colors.accent : 'transparent' }}
      >
        <Text style={[heading(15, 1), { color: btn.filled ? colors.bg : colors.text }]}>{btn.label}</Text>
      </Pressable>
      <Text style={body(15, 'semi')}>{countLabel(visible.length)}</Text>
      {visible.map((p) => <PostCard key={p.id} post={p} variant="profile" />)}
      {note ? (
        <View style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: ramp.neutral[400], borderRadius: 28, padding: 18 }}>
          <Text style={[body(14, 'body', 1.45), { color: ramp.neutral[700] }]}>{note}</Text>
        </View>
      ) : null}
    </Screen>
  );
}
```

Hmm on tapping "Request sent" the toggle returns `'none'` (cancel) and `'friends'` is a no-op; only a new request toasts.

`mobile/app/(tabs)/friends/index.tsx`:

```tsx
import { FeedScreen } from '@/features/friends/FeedScreen';

export default FeedScreen;
```

`mobile/app/(tabs)/friends/[id].tsx`:

```tsx
import { useLocalSearchParams } from 'expo-router';
import { ProfileScreen } from '@/features/friends/ProfileScreen';

export default function ProfileRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProfileScreen personId={String(id)} />;
}
```

- [ ] **Step 4: Run to verify they pass**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest && npx tsc --noEmit`
Expected: PASS. On the emulator: the Friends tab stays highlighted on a profile, the back arrow returns to the feed with the same tab, and posts show the sample photos as striped placeholders.

- [ ] **Step 5: Commit**

```bash
cd /Users/luckyangelo/Dev/journ-al
git add mobile
git commit -m "feat: add Friends/Public feed, reactions and profiles with friend requests"
```

---

### Task 19: Me screen, nightly reminders, export and demo reset

**Files:**
- Create: `mobile/src/services/reminders.ts`, `mobile/src/services/useRemindersSync.ts`, `mobile/src/services/exporter.ts`, `mobile/src/features/me/MeScreen.tsx`
- Modify (replace stub): `mobile/app/(tabs)/me.tsx`; modify `mobile/app/_layout.tsx` (call `useRemindersSync()` next to `useRelockOnBackground()`)
- Test: `mobile/src/services/reminders.test.ts`, `mobile/src/services/useRemindersSync.test.ts`, `mobile/src/services/exporter.test.ts`, `mobile/src/features/me/MeScreen.test.tsx`

**Interfaces:**
- Consumes: `parseTimeLabel`, `TIMES`, `useSettings`, `useEntries`, `useLock`, `useToast`, `pinVault`, `demoEntries`, `DEMO_DATA`, `summarizeEntry`, `fmtLong`, `VIS`, `Toggle`, `Chip`, `Button`.
- Produces:
  - `type ReminderResult = 'scheduled' | 'off' | 'denied'`, `syncReminders(s: { remind: boolean; remindTime: string }): Promise<ReminderResult>` — cancels every scheduled notification, then (if on) asks permission once and schedules **one** daily notification at the chosen time
  - `useRemindersSync(): void` — re-syncs when onboarding is done and `remind`/`remindTime` change; a denied permission turns `remind` off with the toast `Notifications are off for this app`
  - `buildExportHtml(entries: Entry[], name: string): string` (pure, escapes user text, oldest page first), `exportPages(entries: Entry[], name: string): Promise<'shared' | 'unavailable'>`
  - `<MeScreen />`

Spec rows: avatar + name + "N pages so far"; **Nightly nudge** card (toggle + time chips, chips only while on); **App lock** card (toggle, "Lock now" while on); rows **Export my pages**, **Replay the welcome**, **Reset demo data** (accent-700; development builds only). Toggling App lock on starts the PIN flow; toggling off clears the PIN.

- [ ] **Step 1: Write the failing tests**

`mobile/src/services/reminders.test.ts`:

```ts
import * as Notifications from 'expo-notifications';
import { syncReminders } from './reminders';

jest.mock('expo-notifications', () => ({
  cancelAllScheduledNotificationsAsync: jest.fn(async () => {}),
  scheduleNotificationAsync: jest.fn(async () => 'id'),
  setNotificationChannelAsync: jest.fn(async () => null),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
}));
const n = Notifications as jest.Mocked<typeof Notifications>;

beforeEach(() => {
  jest.clearAllMocks();
  n.getPermissionsAsync.mockResolvedValue({ granted: true, canAskAgain: true } as never);
});

it('turns everything off when reminders are off', async () => {
  expect(await syncReminders({ remind: false, remindTime: '9:00 pm' })).toBe('off');
  expect(n.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
  expect(n.scheduleNotificationAsync).not.toHaveBeenCalled();
});

it('schedules one daily notification at the chosen time', async () => {
  expect(await syncReminders({ remind: true, remindTime: '10:00 pm' })).toBe('scheduled');
  expect(n.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
  expect(n.scheduleNotificationAsync).toHaveBeenCalledWith(
    expect.objectContaining({ trigger: expect.objectContaining({ type: 'daily', hour: 22, minute: 0 }) }),
  );
});

it('cancels before scheduling so changing the time never leaves two reminders', async () => {
  await syncReminders({ remind: true, remindTime: '9:00 pm' });
  await syncReminders({ remind: true, remindTime: '11:00 pm' });
  expect(n.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(2);
  expect(n.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
  const cancel = n.cancelAllScheduledNotificationsAsync.mock.invocationCallOrder;
  const schedule = n.scheduleNotificationAsync.mock.invocationCallOrder;
  // cancel, schedule, cancel, schedule: each schedule is preceded by its own cancel
  expect(cancel[0]).toBeLessThan(schedule[0]);
  expect(schedule[0]).toBeLessThan(cancel[1]);
  expect(cancel[1]).toBeLessThan(schedule[1]);
});

it('asks for permission once when it can, and schedules if granted', async () => {
  n.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true } as never);
  n.requestPermissionsAsync.mockResolvedValue({ granted: true } as never);
  expect(await syncReminders({ remind: true, remindTime: '9:00 pm' })).toBe('scheduled');
  expect(n.requestPermissionsAsync).toHaveBeenCalledTimes(1);
});

it('reports denied, without scheduling, when permission is refused or blocked', async () => {
  n.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true } as never);
  n.requestPermissionsAsync.mockResolvedValue({ granted: false } as never);
  expect(await syncReminders({ remind: true, remindTime: '9:00 pm' })).toBe('denied');
  n.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: false } as never);
  expect(await syncReminders({ remind: true, remindTime: '9:00 pm' })).toBe('denied');
  expect(n.scheduleNotificationAsync).not.toHaveBeenCalled();
});

it('falls back to 9 pm if the saved time is corrupt', async () => {
  await syncReminders({ remind: true, remindTime: 'banana' });
  expect(n.scheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({ trigger: expect.objectContaining({ hour: 21, minute: 0 }) }));
});
```

`mobile/src/services/useRemindersSync.test.ts`:

```ts
import { renderHook, waitFor } from '@testing-library/react-native';
import { useSettings } from '@/state';
import { useToast } from '@/state/toastStore';
import { useRemindersSync } from './useRemindersSync';

const mockSync = jest.fn();
jest.mock('./reminders', () => ({ syncReminders: (...a: unknown[]) => mockSync(...a) }));
jest.mock('@/state', () => {
  const { create } = require('zustand');
  const update = jest.fn(async () => {});
  return {
    useSettings: Object.assign(
      create(() => ({ loaded: true, settings: { name: 'M', remind: true, remindTime: '9:00 pm', lockOn: false, onboarded: true }, update })),
      { __update: update },
    ),
  };
});
const set = (s: object) => (useSettings as unknown as { setState: (v: object) => void }).setState(s);
const update = (useSettings as unknown as { __update: jest.Mock }).__update;

beforeEach(() => {
  jest.clearAllMocks();
  mockSync.mockResolvedValue('scheduled');
  useToast.setState({ message: '' });
  set({ loaded: true, settings: { name: 'M', remind: true, remindTime: '9:00 pm', lockOn: false, onboarded: true } });
});

it('does not ask for notification permission before onboarding is finished', () => {
  set({ settings: { name: '', remind: true, remindTime: '9:00 pm', lockOn: false, onboarded: false } });
  renderHook(() => useRemindersSync());
  expect(mockSync).not.toHaveBeenCalled();
});

it('syncs once settings are loaded and onboarded, and again when the time changes', async () => {
  renderHook(() => useRemindersSync());
  await waitFor(() => expect(mockSync).toHaveBeenCalledWith({ remind: true, remindTime: '9:00 pm' }));
  set({ settings: { name: 'M', remind: true, remindTime: '10:00 pm', lockOn: false, onboarded: true } });
  await waitFor(() => expect(mockSync).toHaveBeenLastCalledWith({ remind: true, remindTime: '10:00 pm' }));
});

it('turns the reminder off and says so when permission is denied', async () => {
  mockSync.mockResolvedValue('denied');
  renderHook(() => useRemindersSync());
  await waitFor(() => expect(update).toHaveBeenCalledWith({ remind: false }));
  expect(useToast.getState().message).toBe('Notifications are off for this app');
});
```

`mobile/src/services/exporter.test.ts`:

```ts
import { demoEntries } from '@/domain/demoData';
import type { Entry } from '@/domain/types';
import { buildExportHtml } from './exporter';

const base = demoEntries('2026-10-08');

it('lists pages oldest first with date, time, mood and audience', () => {
  const html = buildExportHtml(base, 'Maya');
  expect(html).toContain('Maya’s journal');
  expect(html.indexOf('Sunday, 20 September')).toBeGreaterThan(-1);
  expect(html.indexOf('Sunday, 20 September')).toBeLessThan(html.indexOf('Wednesday, 7 October'));
  expect(html).toContain('3:45 pm');
  expect(html).toContain('Bright');
  expect(html).toContain('Friends');
});

it('escapes user text so a page can never inject markup', () => {
  const evil: Entry = { ...base[0], text: '<script>alert("x")</script> & "q" \'s', prompt: '<b>p</b>' };
  const html = buildExportHtml([evil], '<i>Name</i>');
  expect(html).not.toContain('<script>');
  expect(html).not.toContain('<b>p</b>');
  expect(html).not.toContain('<i>Name</i>');
  expect(html).toContain('&lt;script&gt;');
  expect(html).toContain('&amp;');
  expect(html).toContain('&quot;q&quot;');
});

it('keeps line breaks, the prompt, and "No words, just moments." for media-only pages', () => {
  const multi: Entry = { ...base[0], text: 'one\ntwo', prompt: 'Who?' };
  expect(buildExportHtml([multi], '')).toMatch(/one<br\s*\/?>two/);
  expect(buildExportHtml([multi], '')).toContain('Who?');
  const stickerOnly: Entry = { ...base[0], text: '', prompt: '', stickers: ['calm'] };
  expect(buildExportHtml([stickerOnly], '')).toContain('No words, just moments.');
});

it('handles an empty journal and a missing name', () => {
  const html = buildExportHtml([], '');
  expect(html).toContain('My journal');
  expect(html).toContain('No pages yet.');
});
```

`mobile/src/features/me/MeScreen.test.tsx`:

```tsx
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSettings } from '@/state';
import { useLock } from '@/state/lockStore';
import { useToast } from '@/state/toastStore';
import { MeScreen } from './MeScreen';

const mockPush = jest.fn();
const mockClear = jest.fn(async () => {});
const mockExport = jest.fn(async () => 'shared');
const mockReplaceAll = jest.fn(async () => {});
const mockUpdate = jest.fn(async () => {});
let mockDemo = false;

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@/config', () => ({ get DEMO_DATA() { return mockDemo; } }));
jest.mock('@/data/pinVaultInstance', () => ({ pinVault: { clear: () => mockClear() } }));
jest.mock('@/services/exporter', () => ({ exportPages: (...a: unknown[]) => mockExport(...a) }));
jest.mock('@/state', () => {
  const { create } = require('zustand');
  const { demoEntries } = require('@/domain/demoData');
  return {
    useSettings: create(() => ({
      settings: { name: 'Maya', remind: true, remindTime: '9:00 pm', lockOn: false, onboarded: true },
      loaded: true,
      update: (...a: unknown[]) => mockUpdate(...a),
    })),
    useEntries: create(() => ({ entries: demoEntries('2026-10-08'), replaceAll: (...a: unknown[]) => mockReplaceAll(...a) })),
  };
});

const DEFAULTS = { name: 'Maya', remind: true, remindTime: '9:00 pm', lockOn: false, onboarded: true };
const withSettings = (patch: Partial<typeof DEFAULTS>) => useSettings.setState({ settings: { ...DEFAULTS, ...patch } });

const wrap = () =>
  render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <MeScreen />
    </SafeAreaProvider>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockDemo = false;
  withSettings({});
  useToast.setState({ message: '' });
  useLock.setState({ locked: false, suspended: 0 });
});

it('shows the name and page count', () => {
  wrap();
  expect(screen.getByText('Maya')).toBeTruthy();
  expect(screen.getByText('8 pages so far')).toBeTruthy();
});

it('nightly nudge: choosing a time turns it on, the switch turns it off', async () => {
  wrap();
  expect(screen.getByRole('button', { name: '9:00 pm' })).toBeSelected();
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: '11:00 pm' })); });
  expect(mockUpdate).toHaveBeenCalledWith({ remindTime: '11:00 pm', remind: true });
  await act(async () => { fireEvent.press(screen.getByRole('switch', { name: 'Nightly nudge' })); });
  expect(mockUpdate).toHaveBeenCalledWith({ remind: false });
});

it('hides the time chips when reminders are off', () => {
  withSettings({ remind: false });
  wrap();
  expect(screen.queryByRole('button', { name: '9:00 pm' })).toBeNull();
});

it('app lock on starts the PIN flow', () => {
  wrap();
  fireEvent.press(screen.getByRole('switch', { name: 'App lock' }));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/pin', params: { after: 'me' } });
  expect(screen.queryByText('Lock now')).toBeNull();
});

it('app lock off clears the PIN, turns the flag off and says so', async () => {
  withSettings({ lockOn: true });
  wrap();
  await act(async () => { fireEvent.press(screen.getByRole('switch', { name: 'App lock' })); });
  expect(mockClear).toHaveBeenCalled();
  expect(mockUpdate).toHaveBeenCalledWith({ lockOn: false });
  expect(useToast.getState().message).toBe('App lock is off');
});

it('"Lock now" locks the app', () => {
  withSettings({ lockOn: true });
  wrap();
  fireEvent.press(screen.getByText('Lock now'));
  expect(useLock.getState().locked).toBe(true);
});

it('export announces itself and runs the exporter with all pages', async () => {
  wrap();
  await act(async () => { fireEvent.press(screen.getByText('Export my pages')); });
  expect(mockExport).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: 'demo-1' })]), 'Maya');
  expect(useToast.getState().message).toBe('Exporting 8 pages as PDF…');
});

it('export reports when sharing is unavailable or fails', async () => {
  wrap();
  mockExport.mockResolvedValueOnce('unavailable' as never);
  await act(async () => { fireEvent.press(screen.getByText('Export my pages')); });
  expect(useToast.getState().message).toBe('Sharing isn’t available on this device');
  mockExport.mockRejectedValueOnce(new Error('print failed'));
  await act(async () => { fireEvent.press(screen.getByText('Export my pages')); });
  expect(useToast.getState().message).toBe('Couldn’t export your pages. Try again.');
});

it('replay pushes the welcome flow', () => {
  wrap();
  fireEvent.press(screen.getByText('Replay the welcome'));
  expect(mockPush).toHaveBeenCalledWith('/onboarding');
});

it('has no "Reset demo data" row outside demo builds', () => {
  wrap();
  expect(screen.queryByText('Reset demo data')).toBeNull();
});

it('reset demo data restores the sample pages in demo builds', async () => {
  mockDemo = true;
  wrap();
  await act(async () => { fireEvent.press(screen.getByText('Reset demo data')); });
  expect(mockReplaceAll).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: 'demo-1' })]));
  expect(useToast.getState().message).toBe('Demo data restored');
});
```

(`jest.mock('@/config', …)` uses a getter so each test can flip `mockDemo`; settings are changed with `useSettings.setState` because the mocked store’s initial state is created once per file.)

- [ ] **Step 2: Run to verify they fail**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest src/services src/features/me`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

`mobile/src/services/reminders.ts`:

```ts
import * as Notifications from 'expo-notifications';
import { parseTimeLabel } from '@/lib/time';
import { useLock } from '@/state/lockStore';

export type ReminderResult = 'scheduled' | 'off' | 'denied';

const CHANNEL = 'nightly-nudge';

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return useLock.getState().withoutRelock(async () => (await Notifications.requestPermissionsAsync()).granted);
}

/** One reminder, never more: cancel everything first, then schedule a single daily notification. */
export async function syncReminders(s: { remind: boolean; remindTime: string }): Promise<ReminderResult> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!s.remind) return 'off';
  await Notifications.setNotificationChannelAsync(CHANNEL, { name: 'Nightly nudge', importance: Notifications.AndroidImportance.DEFAULT });
  if (!(await ensurePermission())) return 'denied';
  const { hour, minute } = parseTimeLabel(s.remindTime);
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Time to wind down', body: 'A mood, a few words. Two minutes is plenty.' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: CHANNEL },
  });
  return 'scheduled';
}
```

(On iOS `setNotificationChannelAsync` is a no-op. If the installed `expo-notifications` types name the trigger fields differently, follow the package's `DailyTriggerInput` type; the behaviour — a single repeating daily trigger — is what matters.)

`mobile/src/services/useRemindersSync.ts`:

```ts
import { useEffect } from 'react';
import { useSettings } from '@/state';
import { useToast } from '@/state/toastStore';
import { syncReminders } from './reminders';

export function useRemindersSync(): void {
  const loaded = useSettings((s) => s.loaded);
  const onboarded = useSettings((s) => s.settings.onboarded);
  const remind = useSettings((s) => s.settings.remind);
  const remindTime = useSettings((s) => s.settings.remindTime);

  useEffect(() => {
    // Wait until onboarding is finished so the permission prompt never interrupts the welcome flow.
    if (!loaded || !onboarded) return;
    let alive = true;
    syncReminders({ remind, remindTime })
      .then(async (r) => {
        if (alive && r === 'denied') {
          await useSettings.getState().update({ remind: false });
          useToast.getState().show('Notifications are off for this app');
        }
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [loaded, onboarded, remind, remindTime]);
}
```

In `mobile/app/_layout.tsx` add `import { useRemindersSync } from '@/services/useRemindersSync';` and call `useRemindersSync();` directly under `useRelockOnBackground();`. Also call, once at module scope, `Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }) })` (field names per the installed `expo-notifications` types) so a nudge that arrives while the app is open still shows.

`mobile/src/services/exporter.ts`:

```ts
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { summarizeEntry } from '@/domain/entrySummary';
import type { Entry } from '@/domain/types';
import { VIS } from '@/domain/visibility';
import { fmtLong } from '@/lib/dates';
import { useLock } from '@/state/lockStore';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** Text-only export: photos and voice notes are listed in the meta line but not embedded. Oldest page first. */
export function buildExportHtml(entries: Entry[], name: string): string {
  const title = name.trim() ? `${esc(name.trim())}’s journal` : 'My journal';
  const ordered = [...entries].sort((a, b) => (a.date === b.date ? a.createdAt - b.createdAt : a.date < b.date ? -1 : 1));
  const pages = ordered
    .map((e) => {
      const s = summarizeEntry(e);
      return `<section>
  <h2>${esc(fmtLong(e.date))} · ${esc(e.time)}</h2>
  <p class="meta">${esc(s.moodLabel)} · ${esc(VIS[e.vis].label)}</p>
  ${e.prompt ? `<p class="prompt">${esc(e.prompt)}</p>` : ''}
  <p>${esc(s.text).replace(/\n/g, '<br/>')}</p>
  ${s.meta ? `<p class="meta">${esc(s.meta)}</p>` : ''}
</section>`;
    })
    .join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"/><style>
body{font-family:Georgia,serif;color:#201e1d;padding:32px;line-height:1.5}
h1{font-size:28px}h2{font-size:16px;margin:0}section{margin:24px 0;page-break-inside:avoid}
.meta{color:#645c50;font-size:12px;margin:2px 0}.prompt{font-style:italic;color:#8c491a}
</style></head><body><h1>${title}</h1>${pages || '<p>No pages yet.</p>'}</body></html>`;
}

export async function exportPages(entries: Entry[], name: string): Promise<'shared' | 'unavailable'> {
  if (!(await Sharing.isAvailableAsync())) return 'unavailable';
  const { uri } = await Print.printToFileAsync({ html: buildExportHtml(entries, name) });
  await useLock.getState().withoutRelock(() => Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Export my pages' }));
  return 'shared';
}
```

`mobile/src/features/me/MeScreen.tsx`:

```tsx
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { DEMO_DATA } from '@/config';
import { pinVault } from '@/data/pinVaultInstance';
import { demoEntries } from '@/domain/demoData';
import { todayIso } from '@/lib/dates';
import { TIMES } from '@/lib/time';
import { exportPages } from '@/services/exporter';
import { useEntries, useSettings } from '@/state';
import { useLock } from '@/state/lockStore';
import { useToast } from '@/state/toastStore';
import { radii, ramp, colors } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { Icon } from '@/ui/Icon';
import { Screen } from '@/ui/Screen';
import { Toggle } from '@/ui/Toggle';

const card = { backgroundColor: colors.surface, borderRadius: radii.container, padding: 20, gap: 14 } as const;

function Row({ title, sub, right }: { title: string; sub: string; right: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={body(16, 'semi')}>{title}</Text>
        <Text style={[body(13), { color: ramp.neutral[700] }]}>{sub}</Text>
      </View>
      {right}
    </View>
  );
}

function ListButton({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({ height: 52, paddingHorizontal: 14, borderRadius: 24, justifyContent: 'center', backgroundColor: pressed ? (danger ? ramp.accent[100] : ramp.neutral[300]) : 'transparent' })}
    >
      <Text style={[body(15, 'semi'), { color: danger ? ramp.accent[700] : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

export function MeScreen() {
  const router = useRouter();
  const settings = useSettings((s) => s.settings);
  const update = useSettings((s) => s.update);
  const entries = useEntries((s) => s.entries);
  const show = useToast((s) => s.show);

  const toggleLock = async () => {
    if (settings.lockOn) {
      await pinVault.clear();
      await update({ lockOn: false });
      show('App lock is off');
    } else {
      router.push({ pathname: '/pin', params: { after: 'me' } });
    }
  };

  const doExport = async () => {
    show(`Exporting ${entries.length} ${entries.length === 1 ? 'page' : 'pages'} as PDF…`);
    try {
      if ((await exportPages(entries, settings.name)) === 'unavailable') show('Sharing isn’t available on this device');
    } catch {
      show('Couldn’t export your pages. Try again.');
    }
  };

  return (
    <Screen gap={18} bottomPad={30} topPad={18}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: ramp.accent2[300], alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[heading(28, 1), { color: ramp.accent2[900] }]}>{(settings.name || 'M').trim().charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={heading(28)}>{settings.name || 'friend'}</Text>
          <Text style={[body(14), { color: ramp.neutral[700] }]}>{`${entries.length} ${entries.length === 1 ? 'page' : 'pages'} so far`}</Text>
        </View>
      </View>

      <View style={card}>
        <Row
          title="Nightly nudge" sub="One reminder, at a time you choose"
          right={<Toggle value={settings.remind} onChange={(v) => update({ remind: v })} accessibilityLabel="Nightly nudge" />}
        />
        {settings.remind ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {TIMES.map((t) => (
              <Chip key={t} label={t} selected={settings.remindTime === t} onPress={() => update({ remindTime: t, remind: true })} />
            ))}
          </View>
        ) : null}
      </View>

      <View style={card}>
        <Row
          title="App lock" sub="Ask for your PIN when the app opens"
          right={<Toggle value={settings.lockOn} onChange={toggleLock} accessibilityLabel="App lock" />}
        />
        {settings.lockOn ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => useLock.getState().lock()}
            style={({ pressed }) => ({ alignSelf: 'flex-start', height: 44, paddingHorizontal: 18, borderRadius: radii.pill, borderWidth: 1.5, borderColor: colors.divider, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: pressed ? ramp.neutral[300] : 'transparent' })}
          >
            <Icon name="lock" size={16} />
            <Text style={body(14, 'semi')}>Lock now</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={{ backgroundColor: colors.surface, borderRadius: radii.container, padding: 8 }}>
        <ListButton label="Export my pages" onPress={doExport} />
        <ListButton label="Replay the welcome" onPress={() => router.push('/onboarding')} />
        {DEMO_DATA ? (
          <ListButton
            label="Reset demo data" danger
            onPress={async () => { await useEntries.getState().replaceAll(demoEntries(todayIso())); show('Demo data restored'); }}
          />
        ) : null}
      </View>
    </Screen>
  );
}
```

`mobile/app/(tabs)/me.tsx`:

```tsx
import { MeScreen } from '@/features/me/MeScreen';

export default MeScreen;
```

- [ ] **Step 4: Run to verify they pass**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest && npx tsc --noEmit`
Expected: PASS.

On a physical Android 13+ device: finish onboarding choosing 10 pm → the notification permission prompt appears after onboarding, not during; in Android system settings the app has exactly one "Nightly nudge" channel; change the time in Me and confirm (via `adb shell dumpsys notification | grep -i journal` or by setting the device clock) that only one alarm remains; deny the permission and confirm the toggle flips off with the toast; export produces a shareable PDF containing the pages.

- [ ] **Step 5: Commit**

```bash
cd /Users/luckyangelo/Dev/journ-al
git add mobile
git commit -m "feat: add Me screen with nightly reminders, app lock controls, PDF export and demo reset"
```

---

### Task 20: Polish, accessibility pass and release readiness

**Files:**
- Modify: `mobile/app.json`, `mobile/app/_layout.tsx`
- Create: `mobile/eas.json`, `mobile/README.md`, `mobile/.env.development`
- Test: `mobile/src/theme/noHardcodedColors.test.ts`

**Interfaces:**
- Produces: a preview APK build profile, a guard test that keeps hex colours inside `src/theme`, a README with run/test commands, and a completed manual QA record.

- [ ] **Step 1: Write the guard test (colours live in tokens only)**

`mobile/src/theme/noHardcodedColors.test.ts`:

```ts
/** @jest-environment node */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const ROOTS = [join(__dirname, '..'), join(__dirname, '..', '..', 'app')];
const HEX = /#[0-9a-fA-F]{6}\b/;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return files(p);
    return /\.(ts|tsx)$/.test(f) && !/\.test\.tsx?$/.test(f) ? [p] : [];
  });
}

it('has no hex colours outside src/theme (use tokens)', () => {
  const offenders = ROOTS.flatMap(files)
    .filter((f) => !f.includes(join('src', 'theme')))
    .filter((f) => HEX.test(readFileSync(f, 'utf8')));
  expect(offenders).toEqual([]);
});
```

- [ ] **Step 2: Run the guard against the finished app**

Run: `cd /Users/luckyangelo/Dev/journ-al/mobile && npx jest src/theme/noHardcodedColors.test.ts`
Expected: PASS if every task used tokens. If it FAILS, the output lists each offending file; replace each literal with the matching `colors`/`ramp` token (for example `'#c67139'` → `colors.accent`) and re-run. (This test is written last, so a first-run failure is a finding, not a mistake in the test.)

- [ ] **Step 3: Add the release configuration**

`mobile/app.json` (`expo.android` block additions): `"allowBackup": false` (journal pages must not flow into cloud backups unnoticed, and a restored database without the keystore PIN is exactly the lock-out case Task 13 guards against), `"adaptiveIcon": { "backgroundColor": "#f5ead8", "foregroundImage": "./assets/adaptive-icon.png" }`, `"permissions": ["CAMERA", "RECORD_AUDIO", "POST_NOTIFICATIONS", "USE_BIOMETRIC"]`. Create the launcher and adaptive icon from the Organic palette (a terracotta blob on `#f5ead8`) before the first store build; any 1024×1024 PNG works to unblock a preview build.

`mobile/eas.json`:

```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": { "developmentClient": true, "distribution": "internal", "android": { "buildType": "apk" } },
    "preview": { "distribution": "internal", "android": { "buildType": "apk" } },
    "production": { "android": { "buildType": "app-bundle" } }
  }
}
```

`mobile/.env.development`:

```
EXPO_PUBLIC_DEMO_DATA=1
```

(Keep `.env.development` out of production builds: it is only read by `expo start`/development client; verify the preview APK has no "Reset demo data" row.)

Font scaling: in `mobile/app/_layout.tsx` add, once at module scope, `import { Text, TextInput } from 'react-native'` and

```ts
// Keep the layout intact at large system font sizes without ignoring them.
(Text as unknown as { defaultProps?: object }).defaultProps = { ...(Text as unknown as { defaultProps?: object }).defaultProps, maxFontSizeMultiplier: 1.3 };
(TextInput as unknown as { defaultProps?: object }).defaultProps = { ...(TextInput as unknown as { defaultProps?: object }).defaultProps, maxFontSizeMultiplier: 1.3 };
```

`mobile/README.md`: a short file with `npm install`, `npx expo start`, `npx expo run:android`, `npm test`, `npm run typecheck`, the `EXPO_PUBLIC_DEMO_DATA` flag, and the note that Friends/Public are sample data until a backend exists.

- [ ] **Step 4: Verify everything**

Run each and confirm the stated result:

```bash
cd /Users/luckyangelo/Dev/journ-al/mobile
npx jest                      # all suites pass, including the colour guard
npx tsc --noEmit              # exit 0
npx expo-doctor               # no failing checks
npx expo export --platform android   # bundles without errors
grep -rn "console\." src app | grep -v test   # expect no output
```

Then complete the manual QA record on a physical Android device and an emulator (record pass/fail per line in the commit message body or in `mobile/README.md`):

- Onboarding: 4 steps, dots animate, Continue disabled for an empty/whitespace name, "No reminders" works, "Not now" and "Set a PIN" both land on Today.
- Lock: PIN pad layout matches the spec (76px keys, 16px dots); wrong PIN shows `That’s not it. Try again.`; mismatch shows `Those didn’t match. Start again.`; biometrics prompt appears when enrolled; Back never reveals content; backgrounding re-locks; taking a photo/using the mic does not re-lock.
- Today: mood slider recolours/reshapes/tilts the blob; bucket labels and hints match; deck swipe (rotation, fling past 90px, next card rises, spring-back under 90px), `n / 6` counter and mood-offset prompts; recent pages and See all.
- Write: all five sheets/rows from the spec (visibility copy and footnote, sticker grid, recording banner), the empty-save toast, success toasts for all three audiences, edit-in-place keeps date/time, back-dated "Write for this day", unsaved-changes alert.
- Timeline: calendar colours, today ring, selected ring, future days disabled, month wrap, legend, list headings.
- Friends/Profile: tab note copy, reactions, friend request/cancel, hidden-pages note.
- Me: nudge toggle/chips, app lock toggle flows, Lock now, export, replay welcome; "Reset demo data" absent in the preview APK.
- Accessibility: TalkBack reads every control with a sensible label, the mood slider adjusts with swipe up/down, every tap target is at least 44px (enable "Show layout bounds" if unsure), system font size at the largest setting does not clip the check-in card or PIN pad.
- Visual diff: open `design_handoff_interactive_journal/Journal Prototype.dc.html` in a browser beside the device and compare each screen at 372×800.

- [ ] **Step 5: Commit**

```bash
cd /Users/luckyangelo/Dev/journ-al
git add mobile
git commit -m "chore: add release config, colour-token guard test and QA notes"
```

---

## Out of Scope (follow-up plans)

- **Backend** for Friends/Public: authentication, friends graph and requests, feed, reactions, public profile link, and a real `SharingGateway` implementation (`publish`/`unpublish` already have a call site and tests). The v1 feed is sample data.
- Deleting a page (the handoff defines no delete flow; propose one before building).
- PIN attempt throttling and lock-out timers; automatic encrypted backups.
- Dark theme, localisation, tablet layouts, iOS visual polish and App Store setup.

## Decisions Made in This Plan (flag any you disagree with)

1. Expo (React Native) + TypeScript, per the handoff's recommendation; app lives in `journ-al/mobile/`, and `journ-al` becomes its own git repo like the sibling projects.
2. Demo pages and the "Reset demo data" row are development-only (`EXPO_PUBLIC_DEMO_DATA=1`); real users start with an empty journal. Friends/Public sample data ships until a backend exists.
3. Unlock is an overlay above the navigator; the app re-locks whenever it leaves the foreground, except around system dialogs (photo, camera, microphone, notification permission, share sheet).
4. Small additions beyond the handoff: discard-changes alert in Write; time-of-day greeting; "an okay day" grammar; photo/voice removal controls (x buttons); a `lockOn`-without-PIN reconciliation on boot; text-only PDF export; `allowBackup: false`.
5. Check-in feelings start unselected (the prototype pre-selected "grateful" only as demo state) and are saved with the page; mood defaults to 62 as in the prototype.
6. Default Android package id `com.luckyangelo.journal` and app name "Journal" in `app.json`; change before the first store build.

## Self-Review (completed against the spec)

- **Spec coverage:** tokens/type/radii/shadows/icons (Tasks 2, 9); navigation, FAB, screen/sheet animations (Tasks 9, 11); Onboarding 4 steps (12); Lock/PIN set-confirm-unlock, biometrics, secure hash storage (13); Today check-in, mood blob/slider, buckets, feelings, prompt deck, recent pages (3, 10, 14); Write incl. prompt card, visibility sheet and copy, stickers, photos, voice, recording banner, validation, toasts (7, 16, 17); Timeline calendar and list incl. Monday-first grid, rings, legend, empty state (4, 15); Friends feed and Profile incl. friend states and hidden-pages note (8, 18); Me incl. nudge, lock, export, replay, reset (19); data model and persistence (5, 6); reminders, camera/gallery, audio, notifications, secure storage, biometrics (13, 17, 19). Backend sync is explicitly out of scope.
- **Placeholder scan:** no TBD/TODO steps; the only stubs are the titled tab screens created in Task 11, each replaced by a named later task.
- **Type consistency:** `Entry`, `Photo`, `Voice`, `Settings`, `Person`, `Post` are defined once in `domain/types.ts`; store and repo method names (`save`, `load`, `update`, `replaceAll`, `upsert`, `list`) are used identically across tasks; route params (`entryId`, `prompt`, `date`, `after`) match between producers (Tasks 11, 12, 14, 15, 19) and consumers (Tasks 13, 16).
