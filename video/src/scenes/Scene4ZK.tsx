import React from "react";
import {
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";
import { Backdrop, Rise, Eyebrow, mono } from "../components/primitives";
import { colors, brandGradient } from "../theme";

// Scene 4, how the ZK works. A small left-to-right chain of four steps.
// amount -> Poseidon commitment -> Groth16 proof (min<=amount<=max)
// -> verified inside a Soroban contract (BN254).

type Step = {
  title: string;
  sub: string;
  body: React.ReactNode;
  emphasis?: boolean;
};

const steps: Step[] = [
  {
    title: "Amount",
    sub: "private",
    body: <span style={{ ...mono, letterSpacing: 3 }}>•••• USDC</span>,
  },
  {
    title: "Commitment",
    sub: "Poseidon",
    body: <span style={{ ...mono, fontSize: 22 }}>0x9f3c...a1</span>,
  },
  {
    title: "Proof",
    sub: "Groth16",
    body: (
      <span style={{ ...mono, fontSize: 24, color: colors.text }}>
        min ≤ amount ≤ max
      </span>
    ),
  },
  {
    title: "Verified",
    sub: "Soroban, BN254",
    body: <span style={{ fontSize: 30, fontWeight: 700 }}>on-chain</span>,
    emphasis: true,
  },
];

const StepCard: React.FC<{ step: Step; appear: number }> = ({
  step,
  appear,
}) => {
  const opacity = interpolate(appear, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(appear, [0, 1], [20, 0]);
  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        width: 320,
        height: 230,
        borderRadius: 18,
        backgroundColor: colors.surface,
        border: `1px solid ${
          step.emphasis ? colors.emerald : colors.surfaceLine
        }`,
        boxShadow: step.emphasis
          ? "0 18px 50px rgba(16,185,129,0.18)"
          : "0 18px 50px rgba(0,0,0,0.35)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 30,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 18,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: step.emphasis ? colors.emerald : colors.muted,
            fontWeight: 700,
          }}
        >
          {step.sub}
        </div>
        <div style={{ fontSize: 34, fontWeight: 700, marginTop: 8 }}>
          {step.title}
        </div>
      </div>
      <div style={{ color: colors.muted, fontSize: 26 }}>{step.body}</div>
    </div>
  );
};

const Connector: React.FC<{ progress: number }> = ({ progress }) => (
  <div
    style={{
      width: 64,
      height: 4,
      borderRadius: 2,
      background: colors.surfaceLine,
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: brandGradient,
        transform: `scaleX(${progress})`,
        transformOrigin: "left center",
      }}
    />
  </div>
);

export const Scene4ZK: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Stagger each card, then fill the connector before the next card.
  const cardDelay = (i: number) => Math.round((0.6 + i * 0.85) * fps);
  const appear = (i: number) =>
    spring({ frame: frame - cardDelay(i), fps, config: { damping: 200 } });
  const connector = (i: number) =>
    interpolate(
      frame,
      [cardDelay(i) + 6, cardDelay(i) + Math.round(0.6 * fps)],
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
          gap: 64,
          padding: 80,
        }}
      >
        <Rise delay={2}>
          <div style={{ textAlign: "center", display: "grid", gap: 16, justifyItems: "center" }}>
            <Eyebrow>How it stays private and provable</Eyebrow>
            <div style={{ fontSize: 44, fontWeight: 700 }}>
              The amount is proven correct without being revealed.
            </div>
          </div>
        </Rise>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
          }}
        >
          {steps.map((step, i) => (
            <React.Fragment key={step.title}>
              <StepCard step={step} appear={appear(i)} />
              {i < steps.length - 1 && (
                <div style={{ padding: "0 14px" }}>
                  <Connector progress={connector(i)} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        <Rise delay={Math.round(4.2 * fps)}>
          <div style={{ fontSize: 26, color: colors.muted, textAlign: "center" }}>
            Bound to the recipient and the settlement transaction, so a proof
            cannot be reused.
          </div>
        </Rise>
      </div>
    </Backdrop>
  );
};
