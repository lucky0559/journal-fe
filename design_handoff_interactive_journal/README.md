# Handoff: Interactive Journal (Android)

## Overview
A warm, low-pressure journaling app for young adults who are new to journaling. Daily mood check-in, swipeable prompts, scrapbook-style entries (text, photos, voice notes, stickers), a mood-coloured calendar timeline, per-page sharing (Only me / Friends / Public), a feed of friends' and public pages, profiles, and an optional PIN lock.

## About the Design Files
The files in this bundle are **design references built in HTML**. They are prototypes that show the intended look and behaviour; they are not production code to copy. Recreate them in the target environment. If there is no codebase yet, the recommended stack is **Expo (React Native) + TypeScript**: it is closest to the prototype's component and state model, and it can ship to iOS later. Kotlin + Jetpack Compose is a valid alternative for a native-only Android app.

Open `Journal Prototype.dc.html` in a browser to click through it; it needs `support.js` and the `_ds/` folder beside it. `Journal Directions.dc.html` shows the three early directions (1a check-in, 1b scrapbook, 1c prompt deck). The final prototype combines 1a + 1c on Today and 1b on the Write screen.

## Fidelity
**High-fidelity.** Colours, type, radii, spacing and interactions are final. Recreate them closely using the tokens below. The device frame (372×800, 44px corner radius, punch-hole status bar, gesture bar) is presentation only; the real app uses system bars.

## Design Tokens (Organic design system)
Source: `_ds/organic-…/styles.css`. Port these to a theme file.

**Colours**
- bg `#f5ead8` · surface `#ebddc5` · text `#201e1d` · divider = text at 16% alpha
- accent (terracotta) `#c67139`; ramp 100 `#fff2eb` · 200 `#ffe1d0` · 300 `#ffc6a5` · 400 `#f6a06b` · 500 `#d67f48` · 600 `#b2622d` · 700 `#8c491a` · 800 `#643312` · 900 `#402310`
- accent-2 (sage) `#7a8a5e`; ramp 100 `#f0fae1` · 200 `#e1eecc` · 300 `#ccdbb2` · 400 `#aebf92` · 500 `#8fa073` · 600 `#728157` · 700 `#56633f` · 800 `#3d472b` · 900 `#272e1b`
- neutral ramp 100 `#f9f4ed` · 200 `#eee7db` · 300 `#dcd3c4` · 400 `#c0b6a5` · 500 `#a19786` · 600 `#82796a` · 700 `#645c50` · 800 `#474238` · 900 `#2e2b25`
- **Mood colour** (0–100) = OKLCH mix of accent-2-600 → accent-500, where t = mood%. `color-mix(in oklch, accent-500 t%, accent-2-600)`
- Rule: paragraph-size text in accent uses accent-700, never the base accent.

**Type**: headings in **Caprasimo** 400 (display only); body in **Figtree** 400/600/700 (Google Fonts). Sizes used: 36/34/32/28 screen titles (line-height 1.08–1.1, letter-spacing -0.015em), 23–28 prompt cards, 22 sheet titles, 20 month label, 18 primary buttons and the editor body, 16 card body (lh 1.45–1.5), 15 section labels (600), 13–12 meta, 11 tags/kickers (700, uppercase kickers +0.08em).

**Radii**: pills/buttons/inputs 999px; cards 28px; large containers 32px; bottom sheets 32px top corners; photo tiles 22–26px; FAB 22px.
**Spacing**: screen padding 22px horizontal; section gap 18–24px; card padding 16–22px; chip gap 8px.
**Shadows**: sm `0 1px 2px rgba(46,43,37,.14)` · md `0 3px 10px rgba(46,43,37,.16)` · lg `0 12px 32px rgba(46,43,37,.22)`.
**Icons**: Lucide, stroke-width **2.75**, 16–22px. Used: house, calendar, users, user, plus, x, arrow-left, chevron-left/right/down, image, mic, smile, lock, globe, pencil, delete (backspace).
**Hit targets**: ≥44px everywhere. Pressed states use one step darker on the accent ramp (600).

## Navigation
Bottom nav (76px, surface bg), 4 items: **Today · Timeline · Friends · Me**. Material 3 style: the active item gets a 60×32 pill in accent-300, with the label in accent-900 at weight 700; inactive items are neutral-700 at 600. The nav is hidden on Onboarding, Lock and Write. The extended FAB "New page" (pencil icon, 60px tall, accent fill, shadow-lg) appears on Today and Timeline, bottom-right 18px.

