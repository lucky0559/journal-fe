import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, easeOut } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** The shared night backdrop: deep spruce ink, a slow lamp glow, a cooler tide glow and a little paper grain. */
export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          width: 1500,
          height: 1500,
          borderRadius: "50%",
          left: -520 + Math.sin(frame / 90) * 120,
          top: -560 + Math.cos(frame / 110) * 90,
          background: `radial-gradient(circle, ${C.accent}38 0%, ${C.accent}10 38%, transparent 68%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1400,
          height: 1400,
          borderRadius: "50%",
          right: -620 + Math.cos(frame / 100) * 110,
          bottom: -520 + Math.sin(frame / 80) * 100,
          background: `radial-gradient(circle, ${C.teal}2a 0%, ${C.teal}0c 40%, transparent 68%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1100,
          height: 1100,
          borderRadius: "50%",
          left: -300 + Math.sin(frame / 130) * 80,
          bottom: -380,
          background: `radial-gradient(circle, ${C.violet}22 0%, transparent 65%)`,
        }}
      />
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.09, mixBlendMode: "overlay" }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 55%, #01070899 100%)" }} />
    </AbsoluteFill>
  );
};

/** Fades and lifts its children into place, sharpening out of a soft blur. */
export const Rise: React.FC<{
  at: number;
  children: React.ReactNode;
  distance?: number;
  duration?: number;
  blur?: number;
  style?: React.CSSProperties;
}> = ({ at, children, distance = 70, duration = 26, blur = 14, style }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + duration], [0, 1], { ...clamp, easing: easeOut });
  return (
    <div
      style={{
        ...style,
        opacity: interpolate(p, [0, 0.6], [0, 1], clamp),
        translate: `0px ${(1 - p) * distance}px`,
        filter: blur ? `blur(${(1 - p) * blur}px)` : undefined,
      }}
    >
      {children}
    </div>
  );
};

/** A headline whose words rise one after another. */
export const Words: React.FC<{ text: string; at: number; gap?: number; style?: React.CSSProperties }> = ({
  text,
  at,
  gap = 4,
  style,
}) => (
  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: "0.26em", ...style }}>
    {text.split(" ").map((w, i) => (
      <Rise key={i} at={at + i * gap} distance={60}>
        {w}
      </Rise>
    ))}
  </div>
);

/**
 * The app's three brand shapes (dusk violet circle, tide teal blob, lamp amber dot), in the same 340 x 262 box the
 * icon is drawn from. Each shape grows in on its own beat and then floats.
 */
export const BrandShapes: React.FC<{ scale: number; at: number; float?: number; style?: React.CSSProperties }> = ({
  scale,
  at,
  float = 1,
  style,
}) => {
  const frame = useCurrentFrame();
  const grow = (delay: number) =>
    interpolate(frame, [at + delay, at + delay + 30], [0, 1], { ...clamp, easing: easeOut });
  const bob = (phase: number, amp: number) =>
    `${Math.sin((frame + phase) / 26) * amp * float}px ${Math.cos((frame + phase) / 31) * amp * float}px`;
  const shape = (delay: number): React.CSSProperties => ({
    position: "absolute",
    scale: String(grow(delay)),
    opacity: interpolate(grow(delay), [0, 0.3], [0, 1], clamp),
  });
  return (
    <div style={{ position: "relative", width: 340 * scale, height: 262 * scale, ...style }}>
      <div
        style={{
          ...shape(0),
          left: 0,
          top: 30 * scale,
          width: 190 * scale,
          height: 190 * scale,
          borderRadius: "50%",
          backgroundColor: C.violet,
          translate: bob(0, 10),
        }}
      />
      <div
        style={{
          ...shape(7),
          left: 184 * scale,
          top: 0,
          width: 150 * scale,
          height: 150 * scale,
          borderRadius: "58% 42% 38% 62% / 64% 46% 54% 36%",
          backgroundColor: "#449786",
          translate: bob(40, 12),
          rotate: `${Math.sin(frame / 40) * 6 * float}deg`,
        }}
      />
      <div
        style={{
          ...shape(14),
          left: 150 * scale,
          top: 170 * scale,
          width: 92 * scale,
          height: 92 * scale,
          borderRadius: "50%",
          backgroundColor: C.accent,
          translate: bob(80, 14),
        }}
      />
    </div>
  );
};

