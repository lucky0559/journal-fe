import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Globe, Lock, People, Play, Rise, Tap, Words } from "../components";
import { C, display, easeOut, moodColor, moodRadius, sans, useWide } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const SHARE_AT = 70;
const SEG = 262;

/** Privacy: a page starts as Only me; sharing it with friends is one deliberate move. */
export const Private: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 30], [0, 1], { ...clamp, easing: easeOut });
  const share = interpolate(frame, [SHARE_AT, SHARE_AT + 20], [0, 1], { ...clamp, easing: easeOut });
  const wide = useWide();

  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <Words
        text="Private by default."
        at={0}
        gap={3}
        style={{
          position: "absolute",
          top: wide ? 240 : 200,
          left: wide ? 150 : undefined,
          width: wide ? 640 : 900,
          justifyContent: wide ? "flex-start" : "center",
          fontFamily: display,
          fontSize: 104,
          lineHeight: 1.08,
          color: C.text,
          letterSpacing: "-0.015em",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: wide ? 145 : 470,
          left: wide ? 900 : undefined,
          width: 940,
          height: 790,
          borderRadius: 44,
          backgroundColor: "#1a2e30",
          boxShadow: `0 50px 110px ${C.shadow}cc, inset 0 0 0 2px #2a3e40`,
          opacity: enter,
          translate: `0px ${(1 - enter) * 120}px`,
          scale: String(0.94 + enter * 0.06),
        }}
      >
        <div style={{ position: "absolute", left: 82, top: 0, bottom: 0, width: 3, backgroundColor: "#5d3d0e" }} />
        <div style={{ position: "absolute", left: 130, top: 70 }}>
          <div style={{ fontFamily: sans, fontSize: 30, fontWeight: 700, letterSpacing: "0.16em", color: C.accent }}>WEDNESDAY</div>
          <div style={{ fontFamily: display, fontSize: 92, color: C.text, lineHeight: 1.15 }}>28 October</div>
          <div style={{ fontFamily: sans, fontSize: 32, color: C.muted }}>2026 · 9:41 pm</div>

          <div style={{ display: "flex", alignItems: "center", gap: 28, marginTop: 52 }}>
            <div style={{ width: 96, height: 96, backgroundColor: moodColor(72), borderRadius: moodRadius(72), rotate: "5deg" }} />
            <div>
              <div style={{ fontFamily: display, fontSize: 44, color: C.text }}>Good</div>
              <div style={{ fontFamily: sans, fontSize: 30, color: C.muted }}>Nice. Hold onto it</div>
            </div>
          </div>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 22, marginTop: 44, padding: "14px 36px 14px 14px", borderRadius: 999, backgroundColor: C.accentPanel }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", backgroundColor: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Play size={40} color={C.bg} stroke={2.6} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {[22, 40, 58, 34, 64, 46, 28, 52, 68, 40, 30, 56].map((h, i) => (
                <div key={i} style={{ width: 8, height: h, borderRadius: 8, backgroundColor: "#c48218" }} />
              ))}
            </div>
            <div style={{ fontFamily: sans, fontSize: 30, fontWeight: 600, color: C.accentInk }}>0:13</div>
          </div>
        </div>

        {/* who can see this page */}
        <div style={{ position: "absolute", left: 80, bottom: 70, width: SEG * 3 + 16, height: 112, borderRadius: 999, backgroundColor: C.bg, boxShadow: `inset 0 0 0 3px ${C.line}` }}>
          <div
            style={{
              position: "absolute",
              top: 8,
              left: 8 + share * SEG,
              width: SEG,
              height: 96,
              borderRadius: 999,
              backgroundColor: `color-mix(in oklch, ${C.teal} ${share * 100}%, #3a4f51)`,
              scale: String(1 + Math.sin(share * Math.PI) * 0.06),
            }}
          />
          {[
            { label: "Only me", Icon: Lock },
            { label: "Friends", Icon: People },
            { label: "Public", Icon: Globe },
          ].map(({ label, Icon }, i) => {
            const on = i === 0 ? 1 - share : i === 1 ? share : 0;
            const ink = on > 0.5 && i === 1 ? C.card : C.text;
            return (
              <div
                key={label}
                style={{
                  position: "absolute",
                  top: 8,
                  left: 8 + i * SEG,
                  width: SEG,
                  height: 96,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 14,
                  fontFamily: sans,
                  fontSize: 32,
                  fontWeight: 600,
                  color: ink,
                  opacity: 0.6 + on * 0.4,
                }}
              >
                <Icon size={38} color={ink} stroke={2.2} />
                {label}
              </div>
            );
          })}
          <Tap at={SHARE_AT - 6} x={8 + SEG * 1.5} y={56} size={180} />
        </div>
      </div>

      <Rise
        at={SHARE_AT + 12}
        style={{
          position: "absolute",
          top: wide ? 520 : 1360,
          left: wide ? 150 : undefined,
          width: wide ? 620 : 900,
          textAlign: wide ? "left" : "center",
          fontFamily: sans,
          fontSize: 48,
          lineHeight: 1.4,
          color: C.text,
        }}
      >
        Share a page with friends only when you choose to.
      </Rise>
      <Rise at={SHARE_AT + 30} style={{ position: "absolute", top: wide ? 760 : 1560, left: wide ? 150 : undefined, display: "flex", alignItems: "center", gap: 18, fontFamily: sans, fontSize: wide ? 38 : 42, fontWeight: 500, color: C.teal }}>
        <Lock size={44} color={C.teal} stroke={2.2} />
        Your mood and feelings stay yours.
      </Rise>
    </AbsoluteFill>
  );
};
