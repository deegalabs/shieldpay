import React from "react";
import { Backdrop, Rise, Card, mono } from "../components/primitives";
import { BrandMark } from "../components/BrandMark";
import { colors, brandGradient } from "../theme";

// Scene 3, the ShieldPay answer. Recipient visible, amount hidden.
const Field: React.FC<{
  label: string;
  value: React.ReactNode;
  state: "visible" | "hidden";
}> = ({ label, value, state }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "26px 34px",
      borderTop: `1px solid ${colors.surfaceLine}`,
    }}
  >
    <div style={{ fontSize: 26, color: colors.muted }}>{label}</div>
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <div style={{ ...mono, fontSize: 30, fontWeight: 600 }}>{value}</div>
      <span
        style={{
          fontSize: 18,
          fontWeight: 600,
          letterSpacing: 1,
          textTransform: "uppercase",
          padding: "6px 14px",
          borderRadius: 999,
          color: state === "visible" ? colors.emerald : colors.muted,
          border: `1px solid ${
            state === "visible" ? colors.emerald : colors.surfaceLine
          }`,
        }}
      >
        {state === "visible" ? "visible" : "hidden"}
      </span>
    </div>
  </div>
);

export const Scene3Reveal: React.FC = () => {
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
          gap: 48,
          padding: 120,
        }}
      >
        <Rise delay={2}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 22,
            }}
          >
            <BrandMark size={70} />
            <div
              style={{
                fontSize: 56,
                fontWeight: 800,
                background: brandGradient,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              ShieldPay
            </div>
          </div>
        </Rise>

        <Rise delay={10}>
          <div
            style={{
              fontSize: 40,
              fontWeight: 600,
              textAlign: "center",
              color: colors.text,
            }}
          >
            Recipient visible. Amount hidden.
          </div>
        </Rise>

        <Rise delay={18} style={{ width: 940 }}>
          <Card accent style={{ overflow: "hidden", paddingTop: 6 }}>
            <Field
              label="Recipient"
              value="GWORKER1...K7PU"
              state="visible"
            />
            <Field
              label="Amount"
              value={<span style={{ letterSpacing: 4 }}>••••••</span>}
              state="hidden"
            />
          </Card>
        </Rise>
      </div>
    </Backdrop>
  );
};
