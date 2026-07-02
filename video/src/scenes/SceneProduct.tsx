import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Backdrop, Rise, Eyebrow, mono } from "../components/primitives";
import { colors, brandGradient } from "../theme";

// A stylized ShieldPay payroll run: masked amounts, verified badges, and the
// aggregate Proof-of-Payroll line. Shows the product without a screen recording.

const rows = [
  { name: "Jane Doe", ref: "JUN2026" },
  { name: "Alice Smith", ref: "JUN2026" },
  { name: "Bob Johnson", ref: "JUN2026" },
];

const VerifiedPill: React.FC = () => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 12px",
      borderRadius: 999,
      fontSize: 18,
      fontWeight: 600,
      color: colors.emerald,
      background: "rgba(16,185,129,0.10)",
      boxShadow: "inset 0 0 0 1px rgba(16,185,129,0.35)",
    }}
  >
    <span style={{ width: 8, height: 8, borderRadius: 999, background: colors.emerald }} />
    Verified
  </span>
);

const Row: React.FC<{ name: string; ref_: string; appear: number }> = ({ name, ref_, appear }) => {
  const opacity = interpolate(appear, [0, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const x = interpolate(appear, [0, 1], [-16, 0]);
  return (
    <div
      style={{
        opacity,
        transform: `translateX(${x}px)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "18px 24px",
        borderTop: `1px solid ${colors.surfaceLine}`,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 220 }}>
        <span style={{ fontSize: 24, fontWeight: 600 }}>{name}</span>
        <span style={{ fontSize: 17, color: colors.muted }}>{ref_}</span>
      </div>
      {/* masked amount chip */}
      <span
        style={{
          ...mono,
          width: 150,
          height: 44,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 10,
          background: colors.surface2,
          border: `1px solid ${colors.surfaceLine}`,
          color: colors.muted,
          letterSpacing: 5,
          fontSize: 22,
        }}
      >
        ••••
      </span>
      <VerifiedPill />
    </div>
  );
};

export const SceneProduct: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rowAppear = (i: number) =>
    spring({ frame: frame - Math.round((1.0 + i * 0.35) * fps), fps, config: { damping: 200 } });
  const proof = spring({ frame: frame - Math.round(2.6 * fps), fps, config: { damping: 200 } });

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
          padding: 90,
        }}
      >
        <Rise delay={2}>
          <div style={{ textAlign: "center", display: "grid", gap: 14, justifyItems: "center" }}>
            <Eyebrow>Confidential payroll, in one run</Eyebrow>
            <div style={{ fontSize: 46, fontWeight: 700 }}>Pay the team. Keep every amount private.</div>
          </div>
        </Rise>

        <div
          style={{
            width: 1080,
            borderRadius: 20,
            backgroundColor: colors.surface,
            border: `1px solid ${colors.surfaceLine}`,
            boxShadow: "0 24px 70px rgba(0,0,0,0.4)",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 24px" }}>
            <span style={{ fontSize: 22, fontWeight: 600 }}>Payroll run · JUN2026</span>
            <span style={{ fontSize: 18, color: colors.muted }}>3 payments</span>
          </div>
          {rows.map((r, i) => (
            <Row key={r.name} name={r.name} ref_={r.ref} appear={rowAppear(i)} />
          ))}
          {/* Aggregate Proof-of-Payroll line */}
          <div
            style={{
              opacity: interpolate(proof, [0, 1], [0, 1], { extrapolateRight: "clamp" }),
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "22px 24px",
              borderTop: `1px solid ${colors.indigo}`,
              background: "rgba(99,102,241,0.06)",
            }}
          >
            <span style={{ fontSize: 20, color: colors.muted }}>Total, proven on-chain</span>
            <span style={{ ...mono, fontSize: 30, fontWeight: 700, background: brandGradient, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
              $12,300 USDC
            </span>
          </div>
        </div>
      </div>
    </Backdrop>
  );
};
