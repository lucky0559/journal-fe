import { loadFont as loadCaprasimo } from "@remotion/google-fonts/Caprasimo";
import { loadFont as loadFigtree } from "@remotion/google-fonts/Figtree";
import { Easing, useVideoConfig } from "remotion";

/** True in the 16:9 version, where scenes lay out in two columns instead of one stack. */
export const useWide = () => {
  const { width, height } = useVideoConfig();
  return width > height;
};

// The app's "Lamplight" palette (mobile/src/theme/tokens.ts).
export const C = {
  bg: "#081a1c",
  surface: "#112527",
  card: "#182c2e",
  raised: "#223639",
  line: "#304446",
  text: "#f1ebdc",
  muted: "#b5b1a6",
  quiet: "#8c978e",
  accent: "#eca338",
  accentPanel: "#432d0e",
  accentInk: "#ffebd2",
  teal: "#5fb7a5",
  tealPanel: "#153730",
  tealInk: "#d7f2eb",
  violet: "#7a77ba",
  amber: "#f8ac3d",
  paper: "#faf7ee",
  shadow: "#010708",
} as const;

export const display = loadCaprasimo("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily;
export const sans = loadFigtree("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] }).fontFamily;

/** Expo-style ease out: fast start, long soft landing. */
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

/** The mood colour for 0-100, mixed in OKLCH like the app (violet passes through rose to amber). */
export const moodColor = (v: number) =>
  `color-mix(in oklch, ${C.violet} ${(100 - v).toFixed(2)}%, ${C.amber})`;

const LO = [62, 38, 34, 66, 70, 44, 56, 30]; // droopy
const HI = [44, 56, 58, 42, 40, 42, 58, 60]; // lifted

/** The mood blob's border radius for 0-100 (same shapes as the app's moodRadii). */
export const moodRadius = (v: number) => {
  const r = LO.map((a, i) => (a + (HI[i] - a) * (v / 100)).toFixed(1) + "%");
  return `${r.slice(0, 4).join(" ")} / ${r.slice(4).join(" ")}`;
};

export const moodRotation = (v: number) => -12 + v * 0.24;

export const MOODS = [
  ["Heavy", "Go easy tonight"],
  ["Low", "That counts too"],
  ["Okay", "Somewhere in the middle"],
  ["Good", "Nice. Hold onto it"],
  ["Bright", "Let’s catch this one"],
] as const;
