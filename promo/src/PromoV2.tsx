import { Audio } from "@remotion/media";
import { springTiming, TransitionSeries } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { AbsoluteFill, interpolate, staticFile } from "remotion";
import { Backdrop } from "./components";
import { Friends, HUGS, SAME_AT, SHARE_AT, TOAST_AT } from "./scenes/Friends";
import { HOPS, HookLumi } from "./scenes/HookLumi";
import { Month } from "./scenes/Month";
import { Mood } from "./scenes/Mood";
import { LUMI_AT, Outro } from "./scenes/Outro";
import { DRAG, PICKS, Stickers } from "./scenes/Stickers";
import { Write } from "./scenes/Write";

const timing = springTiming({ config: { damping: 200 }, durationInFrames: 24 });

// Where each scene starts (the transitions overlap by 24 frames). Every cut is on the 80-frame bar grid or a half bar,
// and the outro starts on bar 12, where music-v2 lands on the home chord.
const AT = { hook: 0, mood: 120, write: 280, stickers: 440, month: 600, friends: 760, outro: 960 } as const;
export const PROMO_V2_FRAMES = 1130;

/**
 * Promo v2 (37.7 s): Lumi opens, then mood, writing, stickers, the month, sharing with friends and the outro, over the
 * same night backdrop as v1. Mood, Write and Month are v1's scenes; the rest are new.
 */
export const PromoV2: React.FC = () => (
  <AbsoluteFill>
    <Backdrop />
    <TransitionSeries>
      <TransitionSeries.Sequence name="Hook (Lumi)" durationInFrames={144}>
        <HookLumi />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={timing} />
      <TransitionSeries.Sequence name="Mood" durationInFrames={184}>
        <Mood />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={timing} />
      <TransitionSeries.Sequence name="Write" durationInFrames={184}>
        <Write />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={timing} />
      <TransitionSeries.Sequence name="Stickers" durationInFrames={184}>
        <Stickers />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={timing} />
      <TransitionSeries.Sequence name="Month" durationInFrames={184}>
        <Month />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={timing} />
      <TransitionSeries.Sequence name="Friends" durationInFrames={224}>
        <Friends />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={timing} />
      <TransitionSeries.Sequence name="Outro" durationInFrames={170}>
        <Outro lumi />
      </TransitionSeries.Sequence>
    </TransitionSeries>
    <Soundtrack />
  </AbsoluteFill>
);

const sfx = (name: string) => staticFile(`audio/${name}.wav`);

// Voiceover (scripts/make-voiceover.mjs --v2): [file, first frame, length in frames]. Each line starts just after its
// scene settles; "Add a photo" lands with the photo tap, "send a hug back" with the first hug.
const VOICEOVER = [
  ["01-hook", AT.hook + 14, 110],
  ["02-mood", AT.mood + 16, 107],
  ["03-write", AT.write + 20, 35],
  ["04-photo", AT.write + 82, 84],
  ["05-stickers", AT.stickers + 16, 107],
  ["06-month", AT.month + 22, 53],
  ["07-friends", AT.friends + 12, 152],
  ["08-outro", AT.outro + 22, 81],
] as const;