Screen enter animation: fade + translateY(10px→0), 300ms ease-out. Bottom sheets slide up 280ms cubic-bezier(.3,.9,.4,1) over a scrim of neutral-900 at 35%.

## Screens

### 1. Onboarding (4 steps)
Top: back arrow (steps 2–4) and progress dots (8px; the active one grows to 26px wide, accent; future ones neutral-300). Bottom: full-width primary pill, 56px tall, Caprasimo 18.
1. Decorative soft shapes (190px accent-300 circle, 150px accent-2-300 blob, 92px accent-500 circle). Title "A softer place to put your day." Body "A mood, a few words, maybe a photo. Two minutes is plenty." CTA "Let's begin".
2. "What should we call you?" / "Only you will ever see this." Pill input 56px with placeholder "Your first name". CTA "Continue" is disabled (45% opacity) while the field is empty.
3. "When do you usually wind down?" / "We'll send one gentle nudge a night. Never more." Two-column chips: 8:00 pm, 9:00 pm, 10:00 pm, 11:00 pm, plus a full-width "No reminders". The selected chip is filled accent-2-600 with neutral-100 text.
4. Lock icon in a 120px accent-2-200 circle. "Keep your pages private?" / "Add a 4-digit PIN and the app will ask for it every time it opens. You can change this later." CTA "Set a PIN" goes to the PIN set flow; the ghost button "Not now" goes to Today.

### 2. Lock / PIN
Lock icon in a 64px circle; a title; a subtitle (error text turns accent-700); 4 dots (16px, filled = text colour, error border = accent); a 3×4 keypad of 76px circles in neutral-200 with Caprasimo 28 digits and a backspace key.
- set: "Choose a PIN" / "Four digits you'll remember." → confirm: "Once more" / "Type the same four digits." A mismatch shows "Those didn't match. Start again." and returns to set.
- unlock: "Welcome back, {name}." / "Enter your PIN". A wrong PIN shows "That's not it. Try again."
- Set and confirm modes show a "Cancel" button. The prototype also shows the PIN as a hint; remove that in production. Production should add a biometric unlock option and store the PIN as a hash in secure storage.

### 3. Today
- Date line (13/600, neutral-700) and an avatar initial (40px accent-2-300 circle; tapping it goes to Me).
- "Good evening, {name}." (Caprasimo 34).
- **Check-in card** (surface, radius 32): label "How are you arriving?"; an 88px **mood blob** whose colour = mood colour, whose border-radius interpolates between a droopy shape (low) and a lifted shape (high), and whose rotation goes from -12° to +12°; the mood label (Caprasimo 30) and hint. A custom slider: 12px track with a gradient accent-2-600 → neutral-300 → accent-500; a 30px thumb with a 3px border in the mood colour; end labels "Heavy" and "Bright". Mood buckets: 0–20 Heavy "Go easy tonight", 20–40 Low "That counts too", 40–60 Okay "Somewhere in the middle", 60–80 Good "Nice. Hold onto it", 80–100 Bright "Let's catch this one". Feeling chips (toggle): grateful, tired, anxious, proud, lonely, calm.
- **Tonight's prompts** deck: 3 stacked cards (212px tall, radius 32, cycling backgrounds accent-200 / accent-2-200 / neutral-200 with the matching 900 ink). Kicker "For a {mood} day", counter "n / 6", prompt in Caprasimo 23, button "Write this". Drag the top card horizontally; it rotates dx/16 degrees. Past 90px it flies out (260ms) and the next card animates up from behind (translateY 14px and scale 0.95 per depth). The prompt order is offset by the mood bucket.
- **Recent pages**: the 2 latest entry cards, plus "See all" (Timeline, List mode).

### 4. Write (create or edit)
- Top bar: close (x), date "Thu, 8 Oct · 9:41 pm", primary "Save" pill.
- A mood row with a 44px blob, the label, and a compact slider (8px track, 24px thumb).
- **Visibility pill** (40px): icon + label + chevron. It opens the sheet "Who can read this page?" with three options:
  - Only me (lock): "Stays on this phone, behind your lock."
  - Friends (users, sage tint): "People you've added can read it in their feed."
  - Public (globe, terracotta tint): "Anyone with your profile link can read it, photos and voice notes included."
  The sheet footnote reads "Mood and feelings stay private either way. You can change this anytime."
