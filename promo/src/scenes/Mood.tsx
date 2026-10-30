import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Rise, Words } from "../components";
import { C, MOODS, display, easeInOut, easeOut, moodColor, moodRadius, moodRotation, sans, useWide } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const CHIPS = ["grateful", "calm", "proud", "tired"];
const PICKED: Record<string, number> = { calm: 128, proud: 138 };

/** The check-in: one drag takes the mood blob from a heavy dusk violet to a bright lamp amber. */
export const Mood: React.FC = () => {
  const frame = useCurrentFrame();
  // Sweep up through the scale, settle on Good, then lift to Bright.
  const v =
    frame < 90
      ? interpolate(frame, [18, 78], [6, 66], { ...clamp, easing: easeInOut })
      : interpolate(frame, [96, 132], [66, 93], { ...clamp, easing: easeInOut });
  const color = moodColor(v);
  const enter = interpolate(frame, [0, 30], [0, 1], { ...clamp, easing: easeOut });
  const wide = useWide();
  // In 16:9 the words sit in a left column and the blob in a right one centred on x = 1330.

  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <Words
        text="Mood is a colour, not a number."
        at={0}
        gap={3}
        style={{
          position: "absolute",
          top: wide ? 160 : 170,
          left: wide ? 140 : undefined,
          width: wide ? 760 : 900,
          justifyContent: wide ? "flex-start" : "center",
          fontFamily: display,
          fontSize: 100,
          lineHeight: 1.08,
          color: C.text,
          letterSpacing: "-0.015em",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: wide ? 1330 - 600 : undefined,
          top: wide ? -150 : 330,
          width: 1200,
          height: 1200,
          borderRadius: "50%",
          background: `radial-gradient(circle, color-mix(in srgb, ${color} 34%, transparent) 0%, transparent 62%)`,
          opacity: enter,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: wide ? 210 : 540,
          left: wide ? 1330 - 240 : undefined,
          width: 480,
          height: 480,
          backgroundColor: color,
          borderRadius: moodRadius(v),
          rotate: `${moodRotation(v)}deg`,
          scale: String((0.55 + enter * 0.45) * (1 + Math.sin(frame / 14) * 0.012)),
          opacity: enter,
          boxShadow: `0 40px 90px color-mix(in srgb, ${color} 35%, transparent)`,
        }}
      />

      <div style={{ position: "absolute", top: wide ? 755 : 1085, left: wide ? 1330 - 540 : undefined, width: 1080, height: 190, opacity: enter }}>
        {MOODS.map(([label, line], i) => {
          const centre = i * 20 + 10;
          const d = v - centre;
          return (
            <div
              key={label}
              style={{
                position: "absolute",
                inset: 0,
                textAlign: "center",
                opacity: interpolate(Math.abs(d), [6, 13], [1, 0], clamp),
                translate: `0px ${-d * 2.4}px`,
              }}
            >
              <div style={{ fontFamily: display, fontSize: 104, color: C.text, lineHeight: 1.1 }}>{label}</div>
              <div style={{ fontFamily: sans, fontSize: 44, color: C.muted }}>{line}</div>
            </div>
          );
        })}
      </div>

      <Rise at={10} style={{ position: "absolute", top: wide ? 610 : 1360, left: wide ? 140 : undefined, width: wide ? 700 : 860 }}>
        <div style={{ position: "relative", height: 26, borderRadius: 999, background: `linear-gradient(in oklch to right, ${C.violet}, ${C.amber})` }}>
          <div
            style={{
              position: "absolute",
              top: -26,
              left: `calc(${v}% - 39px)`,
              width: 78,
              height: 78,
              borderRadius: "50%",
              backgroundColor: "#efe7d6",
              border: `8px solid ${color}`,
              boxSizing: "border-box",
              boxShadow: `0 8px 24px ${C.shadow}aa`,
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40, fontFamily: sans, fontSize: 36, color: C.quiet }}>
          <span>Heavy</span>
          <span>Bright</span>
        </div>
      </Rise>

      <div style={{ position: "absolute", top: wide ? 800 : 1590, left: wide ? 140 : undefined, display: "flex", gap: 22 }}>
        {CHIPS.map((chip, i) => {
          const picked = PICKED[chip] !== undefined ? interpolate(frame, [PICKED[chip], PICKED[chip] + 10], [0, 1], clamp) : 0;
          return (
            <Rise key={chip} at={100 + i * 5} distance={40} blur={6}>
              <div
                style={{
                  fontFamily: sans,
                  fontSize: 42,
                  fontWeight: 500,
                  padding: "20px 40px",
                  borderRadius: 999,
                  border: `3px solid ${picked ? C.teal : C.line}`,
                  backgroundColor: `color-mix(in srgb, ${C.teal} ${picked * 100}%, transparent)`,
                  color: picked > 0.5 ? C.card : C.text,
                  scale: String(1 + Math.sin(picked * Math.PI) * 0.08),
                }}
              >
                {chip}
              </div>
            </Rise>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
