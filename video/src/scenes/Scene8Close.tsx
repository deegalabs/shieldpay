import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Backdrop, Rise } from "../components/primitives";
import { BrandMark } from "../components/BrandMark";
import { colors, brandGradient } from "../theme";

// Scene 8, the close. Brand mark + wordmark + tagline + footer.
export const Scene8Close: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const markIn = spring({
    frame: frame - Math.round(0.2 * fps),
    fps,
    config: { damping: 14, stiffness: 120 },
  });
  const markScale = interpolate(markIn, [0, 1], [0.6, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <Backdrop>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 36,
          padding: 120,
          textAlign: "center",
        }}
      >
        <div style={{ transform: `scale(${markScale})`, opacity: markIn }}>
          <BrandMark size={130} strokeWidth={1.4} />
        </div>

        <Rise delay={12}>
          <div
            style={{
              fontSize: 96,
              fontWeight: 800,
              background: brandGradient,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              letterSpacing: -1,
            }}
          >
            ShieldPay
          </div>
        </Rise>

        <Rise delay={22}>
          <div
            style={{
              fontSize: 38,
              fontWeight: 600,
              color: colors.text,
              maxWidth: 1200,
              lineHeight: 1.4,
            }}
          >
            Confidential payroll on Stellar. Private by default, auditable on
            demand, verifiable by anyone.
          </div>
        </Rise>

        <Rise delay={34}>
          <div
            style={{
              fontSize: 26,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: colors.muted,
              fontWeight: 600,
            }}
          >
            Stellar + Zero-Knowledge
          </div>
        </Rise>
      </div>
    </Backdrop>
  );
};
