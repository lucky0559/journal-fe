import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { blinkAt, Lumi, Moon, Rise, Sparkle, Words } from "../components";
import { C, display, easeInOut, easeOut, sans, useWide } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const HOPS = [34, 64]; // frames where a hop takes off; each lasts 30 frames and lands with a squash

/** Opening (v2): Lumi pops up under the moon, hops twice with a sparkle circling, then the promise. */
export const HookLumi: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wide = useWide();

  const pop = spring({ frame: frame - 4, fps, config: { damping: 11, stiffness: 120 } });
  let lift = 0;
  let squash = 1;
  for (const at of HOPS) {
    const t = (frame - at) / 30;
    if (t >= 0 && t < 1) lift = Math.sin(t * Math.PI) * 120; // airborne
    // crouch before take-off, stretch in the air, squash on landing
    squash *= interpolate(frame, [at - 6, at, at + 6, at + 26, at + 30, at + 36], [1, 0.86, 1.08, 1, 0.84, 1], clamp);
  }
  // the pop-in's own landing squash
  squash *= interpolate(frame, [4, 12, 20], [1, 0.9, 1], clamp);

  const size = wide ? 270 : 420;
  const cx = wide ? 960 : 540;
  const baseY = wide ? 420 : 840; // Lumi's feet
  const orbit = (frame / 40) * Math.PI * 2;
  const glow = interpolate(frame, [0, 30], [0, 1], { ...clamp, easing: easeOut });

  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      {/* lamp glow under Lumi */}
      <div
        style={{
          position: "absolute",
          left: cx - 500,
          top: baseY - 640,
          width: 1000,
          height: 1000,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.accent}30 0%, ${C.accent}0c 42%, transparent 68%)`,
          opacity: glow,
          scale: String(0.92 + Math.sin(frame / 24) * 0.04),
        }}
      />

      <Moon
        size={wide ? 120 : 170}
        style={{
          position: "absolute",
          left: cx + size * 0.55,
          top: baseY - size * 1.2 + Math.sin(frame / 30) * 8,
          opacity: interpolate(frame, [10, 34], [0, 1], clamp),
          rotate: `${interpolate(frame, [10, 40], [-30, -12], { ...clamp, easing: easeOut })}deg`,
        }}
      />
      {[
        [-0.95, -1.4, 34, 16],
        [-1.15, -0.5, 26, 24],
        [0.95, -0.2, 22, 30],
      ].map(([dx, dy, s, at], i) => (
        <Sparkle
          key={i}
          size={s * (wide ? 1.2 : 1.6)}
          style={{
            position: "absolute",
            left: cx + dx * size,
            top: baseY + dy * size,
            opacity: interpolate(frame, [at, at + 12], [0, 1], clamp) * (0.55 + 0.45 * Math.sin(frame / 9 + i * 2)),
            scale: String(0.8 + 0.2 * Math.sin(frame / 11 + i)),
          }}
        />
      ))}

      {/* soft shadow that shrinks while Lumi is in the air */}
      <div
        style={{
          position: "absolute",
          left: cx - size * 0.38,
          top: baseY - size * 0.05,
          width: size * 0.76,
          height: size * 0.12,
          borderRadius: "50%",
          backgroundColor: C.shadow,
          opacity: 0.55 * pop,
          scale: String(1 - lift / 300),
          filter: "blur(10px)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: cx - size / 2,
          top: baseY - size * 0.92 - lift,
          scale: String(pop),
          transformOrigin: "50% 100%",
        }}
      >
        <Lumi size={size} squash={squash} blink={blinkAt(frame, [50, 118])} />
        {/* the loading spinner's sparkle, circling Lumi */}
        <Sparkle
          size={size * 0.13}
          style={{
            position: "absolute",
            left: size / 2 + Math.cos(orbit) * size * 0.68 - size * 0.065,
            top: size * 0.86 + Math.sin(orbit) * size * 0.1 - size * 0.065,
            zIndex: Math.sin(orbit) > 0 ? 2 : -1,
            opacity: interpolate(frame, [20, 32], [0, 1], clamp),
            rotate: `${frame * 3}deg`,
          }}
        />
      </div>

      <Rise
        at={16}
        style={{
          position: "absolute",
          top: wide ? 470 : 940,
          fontFamily: sans,
          fontSize: wide ? 40 : 46,
          fontWeight: 700,
          letterSpacing: "0.18em",
          color: C.accent,
        }}
      >
        MEET LUMI
      </Rise>
      <Words
        text="Put the day down."
        at={46}
        style={{
          position: "absolute",
          top: wide ? 550 : 1050,
          width: wide ? 1500 : 920,
          fontFamily: display,
          fontSize: 132,
          lineHeight: 1.05,
          letterSpacing: "-0.015em",
          color: C.text,
          scale: String(interpolate(frame, [46, 144], [1, 1.03], { ...clamp, easing: easeInOut })),
        }}
      />
      <Rise at={72} style={{ position: "absolute", top: wide ? 760 : 1400, fontFamily: sans, fontSize: 50, color: C.muted }}>
        A quiet journal for the end of the day.
      </Rise>
    </AbsoluteFill>
  );
};
