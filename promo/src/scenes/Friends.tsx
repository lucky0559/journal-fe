import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Bell, Heart, Lock, People, Rise, Tap, Words } from "../components";
import { C, display, easeOut, sans, useWide } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const SHARE_AT = 56; // "...until you share it"
export const HUGS = [112, 124, 136]; // "...friends can send a hug back"
export const SAME_AT = 148;
export const TOAST_AT = 120;

/** Friends: a private page is shared with friends in one tap; hugs come back, and the bell says who sent them. */
export const Friends: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wide = useWide();
  const enter = interpolate(frame, [0, 30], [0, 1], { ...clamp, easing: easeOut });
  const share = interpolate(frame, [SHARE_AT, SHARE_AT + 16], [0, 1], { ...clamp, easing: easeOut });
  const hugs = HUGS.filter((h) => frame >= h).length;
  const same = frame >= SAME_AT ? 1 : 0;
  const toast = spring({ frame: frame - TOAST_AT, fps, config: { damping: 14, stiffness: 140 } });
  const bump = (at: number) => interpolate(frame, [at, at + 5, at + 14], [1, 1.12, 1], clamp);

  const cardLeft = wide ? 900 : 70;
  const cardTop = wide ? 150 : 500;

  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <Words
        text="Private, until you share."
        at={0}
        gap={3}
        style={{
          position: "absolute",
          top: wide ? 150 : 200,
          left: wide ? 150 : undefined,
          width: wide ? 660 : 900,
          justifyContent: wide ? "flex-start" : "center",
          fontFamily: display,
          fontSize: 104,
          lineHeight: 1.08,
          color: C.text,
          letterSpacing: "-0.015em",
        }}
      />

      {/* your page, as friends see it in their feed */}
      <div
        style={{
          position: "absolute",
          top: cardTop,
          left: cardLeft,
          width: 940,
          padding: "56px 60px 60px",
          borderRadius: 52,
          backgroundColor: "#1a2e30",
          boxShadow: `0 50px 110px ${C.shadow}cc, inset 0 0 0 2px #2a3e40`,
          opacity: enter,
          translate: `0px ${(1 - enter) * 120}px`,
          scale: String(0.94 + enter * 0.06),
          display: "flex",
          flexDirection: "column",
          gap: 34,
        }}
      >
        {/* author row */}
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <div style={{ width: 104, height: 104, borderRadius: "50%", backgroundColor: C.violet, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: display, fontSize: 48, color: C.text }}>
            A
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: sans, fontSize: 40, fontWeight: 700, color: C.text }}>Ana</div>
            <div style={{ fontFamily: sans, fontSize: 30, color: C.muted }}>Tonight · 9:41 pm</div>
          </div>
          {/* who can see it: Only me, then Friends */}
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "16px 30px",
              borderRadius: 999,
              backgroundColor: `color-mix(in oklch, ${C.tealPanel} ${share * 100}%, ${C.raised})`,
              color: share > 0.5 ? C.tealInk : C.text,
              fontFamily: sans,
              fontSize: 30,
              fontWeight: 700,
              scale: String(1 + Math.sin(share * Math.PI) * 0.1),
            }}
          >
            {share > 0.5 ? <People size={36} color={C.tealInk} stroke={2.4} /> : <Lock size={36} color={C.text} stroke={2.4} />}
            {share > 0.5 ? "Friends" : "Only me"}
            <Tap at={SHARE_AT - 6} x={110} y={36} size={170} />
          </div>
        </div>

        {/* no mood here: friends never see it */}
        <div style={{ fontFamily: display, fontSize: 40, color: C.accent }}>What made you smile today?</div>
        <div style={{ fontFamily: sans, fontSize: 44, lineHeight: 1.5, color: C.text }}>
          Long walk home. The sky did that pink thing again, and for a minute everything slowed down.
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {["01", "07"].map((id) => (
            <Img key={id} src={staticFile(`stickers/sticker-${id}.webp`)} style={{ height: 130 }} />
          ))}
        </div>

        {/* reactions */}
        <div style={{ position: "relative", display: "flex", gap: 20 }}>
          {[
            { label: "Sending a hug", n: hugs, at: HUGS[hugs - 1] ?? 9999 },
            { label: "Same", n: same, at: SAME_AT },
          ].map(({ label, n, at }) => (
            <div
              key={label}
              style={{
                padding: "20px 34px",
                borderRadius: 999,
                border: `3px solid ${n ? C.accent : C.line}`,
                backgroundColor: n ? C.accentPanel : "transparent",
                fontFamily: sans,
                fontSize: 32,
                fontWeight: 600,
                color: n ? C.accentInk : C.muted,
                scale: String(bump(at)),
              }}
            >
              {label} · {n}
            </div>
          ))}
          {/* hearts floating up from each hug */}
          {HUGS.map((at, i) => {
            const t = interpolate(frame, [at, at + 40], [0, 1], clamp);
            if (t <= 0 || t >= 1) return null;
            return (
              <div
                key={at}
                style={{
                  position: "absolute",
                  left: 120 + i * 70 + Math.sin(t * 6 + i) * 24,
                  top: -20 - t * 220,
                  opacity: interpolate(t, [0, 0.15, 0.7, 1], [0, 1, 1, 0]),
                  scale: String(0.6 + t * 0.7),
                }}
              >
                <Heart size={54} color={i === 1 ? "#f69186" : C.amber} />
              </div>
            );
          })}
        </div>
      </div>

      {/* the notification */}
      <div
        style={{
          position: "absolute",
          top: wide ? 600 : 1390,
          left: wide ? 150 : 70,
          width: wide ? 640 : 940,
          display: "flex",
          alignItems: "center",
          gap: 26,
          padding: "26px 34px",
          borderRadius: 40,
          backgroundColor: C.raised,
          boxShadow: `0 30px 80px ${C.shadow}cc`,
          opacity: interpolate(toast, [0, 0.4], [0, 1], clamp),
          translate: `0px ${(1 - toast) * 80}px`,
        }}
      >
        <div style={{ position: "relative", width: 88, height: 88, borderRadius: "50%", backgroundColor: C.accentPanel, display: "flex", alignItems: "center", justifyContent: "center", rotate: `${Math.sin((frame - TOAST_AT) / 2.2) * 14 * Math.max(0, 1 - (frame - TOAST_AT) / 26)}deg` }}>
          <Bell size={46} color={C.accent} stroke={2.3} />
          <div style={{ position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: "50%", backgroundColor: "#f69186", boxShadow: `0 0 0 4px ${C.raised}` }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: sans, fontSize: wide ? 32 : 36, fontWeight: 600, color: C.text }}>Maya sent a hug to your page</div>
          <div style={{ fontFamily: sans, fontSize: 28, color: C.muted }}>just now</div>
        </div>
      </div>

      <Rise
        at={SAME_AT + 6}
        style={{
          position: "absolute",
          top: wide ? 820 : 1600,
          left: wide ? 150 : undefined,
          display: "flex",
          alignItems: "center",
          gap: 18,
          fontFamily: sans,
          fontSize: wide ? 38 : 42,
          fontWeight: 500,
          color: C.teal,
        }}
      >
        <Lock size={44} color={C.teal} stroke={2.2} />
        Your mood and feelings stay yours.
      </Rise>
    </AbsoluteFill>
  );
};
