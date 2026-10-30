import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Chevron, Rise, Words } from "../components";
import { C, display, easeInOut, easeOut, moodColor, sans, useWide } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
// A believable month: dips, recoveries, a bright run.
const MOODS = [62, 48, 30, 22, 40, 58, 71, 80, 66, 52, 35, 18, 26, 44, 60, 75, 88, 92, 70, 55, 41, 63, 79, 85, 72, 58, 66, 74];
const FIRST = 3; // 1 October 2026 is a Thursday
const CELL = 122;
const ROW = 124;

/** The calendar: a month of pages fills with mood colour in one diagonal wave. */
export const Month: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 34], [0, 1], { ...clamp, easing: easeOut });
  const wide = useWide();

  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <Words
        text="Watch your month take colour."
        at={0}
        gap={3}
        style={{
          position: "absolute",
          top: wide ? 280 : 170,
          left: wide ? 150 : undefined,
          width: wide ? 640 : 860,
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
          top: wide ? 75 : 560,
          left: wide ? 840 : undefined,
          width: 960,
          padding: "50px 53px 46px",
          boxSizing: "border-box",
          borderRadius: 56,
          backgroundColor: C.surface,
          boxShadow: `0 50px 110px ${C.shadow}cc, inset 0 0 0 2px #1c3133`,
          opacity: enter,
          transform: `perspective(1800px) translateY(${(1 - enter) * 160}px) rotateX(${(1 - enter) * 26}deg) scale(${interpolate(frame, [0, 150], [0.98, 1.02], { easing: easeInOut })})`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px", height: 80 }}>
          <Chevron dir="left" size={52} color={C.text} />
          <div style={{ fontFamily: display, fontSize: 52, color: C.text }}>October 2026</div>
          <Chevron dir="right" size={52} color={C.text} />
        </div>
        <div style={{ display: "flex", margin: "26px 0 10px" }}>
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <div key={i} style={{ width: CELL, textAlign: "center", fontFamily: sans, fontSize: 30, fontWeight: 600, color: C.quiet }}>
              {d}
            </div>
          ))}
        </div>
        <div style={{ position: "relative", height: ROW * 5 }}>
          {Array.from({ length: 31 }, (_, i) => {
            const day = i + 1;
            const slot = FIRST + i;
            const col = slot % 7;
            const row = Math.floor(slot / 7);
            const mood = MOODS[i];
            const start = 26 + (col + row * 1.6) * 3.2;
            const p = mood === undefined ? 0 : interpolate(frame, [start, start + 18], [0, 1], { ...clamp, easing: easeOut });
            const today = day === 28;
            return (
              <div key={day} style={{ position: "absolute", left: col * CELL, top: row * ROW, width: CELL, height: ROW, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {mood !== undefined && (
                  <div
                    style={{
                      position: "absolute",
                      width: 96,
                      height: 96,
                      borderRadius: "50%",
                      backgroundColor: moodColor(mood),
                      scale: String(p),
                      boxShadow: `0 0 ${p * 34}px color-mix(in srgb, ${moodColor(mood)} 45%, transparent)`,
                    }}
                  />
                )}
                {today && (
                  <div
                    style={{
                      position: "absolute",
                      width: 116,
                      height: 116,
                      borderRadius: "50%",
                      border: `6px solid ${C.text}`,
                      boxSizing: "border-box",
                      opacity: interpolate(frame, [104, 116], [0, 1], clamp),
                      scale: String(interpolate(frame, [104, 122], [1.4, 1], { ...clamp, easing: easeOut })),
                    }}
                  />
                )}
                <div
                  style={{
                    position: "relative",
                    fontFamily: sans,
                    fontSize: 34,
                    fontWeight: p > 0.5 ? 700 : 500,
                    color: mood === undefined ? "#45585a" : p > 0.5 ? C.bg : C.text,
                  }}
                >
                  {day}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 16, fontFamily: sans, fontSize: 30, color: C.muted }}>
          Heavy
          <div style={{ width: 170, height: 16, borderRadius: 999, background: `linear-gradient(in oklch to right, ${C.violet}, ${C.amber})` }} />
          Bright
        </div>
      </div>

      <Rise
        at={96}
        style={{
          position: "absolute",
          top: wide ? 680 : 1590,
          left: wide ? 150 : undefined,
          width: wide ? 600 : 860,
          textAlign: wide ? "left" : "center", fontFamily: sans, fontSize: 46, lineHeight: 1.4, color: C.muted }}>
        Every page keeps the colour of its day.
      </Rise>
    </AbsoluteFill>
  );
};
