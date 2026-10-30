import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BrandShapes, Rise, Words } from "../components";
import { C, display, easeInOut, sans, useWide } from "../theme";

/** Opening: the three brand shapes gather, then the promise. */
export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const wide = useWide();
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <BrandShapes
        scale={wide ? 1.3 : 2.25}
        at={0}
        style={{
          position: "absolute",
          top: wide ? 150 : 400,
          scale: String(interpolate(frame, [0, 144], [1.06, 0.96], { easing: easeInOut })),
        }}
      />
      <Words
        text="Put the day down."
        at={34}
        style={{
          position: "absolute",
          top: wide ? 580 : 1090,
          width: wide ? 1500 : 920,
          fontFamily: display,
          fontSize: 132,
          lineHeight: 1.05,
          letterSpacing: "-0.015em",
          color: C.text,
        }}
      />
      <Rise at={64} style={{ position: "absolute", top: wide ? 780 : 1420, fontFamily: sans, fontSize: 50, color: C.muted }}>
        A quiet journal for the end of the day.
      </Rise>
    </AbsoluteFill>
  );
};