/** Music level: dips to 30% while a line is spoken, easing down and back over 8 frames. */
const musicVolume = (f: number) => {
  const duck = Math.max(
    ...VOICEOVER.map(([, from, len]) =>
      interpolate(f, [from - 8, from, from + len, from + len + 8], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    ),
  );
  return interpolate(f, [0, 10], [0, 0.8], { extrapolateRight: "clamp" }) * (1 - 0.7 * duck);
};

const Soundtrack: React.FC = () => (
  <>
    <Audio name="Music" src={sfx("music-v2")} volume={musicVolume} />
    {VOICEOVER.map(([file, from]) => (
      <Audio key={file} name={`Voice ${file}`} from={from} src={staticFile(`voiceover-v2/${file}.wav`)} volume={0.8} />
    ))}

    {/* Hook: Lumi pops up, the moon and a sparkle arrive, two soft hops */}
    <Audio name="Lumi pops" from={4} src={sfx("pop-72")} volume={0.34} />
    <Audio name="Moon" from={12} src={sfx("pop-76")} volume={0.26} />
    <Audio name="Sparkle" from={22} src={sfx("pop-79")} volume={0.24} />
    {HOPS.map((h, i) => (
      <Audio key={h} name={`Hop ${i + 1} lands`} from={h + 28} src={sfx("tap")} volume={0.22} />
    ))}

    {/* Scene changes */}
    {[AT.mood, AT.write, AT.stickers, AT.month, AT.friends, AT.outro].map((at, i) => (
      <Audio key={at} name={`Whoosh ${i + 1}`} from={at - 2} src={sfx("whoosh")} volume={i === 5 ? 0.22 : 0.26} />
    ))}

    {/* Mood: two feelings picked (same frames as v1, the scene starts at the same place) */}
    <Audio name="Pick calm" from={AT.mood + 128} src={sfx("pop-74")} volume={0.3} />
    <Audio name="Pick proud" from={AT.mood + 138} src={sfx("pop-79")} volume={0.3} />

    {/* Write: typing, photo, voice note */}
    <Audio name="Typing" from={AT.write + 18} src={sfx("typing")} volume={0.2} />
    <Audio name="Tap Photo" from={AT.write + 84} src={sfx("tap")} volume={0.3} />
    <Audio name="Photo lands" from={AT.write + 98} src={sfx("paper")} volume={0.4} />
    <Audio name="Tap Voice" from={AT.write + 116} src={sfx("tap")} volume={0.3} />
    <Audio name="Voice note" from={AT.write + 124} src={sfx("pop-81")} volume={0.26} />

    {/* Stickers: three picks that pop onto the page, a pick-up and a drop */}
    {PICKS.map((p, i) => (
      <Audio key={p} name={`Sticker ${i + 1}`} from={AT.stickers + p - 6} src={sfx("tap")} volume={0.26} />
    ))}
    {PICKS.map((p, i) => (
      <Audio key={`pop${p}`} name={`Sticker ${i + 1} lands`} from={AT.stickers + p + 14} src={sfx(["pop-74", "pop-79", "pop-81"][i])} volume={0.28} />
    ))}
    <Audio name="Pick up" from={AT.stickers + DRAG[0] - 6} src={sfx("tap")} volume={0.24} />
    <Audio name="Drop" from={AT.stickers + DRAG[1]} src={sfx("paper")} volume={0.3} />

    {/* Month: the calendar fills, today gets its ring */}
    <Audio name="Calendar shimmer" from={AT.month + 26} src={sfx("shimmer")} volume={0.36} />
    <Audio name="Today" from={AT.month + 104} src={sfx("pop-84")} volume={0.26} />

    {/* Friends: Only me to Friends, three hugs and a Same, the bell */}
    <Audio name="Tap share" from={AT.friends + SHARE_AT - 6} src={sfx("tap")} volume={0.28} />
    <Audio name="Switch" from={AT.friends + SHARE_AT} src={sfx("switch")} volume={0.34} />
    {HUGS.map((h, i) => (
      <Audio key={h} name={`Hug ${i + 1}`} from={AT.friends + h} src={sfx(["pop-76", "pop-79", "pop-84"][i])} volume={0.26} />
    ))}
    <Audio name="Bell" from={AT.friends + TOAST_AT} src={sfx("whoosh")} volume={0.12} />
    <Audio name="Same" from={AT.friends + SAME_AT} src={sfx("pop-81")} volume={0.22} />

    {/* Outro */}
    <Audio name="Icon chime" from={AT.outro + 6} src={sfx("chime")} volume={0.5} />
    <Audio name="Lumi lands" from={AT.outro + LUMI_AT + 16} src={sfx("pop-81")} volume={0.24} />
    <Audio name="For Android" from={AT.outro + 56} src={sfx("pop-79")} volume={0.24} />
  </>
);
