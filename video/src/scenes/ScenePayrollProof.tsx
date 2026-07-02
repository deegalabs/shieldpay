import React from "react";
import {
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";
import { Backdrop, Rise, Eyebrow, mono } from "../components/primitives";
import { colors, brandGradient } from "../theme";

// The innovation beat: Proof-of-Payroll. Several hidden salaries collapse into a
// single proof that the total is correct and every amount is in range, revealing
// no salary. Verified on-chain. "Proof-of-reserves, for payroll."

const Chip: React.FC<{ appear: number }> = ({ appear }) => {
  const opacity = interpolate(appear, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(appear, [0, 1], [16, 0]);
  return (
    <div
      style={{
        opacity,
        transform: `translateY(${y}px)`,
        width: 150,
        height: 54,
        borderRadius: 12,
        backgroundColor: colors.surface2,
        border: `1px solid ${colors.surfaceLine}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...mono,
        letterSpacing: 4,
        color: colors.muted,
        fontSize: 22,
      }}
    >
      ••••
    </div>
  );
};

export const ScenePayrollProof: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const chipAppear = (i: number) =>
    spring({ frame: frame - Math.round((0.8 + i * 0.2) * fps), fps, config: { damping: 200 } });

  // The proof card lands after the chips.
  const proof = spring({ frame: frame - Math.round(2.6 * fps), fps, config: { damping: 200 } });
  const proofOpacity = interpolate(proof, [0, 1], [0, 1], { extrapolateRight: "clamp" });
  const proofScale = interpolate(proof, [0, 1], [0.92, 1]);
  const barFill = interpolate(frame, [Math.round(2.4 * fps), Math.round(3.2 * fps)], [0, 1], {
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
          gap: 56,
          padding: 90,
        }}
      >
        <Rise delay={2}>
          <div style={{ textAlign: "center", display: "grid", gap: 16, justifyItems: "center" }}>
            <Eyebrow>The innovation</Eyebrow>
            <div style={{ fontSize: 52, fontWeight: 700 }}>Prove the whole payroll at once.</div>
          </div>
        </Rise>

        {/* Hidden salaries */}
        <div style={{ display: "flex", gap: 18 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Chip key={i} appear={chipAppear(i)} />
          ))}
        </div>

        {/* Collapsing bar into the single proof */}
        <div
          style={{
            width: 560,
            height: 4,
            borderRadius: 2,
            background: colors.surfaceLine,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              background: brandGradient,
              transform: `scaleX(${barFill})`,
              transformOrigin: "left center",
            }}
          />
        </div>

        {/* The aggregate proof card */}
        <div
          style={{
            opacity: proofOpacity,
            transform: `scale(${proofScale})`,
            width: 900,
            borderRadius: 22,
            backgroundColor: colors.surface,
            border: `1px solid ${colors.emerald}`,
            boxShadow: "0 24px 70px rgba(16,185,129,0.20)",
            padding: "34px 40px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontSize: 22, color: colors.muted, letterSpacing: 1 }}>
              One zero-knowledge proof
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: colors.emerald,
              }}
            >
              Verified on-chain
            </div>
          </div>
          <div style={{ fontSize: 40, fontWeight: 700 }}>
            Total ={" "}
            <span style={{ ...mono, background: brandGradient, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
              $12,300 USDC
            </span>
            {"  ·  "}
            <span style={{ fontSize: 30, color: colors.text }}>every amount in range</span>
          </div>
          <div style={{ fontSize: 26, color: colors.muted }}>
            No individual salary revealed. Proof-of-reserves, for payroll.
          </div>
        </div>
      </div>
    </Backdrop>
  );
};
