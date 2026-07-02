import React from "react";
import { spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { Backdrop, Rise, Eyebrow } from "../components/primitives";
import { colors } from "../theme";

// Scene 7, the three portals. Three clean cards, one-line roles.
type Portal = {
  name: string;
  role: string;
  icon: React.ReactNode;
};

const iconProps = {
  width: 40,
  height: 40,
  viewBox: "0 0 24 24",
  fill: "none",
} as const;

const portals: Portal[] = [
  {
    name: "Company",
    role: "Run payroll, keep amounts private.",
    icon: (
      <svg {...iconProps}>
        <path d="M4 20V8l8-4 8 4v12" stroke={colors.text} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M9 20v-5h6v5" stroke={colors.text} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: "Worker",
    role: "See your payments and receipts.",
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="8" r="3.5" stroke={colors.text} strokeWidth="1.5" />
        <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke={colors.text} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "Auditor",
    role: "Read-only disclosure with a viewing key.",
    icon: (
      <svg {...iconProps}>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" stroke={colors.text} strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="2.5" stroke={colors.text} strokeWidth="1.5" />
      </svg>
    ),
  },
];

const PortalCard: React.FC<{ portal: Portal; appear: number }> = ({
  portal,
  appear,
}) => {
  const opacity = interpolate(appear, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(appear, [0, 1], [28, 0]);
  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        width: 420,
        height: 320,
        borderRadius: 20,
        backgroundColor: colors.surface,
        border: `1px solid ${colors.surfaceLine}`,
        boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
        padding: 40,
        display: "flex",
        flexDirection: "column",
        gap: 22,
      }}
    >
      <div
        style={{
          width: 76,
          height: 76,
          borderRadius: 16,
          backgroundColor: colors.bg,
          border: `1px solid ${colors.surfaceLine}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {portal.icon}
      </div>
      <div style={{ fontSize: 38, fontWeight: 700 }}>{portal.name}</div>
      <div style={{ fontSize: 27, color: colors.muted, lineHeight: 1.35 }}>
        {portal.role}
      </div>
    </div>
  );
};

export const Scene7Portals: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const appear = (i: number) =>
    spring({
      frame: frame - Math.round((0.6 + i * 0.4) * fps),
      fps,
      config: { damping: 200 },
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
          gap: 60,
          padding: 100,
        }}
      >
        <Rise delay={2}>
          <div style={{ textAlign: "center", display: "grid", gap: 14, justifyItems: "center" }}>
            <Eyebrow>Three portals</Eyebrow>
            <div style={{ fontSize: 46, fontWeight: 700 }}>
              One workflow, three roles.
            </div>
          </div>
        </Rise>

        <div style={{ display: "flex", gap: 32 }}>
          {portals.map((portal, i) => (
            <PortalCard key={portal.name} portal={portal} appear={appear(i)} />
          ))}
        </div>
      </div>
    </Backdrop>
  );
};
