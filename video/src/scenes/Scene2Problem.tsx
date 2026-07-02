import React from "react";
import {
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Backdrop, Rise, Eyebrow, GradientRule } from "../components/primitives";
import { colors } from "../theme";

// Scene 2, the problem in one line.
export const Scene2Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Underline the single load-bearing word "public".
  const wordProgress = interpolate(
    frame,
    [Math.round(1.0 * fps), Math.round(1.8 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

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
          gap: 40,
          padding: 160,
        }}
      >
        <Rise delay={2}>
          <Eyebrow>The problem</Eyebrow>
        </Rise>
        <Rise delay={8}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 1.2,
              textAlign: "center",
              maxWidth: 1400,
            }}
          >
            On a transparent chain, the payroll amount is{" "}
            <span style={{ position: "relative", whiteSpace: "nowrap" }}>
              <span style={{ color: colors.amber }}>public</span>
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: -10,
                  height: 6,
                  borderRadius: 3,
                  background: colors.amber,
                  width: `${wordProgress * 100}%`,
                }}
              />
            </span>
            .
          </div>
        </Rise>
        <Rise delay={18}>
          <GradientRule width={140} />
        </Rise>
      </div>
    </Backdrop>
  );
};
