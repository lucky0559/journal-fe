import { Audio } from "@remotion/media";
import { springTiming, TransitionSeries } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { AbsoluteFill, interpolate, staticFile } from "remotion";
import { Backdrop } from "./components";
import { Hook } from "./scenes/Hook";
import { Month } from "./scenes/Month";
import { Mood } from "./scenes/Mood";
import { Outro } from "./scenes/Outro";
import { Private } from "./scenes/Private";
import { Write } from "./scenes/Write";

const timing = springTiming({ config: { damping: 200 }, durationInFrames: 24 });

/**
 * The whole promo: six scenes over one shared night backdrop, 870 frames (29 s). The music runs at 90 BPM, so a bar is
 * 80 frames; every cut starts on a bar or half bar (120, 280, 440, 560, 720) and the outro lands on the home chord.
 */
export const Promo: React.FC = () => (
  <AbsoluteFill>
    <Backdrop />
    <TransitionSeries>
      <TransitionSeries.Sequence name="Hook" durationInFrames={144}>
        <Hook />
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
      <TransitionSeries.Sequence name="Month" durationInFrames={144}>
        <Month />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={timing} />
      <TransitionSeries.Sequence name="Private" durationInFrames={184}>
        <Private />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={timing} />
      <TransitionSeries.Sequence name="Outro" durationInFrames={150}>
        <Outro />
      </TransitionSeries.Sequence>
    </TransitionSeries>
    <Soundtrack />
  </AbsoluteFill>
);

const sfx = (name: string) => staticFile(`audio/${name}.wav`);

// Voiceover clips (scripts/make-voiceover.mjs): [file, first frame, length in frames]. Each line starts on its beat:
// "Add a photo" with the photo tap, "until you choose to share it" over the switch, "Journ.al" (said "journal") with the wordmark.
const VOICEOVER = [
  ["01-hook", 22, 65],
  ["02-mood", 136, 104],
  ["03-write", 300, 34],
  ["04-photo", 362, 83],
  ["05-month", 462, 53],
  ["06-private", 572, 111],
  ["07-outro", 742, 95],
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

/** Original music plus sound effects placed on the frames where things happen (made by scripts/make-audio.mjs). */
const Soundtrack: React.FC = () => (
  <>
    <Audio name="Music" src={sfx("music")} volume={musicVolume} />
    {VOICEOVER.map(([file, from]) => (
      <Audio key={file} name={`Voice ${file}`} from={from} src={staticFile(`voiceover/${file}.wav`)} volume={0.8} />
    ))}

    {/* Hook: one tuned pop per brand shape (C, E, G over the Cmaj9) */}
    <Audio name="Pop violet" from={2} src={sfx("pop-72")} volume={0.32} />
    <Audio name="Pop teal" from={9} src={sfx("pop-76")} volume={0.32} />
    <Audio name="Pop amber" from={16} src={sfx("pop-79")} volume={0.32} />

    {/* Scene changes */}
    <Audio name="Whoosh to Mood" from={118} src={sfx("whoosh")} volume={0.26} />
    <Audio name="Whoosh to Write" from={278} src={sfx("whoosh")} volume={0.26} />
    <Audio name="Whoosh to Month" from={438} src={sfx("whoosh")} volume={0.26} />
    <Audio name="Whoosh to Private" from={558} src={sfx("whoosh")} volume={0.26} />
    <Audio name="Whoosh to Outro" from={718} src={sfx("whoosh")} volume={0.22} />

    {/* Mood: two feelings picked */}
    <Audio name="Pick calm" from={248} src={sfx("pop-74")} volume={0.3} />
    <Audio name="Pick proud" from={258} src={sfx("pop-79")} volume={0.3} />

    {/* Write: typing, photo, voice note */}
    <Audio name="Typing" from={298} src={sfx("typing")} volume={0.2} />
    <Audio name="Tap Photo" from={364} src={sfx("tap")} volume={0.3} />
    <Audio name="Photo lands" from={378} src={sfx("paper")} volume={0.4} />
    <Audio name="Tap Voice" from={396} src={sfx("tap")} volume={0.3} />
    <Audio name="Voice note" from={404} src={sfx("pop-81")} volume={0.26} />

    {/* Month: the calendar fills, today gets its ring */}
    <Audio name="Calendar shimmer" from={466} src={sfx("shimmer")} volume={0.36} />
    <Audio name="Today" from={544} src={sfx("pop-84")} volume={0.26} />

    {/* Private: Only me to Friends */}
    <Audio name="Tap Friends" from={624} src={sfx("tap")} volume={0.28} />
    <Audio name="Switch" from={630} src={sfx("switch")} volume={0.34} />

    {/* Outro */}
    <Audio name="Icon chime" from={726} src={sfx("chime")} volume={0.5} />
    <Audio name="For Android" from={776} src={sfx("pop-79")} volume={0.24} />
  </>
);