- Prompt card (if started from a prompt): accent-200, Caprasimo 19, with an x to remove it.
- Borderless textarea (Figtree 18/1.55) with placeholder "Start anywhere. One word is enough."
- Attachments (wrapping row): photo tiles 104×104, radius 24, rotated ±2°, each with a remove x; voice-note pills 52px tall in accent-200 with a play circle, a waveform and the duration; sticker blobs 72px in a ramp colour with a Caprasimo label (tap to remove).
- Recording banner: a pulsing accent dot, "Listening… 0:07", and a "Done" button.
- Bottom toolbar (surface bg): Photo · Voice · Sticker pills, 48px each.
- Sticker sheet, 4-column grid: calm, cozy, proud, tired, grateful, rainy, brave, meh.
- Validation: Save with no text and no media shows the toast "Add a word, a photo, anything". On success the app returns to the previous screen with the toast "Saved to today's page", adding "· shared with friends" or "· public" when applicable.

### 5. Timeline
- Title "Your pages" and a segmented control Calendar | List (pill container in surface, active segment accent fill).
- **Calendar**: month header with chevrons; a Monday-first grid; 38px day circles. Days with entries are filled with the mood colour (the average if there are several) and show bold neutral-100 numbers. Today has a 2px accent inner ring; the selected day has a 2px gap plus a 2.5px text-colour ring; future days are disabled. A legend bar runs Heavy → Bright. Below the grid: the selected day's entries, or a dashed empty state "Nothing written this day." with "Write for this day".
- **List**: all entries grouped under uppercase month headings (accent-700).
- **Entry card** (everywhere): neutral-100, radius 28, shadow-sm. Meta row: mood dot, date/time and mood label, plus a right-aligned Friends/Public tag. Body 16px clamped to 3 lines. Media line in accent-2-700, e.g. "2 photos · voice 0:38 · cozy". Tapping opens it in Write.

### 6. Friends (feed)
- Title "Others' pages" and a segmented control Friends | Public, with a note under it.
- Friends shows posts from accepted friends; Public shows every public post.
- Post card: avatar and name (both open the profile), time, visibility tag, optional prompt (Caprasimo 16, accent-800), body, optional photo (170px), and reactions "Sending a hug · n" and "Same · n" (toggle; active = accent-200 fill with an accent border).

### 7. Profile
Back arrow; 76px avatar; name in Caprasimo 28; bio. Friend button: "Add friend" (primary), "Request sent" (outline; tap to cancel) or "Friends". A count "n pages you can read" sits above the visible posts. Friends-only posts are hidden from non-friends, with the dashed note "n more pages are for friends only."

### 8. Me (settings)
Avatar, name and "N pages so far". Cards:
- Nightly nudge: a toggle (52×32, on = accent-2-600) plus time chips.
- App lock: the toggle starts the PIN set flow and toggling off clears the PIN; "Lock now" sits below it.
- Rows: Export my pages · Replay the welcome · Reset demo data (in accent-700).

## State / Data Model
```ts
type Visibility = 'private' | 'friends' | 'public';
interface Entry { id: string; date: string /*YYYY-MM-DD*/; time: string; mood: number /*0-100*/;
  feelings?: string[]; text: string; prompt?: string; vis: Visibility;
  photos: { id: string; uri: string }[]; voices: { id: string; uri: string; seconds: number }[]; stickers: string[]; }
interface Settings { name: string; remind: boolean; remindTime: string; lockOn: boolean; pinHash?: string; onboarded: boolean; }
interface Person { id: string; name: string; bio: string; avatar?: string; friendState: 'none'|'requested'|'friends'; }
interface Post extends Entry { authorId: string; reactions: { hug: number; same: number; mine: { hug: boolean; same: boolean } }; }
```
- App start: not onboarded goes to Onboarding; lock on goes to Lock; otherwise Today.
- Persist entries and settings locally (the prototype uses localStorage; use SQLite/MMKV plus file storage for media).
- Private entries never leave the device. Friends/Public entries need a backend for sync, a friends graph, the feed, reactions and a public profile link. Flipping a page back to private must remove it server-side.
- Native features: camera/gallery picker, audio recording, a local notification at remindTime, secure storage for the PIN, and a biometric prompt.

## Assets
No raster assets. Photos appear as striped placeholders and are replaced by user media. The fonts are Google Fonts; the icons come from Lucide. People and posts in the feed are sample data.

## Files
- `Journal Prototype.dc.html`: the full interactive prototype (its logic class holds all state, the seed data and copy).
- `Journal Directions.dc.html`: the early Today explorations.
- `_ds/…/styles.css` (also copied as `organic.css`): the design tokens.
- `support.js`, `_ds/…/_ds_bundle.js`: the runtime needed to open the HTML files.
