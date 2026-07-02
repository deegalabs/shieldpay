import React from "react";
import {
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";
import { Backdrop, Rise, Eyebrow, Card, mono } from "../components/primitives";
import { colors } from "../theme";

// Scene 5, the credibility beat. The real on-chain record on testnet.
const Field: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 30,
      padding: "20px 34px",
      borderTop: `1px solid ${colors.surfaceLine}`,
    }}
  >
    <div style={{ fontSize: 24, color: colors.muted }}>{label}</div>
    <div style={{ ...mono, fontSize: 26, fontWeight: 600, textAlign: "right" }}>
      {value}
    </div>
  </div>
);

export const Scene5Real: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // A check stamp pops in next to "verified: true".
  const stamp = spring({
    frame: frame - Math.round(1.6 * fps),
    fps,
    config: { damping: 12, stiffness: 160 },
  });
  const stampScale = interpolate(stamp, [0, 1], [0.4, 1], {
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
          gap: 44,
          padding: 120,
        }}
      >
        <Rise delay={2}>
          <div style={{ textAlign: "center", display: "grid", gap: 14, justifyItems: "center" }}>
            <Eyebrow>It is real</Eyebrow>
            <div style={{ fontSize: 46, fontWeight: 700 }}>
              Live on Stellar testnet. Anyone can re-verify.
            </div>
          </div>
        </Rise>

        <Rise delay={12} style={{ width: 1080 }}>
          <Card style={{ overflow: "hidden" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "22px 34px",
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: colors.muted,
                  fontWeight: 700,
                }}
              >
                PaymentVerifier, recorded proof
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  transform: `scale(${stampScale})`,
                }}
              >
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: colors.emerald,
                    border: `1px solid ${colors.emerald}`,
                    borderRadius: 999,
                    padding: "6px 18px",
                    ...mono,
                  }}
                >
                  verified: true
                </div>
              </div>
            </div>
            <Field label="proof_id" value="0" />
            <Field
              label="contract"
              value="CAUK3NRZ...KZZWNXV3"
            />
            <Field label="network" value="Stellar testnet" />
          </Card>
        </Rise>

        <Rise delay={26}>
          <div style={{ fontSize: 26, color: colors.muted }}>
            Verified on-chain by Stellar&apos;s native BN254 pairing. Not
            trust-me. Check it yourself.
          </div>
        </Rise>
      </div>
    </Backdrop>
  );
};
