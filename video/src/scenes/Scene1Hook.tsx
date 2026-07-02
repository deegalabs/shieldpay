import React from "react";
import {
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";
import { Backdrop, Rise, Card, mono } from "../components/primitives";
import { colors } from "../theme";

// Scene 1, Hook. A public ledger row shows a real amount, then it gets masked.
// Line: "Pay your team on-chain. And publish every salary to the world."
const Row: React.FC<{
  recipient: string;
  amount: string;
  masked: boolean;
  maskProgress: number;
}> = ({ recipient, amount, masked, maskProgress }) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 240px",
        alignItems: "center",
        padding: "22px 30px",
        borderTop: `1px solid ${colors.surfaceLine}`,
        fontSize: 30,
      }}
    >
      <div style={{ ...mono, color: colors.muted }}>{recipient}</div>
      <div style={{ ...mono, textAlign: "right", fontWeight: 600 }}>
        {masked ? (
          <span style={{ position: "relative", display: "inline-block" }}>
            <span style={{ opacity: 1 - maskProgress, color: colors.text }}>
              {amount}
            </span>
            <span
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                opacity: maskProgress,
                color: colors.muted,
                letterSpacing: 2,
              }}
            >
              ••••••
            </span>
          </span>
        ) : (
          <span style={{ color: colors.text }}>{amount}</span>
        )}
      </div>
    </div>
  );
};

export const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // The mask sweeps in around 3.3s.
  const maskStart = Math.round(3.3 * fps);
  const maskProgress = spring({
    frame: frame - maskStart,
    fps,
    config: { damping: 200 },
  });

  // The closing clause of the line fades in just before the mask.
  const clauseOpacity = interpolate(
    frame,
    [Math.round(2.0 * fps), Math.round(2.8 * fps)],
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
          gap: 56,
          padding: 120,
        }}
      >
        <Rise delay={4}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.18,
              textAlign: "center",
              maxWidth: 1300,
            }}
          >
            Pay your team on-chain.
            <span
              style={{
                display: "block",
                color: colors.muted,
                fontWeight: 600,
                opacity: clauseOpacity,
              }}
            >
              And publish every salary to the world.
            </span>
          </div>
        </Rise>

        <Rise delay={16} style={{ width: 980 }}>
          <Card style={{ overflow: "hidden" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 240px",
                padding: "18px 30px",
                fontSize: 20,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: colors.muted,
                fontWeight: 600,
              }}
            >
              <div>Public ledger, recipient</div>
              <div style={{ textAlign: "right" }}>Amount</div>
            </div>
            <Row
              recipient="GWORKER1...K7PU"
              amount="$ 4,200.00"
              masked
              maskProgress={maskProgress}
            />
            <Row
              recipient="GWORKER2...9XQA"
              amount="$ 6,750.00"
              masked
              maskProgress={maskProgress}
            />
            <Row
              recipient="GWORKER3...2MD4"
              amount="$ 3,100.00"
              masked
              maskProgress={maskProgress}
            />
          </Card>
        </Rise>
      </div>
    </Backdrop>
  );
};