/**
 * A phone whose screen is laid out in the real device's 1080 x 2400 pixels and scaled to `width`, so app layouts
 * can be copied straight from screenshots.
 */
export const Phone: React.FC<{ width: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  width,
  children,
  style,
}) => {
  const bezel = 18;
  const inner = width - bezel * 2;
  const s = inner / 1080;
  return (
    <div
      style={{
        position: "absolute",
        width,
        height: inner * (2400 / 1080) + bezel * 2,
        borderRadius: 96,
        backgroundColor: "#03100f",
        padding: bezel,
        boxShadow: `0 60px 120px ${C.shadow}cc, 0 0 0 2px #1f3335, inset 0 0 0 2px #0f2224`,
        ...style,
      }}
    >
      <div style={{ width: inner, height: inner * (2400 / 1080), borderRadius: 80, overflow: "hidden", position: "relative", backgroundColor: C.bg }}>
        <div style={{ width: 1080, height: 2400, scale: String(s), transformOrigin: "0 0", position: "absolute", left: 0, top: 0 }}>
          <StatusBar />
          {children}
        </div>
      </div>
    </div>
  );
};

const StatusBar: React.FC = () => (
  <div
    style={{
      position: "absolute",
      top: 30,
      left: 56,
      right: 56,
      height: 44,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      color: C.text,
      fontSize: 34,
      fontWeight: 600,
    }}
  >
    <span>9:41</span>
    <div style={{ display: "flex", gap: 14, alignItems: "flex-end" }}>
      {[12, 18, 24, 30].map((h) => (
        <div key={h} style={{ width: 7, height: h, borderRadius: 2, backgroundColor: C.text }} />
      ))}
      <div style={{ width: 54, height: 26, borderRadius: 7, border: `3px solid ${C.text}`, marginLeft: 10, padding: 3 }}>
        <div style={{ width: "72%", height: "100%", borderRadius: 3, backgroundColor: C.text }} />
      </div>
    </div>
  </div>
);

/** A tap: a soft ring that blooms and fades where a finger lands. */
export const Tap: React.FC<{ at: number; x: number; y: number; size?: number }> = ({ at, x, y, size = 200 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 18], [0, 1], { ...clamp, easing: easeOut });
  if (frame < at || p >= 1) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: `${C.text}33`,
        border: `4px solid ${C.text}88`,
        scale: String(0.3 + p * 0.9),
        opacity: 1 - p,
      }}
    />
  );
};

type IconProps = { size: number; color: string; stroke?: number };
const Svg: React.FC<IconProps & { children: React.ReactNode }> = ({ size, color, stroke = 2, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
export const Lock: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <rect x="4" y="11" width="16" height="10" rx="2.5" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Svg>
);
export const People: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5" />
    <path d="M15.5 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c1.9.8 3.1 2.6 3.5 5.2" />
  </Svg>
);
export const Globe: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
  </Svg>
);
export const Close: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);
export const Play: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M8 5.5v13l10-6.5z" />
  </Svg>
);
export const ImageIcon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="9" cy="9" r="2" />
    <path d="M21 15l-5-5L5 21" />
  </Svg>
);
export const Mic: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </Svg>
);
export const Smile: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 14.5a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01" />
  </Svg>
);
export const Chevron: React.FC<IconProps & { dir: "left" | "right" }> = ({ dir, ...p }) => (
  <Svg {...p}>
    <path d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
  </Svg>
);
