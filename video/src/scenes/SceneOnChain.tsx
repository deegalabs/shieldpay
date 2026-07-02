import React from "react";
import { Backdrop, Rise, Eyebrow, mono } from "../components/primitives";
import { colors, brandGradient } from "../theme";

// On-chain credibility: the proof is verified inside a real Soroban contract on
// Stellar testnet, using native BN254 pairing (Protocol 25/26). Real ids/tx.

const Line: React.FC<{ label: string; value: React.ReactNode; delay: number }> = ({ label, value, delay }) => (
  <Rise delay={delay}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: 1000, padding: "18px 26px", borderRadius: 14, background: colors.surface, border: `1px solid ${colors.surfaceLine}` }}>
      <span style={{ fontSize: 22, color: colors.muted }}>{label}</span>
      <span style={{ ...mono, fontSize: 24, color: colors.text }}>{value}</span>
    </div>
  </Rise>
);

export const SceneOnChain: React.FC = () => {
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
          gap: 34,
          padding: 90,
        }}
      >
        <Rise delay={2}>
          <div style={{ textAlign: "center", display: "grid", gap: 14, justifyItems: "center" }}>
            <Eyebrow>Not a slide — real ZK on Stellar</Eyebrow>
            <div style={{ fontSize: 46, fontWeight: 700 }}>
              The proof is verified{" "}
              <span style={{ background: brandGradient, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
                inside a smart contract.
              </span>
            </div>
          </div>
        </Rise>

        <div style={{ display: "grid", gap: 14 }}>
          <Line label="Verifier contract (testnet)" value="CCI4WXRQ…RPFUTN" delay={12} />
          <Line label="Method" value="verify_and_record_payroll" delay={22} />
          <Line label="Verified proof tx" value="33c78362…a336b" delay={32} />
        </div>

        <Rise delay={44}>
          <div style={{ fontSize: 24, color: colors.muted, textAlign: "center" }}>
            Groth16 over BN254, checked with Stellar&apos;s native pairing host functions (Protocol 25/26).
          </div>
        </Rise>
      </div>
    </Backdrop>
  );
};
