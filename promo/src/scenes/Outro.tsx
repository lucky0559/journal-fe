import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { blinkAt, BrandShapes, Lumi, Rise } from "../components";
import { C, display, easeOut, sans, useWide } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const LUMI_AT = 44;

/** Close: the shapes settle into the app icon, then the name and one gentle line. With `lumi`, Lumi hops onto the icon. */
export const Outro: React.FC<{ lumi?: boolean }> = ({ lumi = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const hop = spring({ frame: frame - LUMI_AT, fps, config: { damping: 12, stiffness: 110 } });
  const land = interpolate(frame, [LUMI_AT + 14, LUMI_AT + 19, LUMI_AT + 28], [1, 0.84, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const icon = interpolate(frame, [0, 30], [0, 1], { ...clamp, easing: easeOut });
  const wide = useWide();
  const k = wide ? 0.72 : 1; // the icon is smaller in 16:9 so the stack fits the shorter frame

  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div
        style={{
          position: "absolute",
          top: wide ? -270 : 260,
          width: 1000,
          height: 1000,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.accent}33 0%, ${C.accent}0d 40%, transparent 66%)`,
          opacity: icon,
          scale: String(0.9 + Math.sin(frame / 22) * 0.04),
        }}
      />
      <div
        style={{
          position: "absolute",
          top: wide ? 30 : 520,
          width: 440,
          height: 440,
          borderRadius: 104,
          backgroundColor: C.bg,
          boxShadow: `0 50px 120px ${C.shadow}, inset 0 0 0 3px #1f3335`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: icon,
          scale: String((0.7 + icon * 0.3) * k),
          rotate: `${(1 - icon) * -8}deg`,
        }}
      >
        <BrandShapes scale={0.98} at={8} float={0.4} />
        {lumi && frame >= LUMI_AT ? (
          <div
            style={{
              position: "absolute",
              // beside the icon in 16:9 (there is no room above it), perched on its corner in the vertical cut
              right: wide ? -190 : -70,
              top: (wide ? 200 : -150) + (1 - hop) * -220 + Math.sin(Math.min(1, hop) * Math.PI) * -40,
              opacity: interpolate(hop, [0, 0.3], [0, 1]),
              rotate: `${12 - hop * 4}deg`,
            }}
          >
            <Lumi size={180} squash={land} blink={blinkAt(frame, [LUMI_AT + 52, LUMI_AT + 96])} />
          </div>
        ) : null}
      </div>

      <Rise at={26} style={{ position: "absolute", top: wide ? 430 : 1030, fontFamily: display, fontSize: 168, color: C.text, letterSpacing: "-0.02em" }}>
        Journ<span style={{ color: C.accent }}>.</span>al
      </Rise>
      <Rise at={40} style={{ position: "absolute", top: wide ? 650 : 1255, fontFamily: sans, fontSize: 52, color: C.muted }}>
        Write a few honest lines tonight.
      </Rise>
      <Rise at={56} style={{ position: "absolute", top: wide ? 790 : 1420 }}>
        <div style={{ padding: "30px 72px", borderRadius: 999, backgroundColor: C.accent, fontFamily: display, fontSize: 50, color: C.bg, boxShadow: `0 20px 60px ${C.accent}44` }}>
          For Android
        </div>
      </Rise>
    </AbsoluteFill>
  );
};
