import React from "react";
import {
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";
import { Backdrop, Rise, Eyebrow, Card, mono } from "../components/primitives";
import { colors } from "../theme";

// Scene 6, selective disclosure. An auditor opens a viewing-key link, the masked
// amount resolves to a number, and a check confirms it matches the on-chain
// commitment.
export const Scene6Disclosure: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // The masked amount resolves around 1.8s.
  const resolveStart = Math.round(1.8 * fps);
  const resolve = interpolate(
    frame,
    [resolveStart, resolveStart + Math.round(0.6 * fps)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // The match confirmation pops after the amount resolves.
  const match = spring({
    frame: frame - Math.round(3.0 * fps),
    fps,
    config: { damping: 14, stiffness: 150 },
  });
  const matchScale = interpolate(match, [0, 1], [0.5, 1], {
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
            <Eyebrow>Selective disclosure</Eyebrow>
            <div style={{ fontSize: 46, fontWeight: 700 }}>
              An auditor with the viewing key sees the exact figure.
            </div>
          </div>
        </Rise>

        <Rise delay={12} style={{ width: 980 }}>
          <Card style={{ overflow: "hidden" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px 34px",
                fontSize: 22,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: colors.muted,
                fontWeight: 700,
              }}
            >
              <span>Auditor view, viewing-key link</span>
              <span style={{ color: colors.indigo }}>read-only</span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "30px 34px",
                borderTop: `1px solid ${colors.surfaceLine}`,
              }}
            >
              <div style={{ fontSize: 26, color: colors.muted }}>Amount</div>
              <div style={{ position: "relative", height: 48, width: 280 }}>
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    ...mono,
                    fontSize: 38,
                    fontWeight: 700,
                    letterSpacing: 4,
                    color: colors.muted,
                    opacity: 1 - resolve,
                  }}
                >
                  ••••••
                </div>
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    ...mono,
                    fontSize: 38,
                    fontWeight: 700,
                    color: colors.text,
                    opacity: resolve,
                  }}
                >
                  $ 4,200.00
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "26px 34px",
                borderTop: `1px solid ${colors.surfaceLine}`,
              }}
            >
              <div style={{ fontSize: 26, color: colors.muted }}>
                Re-derived commitment
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  transform: `scale(${matchScale})`,
                  color: colors.emerald,
                }}
              >
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke={colors.emerald} strokeWidth="1.6" />
                  <path
                    d="M8 12.4 11 15.2 16 9.2"
                    stroke={colors.emerald}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span style={{ fontSize: 28, fontWeight: 700 }}>
                  matches on-chain
                </span>
              </div>
            </div>
          </Card>
        </Rise>

        <Rise delay={26}>
          <div style={{ fontSize: 26, color: colors.muted }}>
            Provable, not trust-me. The disclosed figure re-derives the same
            commitment recorded on Stellar.
          </div>
        </Rise>
      </div>
    </Backdrop>
  );
};
