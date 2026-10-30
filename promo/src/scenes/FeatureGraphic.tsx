import { AbsoluteFill } from "remotion";
import { Backdrop, BrandShapes } from "../components";
import { C, display, sans } from "../theme";

/** Play Store feature graphic (1024 x 500): the three shapes, the wordmark and one line. Render a still at frame 60. */
export const FeatureGraphic: React.FC = () => (
  <AbsoluteFill>
    <Backdrop />
    <BrandShapes scale={0.98} at={0} float={0.6} style={{ position: "absolute", left: 96, top: 124 }} />
    <div style={{ position: "absolute", left: 480, top: 150, width: 500 }}>
      <div style={{ fontFamily: display, fontSize: 104, lineHeight: 1.05, letterSpacing: "-0.02em", color: C.text }}>
        Journ<span style={{ color: C.accent }}>.</span>al
      </div>
      <div style={{ marginTop: 14, fontFamily: sans, fontSize: 34, lineHeight: 1.3, color: C.muted }}>
        Put the day down.
      </div>
    </div>
  </AbsoluteFill>
);
