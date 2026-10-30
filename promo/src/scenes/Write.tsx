import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Close, ImageIcon, Lock, Mic, Phone, Play, Rise, Smile, Tap } from "../components";
import { C, display, easeOut, moodColor, sans, useWide } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const TEXT = "Long walk home. The sky did that pink thing again, and for a minute everything slowed down.";
const WAVE = [26, 44, 62, 38, 70, 52, 30, 58, 76, 46, 34, 64, 50, 28, 56, 72, 40, 60, 36, 24];
const PHOTO_AT = 92;
const VOICE_AT = 124;

/** Writing a page: words type themselves, a photo drops onto the page, a voice note slides in. */
export const Write: React.FC = () => {
  const frame = useCurrentFrame();
  const typed = Math.round(interpolate(frame, [18, 80], [0, TEXT.length], clamp));
  const drop = interpolate(frame, [PHOTO_AT, PHOTO_AT + 28], [0, 1], { ...clamp, easing: easeOut });
  const playing = interpolate(frame, [VOICE_AT + 22, 180], [0, 1], clamp);
  const wide = useWide();

  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div
        style={{
          position: "absolute",
          top: wide ? 300 : 116,
          left: wide ? 150 : 120,
          fontFamily: display,
          fontSize: wide ? 112 : 84,
          lineHeight: 1.1,
          color: C.text,
          letterSpacing: "-0.015em",
        }}
      >
        <Rise at={0}>A few words.</Rise>
        <div style={{ display: "flex", flexDirection: wide ? "column" : "row", columnGap: 26 }}>
          <Rise at={PHOTO_AT}>A photo.</Rise>
          <Rise at={VOICE_AT}>Your voice.</Rise>
        </div>
      </div>

      <Phone
        width={wide ? 600 : 820}
        style={{
          left: wide ? 1170 : 130,
          top: wide
            ? interpolate(frame, [0, 34], [190, 40], { ...clamp, easing: easeOut })
            : interpolate(frame, [0, 34], [560, 400], { ...clamp, easing: easeOut }),
          opacity: interpolate(frame, [0, 16], [0, 1], clamp),
        }}
      >
        {/* header */}
        <div style={{ position: "absolute", top: 118, left: 52 }}>
          <Close size={64} color={C.text} stroke={2.4} />
        </div>
        <div style={{ position: "absolute", top: 128, width: 1080, textAlign: "center", fontFamily: sans, fontSize: 32, color: C.muted }}>
          Wed, 28 Oct · 9:41 pm
        </div>
        <div style={{ position: "absolute", top: 104, right: 34, padding: "22px 48px", borderRadius: 999, backgroundColor: C.accent, fontFamily: display, fontSize: 34, color: C.bg }}>
          Save
        </div>

        {/* mood row */}
        <div style={{ position: "absolute", top: 232, left: 48, width: 96, height: 96, borderRadius: "50%", backgroundColor: moodColor(72) }} />
        <div style={{ position: "absolute", top: 248, left: 176, fontFamily: display, fontSize: 44, color: C.text }}>Good</div>
        <div style={{ position: "absolute", top: 272, left: 360, width: 670, height: 16, borderRadius: 999, background: `linear-gradient(in oklch to right, ${C.violet}, ${C.amber})` }}>
          <div style={{ position: "absolute", top: -22, left: "62%", width: 60, height: 60, borderRadius: "50%", backgroundColor: "#efe7d6", border: `6px solid ${moodColor(72)}`, boxSizing: "border-box" }} />
        </div>

        {/* visibility */}
        <div style={{ position: "absolute", top: 368, left: 48, display: "flex", alignItems: "center", gap: 16, padding: "20px 34px", borderRadius: 999, border: `3px solid ${C.line}`, fontFamily: sans, fontSize: 30, fontWeight: 500, color: C.text }}>
          <Lock size={36} color={C.text} />
          Only me
        </div>

        {/* the words */}
        <div style={{ position: "absolute", top: 500, left: 48, width: 980, fontFamily: sans, fontSize: 48, lineHeight: 1.55, color: C.text }}>
          {TEXT.slice(0, typed)}
          <span
            style={{
              display: "inline-block",
              width: 5,
              height: 56,
              marginLeft: 4,
              verticalAlign: "-10px",
              backgroundColor: C.accent,
              opacity: frame > 84 && frame < PHOTO_AT ? 0 : Math.floor(frame / 8) % 2 ? 1 : 0.15,
            }}
          />
        </div>

        {/* the photo */}
        <div
          style={{
            position: "absolute",
            top: 860,
            left: 110,
            width: 600,
            padding: "26px 26px 100px",
            backgroundColor: C.paper,
            borderRadius: 16,
            boxShadow: `0 ${30 + (1 - drop) * 60}px ${70 + (1 - drop) * 60}px ${C.shadow}cc`,
            translate: `${(1 - drop) * 120}px ${(1 - drop) * -1100}px`,
            rotate: `${-3 - (1 - drop) * 16}deg`,
            scale: String(1 + (1 - drop) * 0.15),
            opacity: frame >= PHOTO_AT ? 1 : 0,
          }}
        >
          <div style={{ position: "relative", height: 440, borderRadius: 6, overflow: "hidden", background: "linear-gradient(180deg, #2b2a5c 0%, #7a77ba 32%, #e58a9a 60%, #f8ac3d 84%)" }}>
            <div style={{ position: "absolute", left: 330, top: 230, width: 130, height: 130, borderRadius: "50%", backgroundColor: "#ffd9a0", boxShadow: "0 0 90px 30px #ffc27a88" }} />
            <div style={{ position: "absolute", left: -120, top: 300, width: 520, height: 300, borderRadius: "50%", backgroundColor: "#1d4d44" }} />
            <div style={{ position: "absolute", left: 220, top: 330, width: 560, height: 300, borderRadius: "50%", backgroundColor: "#0f2c2a" }} />
          </div>
          <div style={{ position: "absolute", bottom: 28, left: 34, fontFamily: display, fontSize: 36, color: "#2e2b25" }}>the long way home</div>
        </div>

        {/* the voice note */}
        <div
          style={{
            position: "absolute",
            top: 1470,
            left: 48,
            display: "flex",
            alignItems: "center",
            gap: 26,
            padding: "16px 40px 16px 16px",
            borderRadius: 999,
            backgroundColor: C.accentPanel,
            opacity: interpolate(frame, [VOICE_AT, VOICE_AT + 12], [0, 1], clamp),
            translate: `0px ${interpolate(frame, [VOICE_AT, VOICE_AT + 26], [80, 0], { ...clamp, easing: easeOut })}px`,
          }}
        >
          <div style={{ width: 96, height: 96, borderRadius: "50%", backgroundColor: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Play size={48} color={C.bg} stroke={2.6} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, height: 80 }}>
            {WAVE.map((h, i) => (
              <div
                key={i}
                style={{
                  width: 9,
                  borderRadius: 9,
                  height: h * (1 - playing * 0.35 + playing * 0.35 * Math.abs(Math.sin(frame / 4 + i * 0.9))),
                  backgroundColor: i / WAVE.length < playing ? C.amber : "#9d6810",
                }}
              />
            ))}
          </div>
          <div style={{ fontFamily: sans, fontSize: 34, fontWeight: 600, color: C.accentInk }}>0:13</div>
        </div>

        {/* toolbar */}
        <div style={{ position: "absolute", top: 1800, left: 34, right: 34, display: "flex", gap: 20 }}>
          {[
            { label: "Photo", Icon: ImageIcon },
            { label: "Voice", Icon: Mic },
            { label: "Sticker", Icon: Smile },
          ].map(({ label, Icon }) => (
            <div key={label} style={{ flex: 1, height: 110, borderRadius: 999, backgroundColor: C.raised, display: "flex", alignItems: "center", justifyContent: "center", gap: 18, fontFamily: sans, fontSize: 32, fontWeight: 500, color: C.text }}>
              <Icon size={44} color={C.text} />
              {label}
            </div>
          ))}
        </div>
        <Tap at={PHOTO_AT - 8} x={190} y={1855} />
        <Tap at={VOICE_AT - 8} x={540} y={1855} />
      </Phone>
    </AbsoluteFill>
  );
};
