import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
} from "remotion";
import { colors, fontStack, monoStack, brandGradient } from "../theme";

// Calm slate backdrop shared by every scene. A very subtle radial glow keeps
// the frame from feeling flat without introducing color noise.
export const Backdrop: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        fontFamily: fontStack,
        color: colors.text,
      }}
    >
      <AbsoluteFill
        style={{
          background: `radial-gradient(1200px 700px at 50% 38%, ${colors.surface} 0%, ${colors.bg} 70%)`,
        }}
      />
      {children}
    </AbsoluteFill>
  );
};

// A spring-driven entrance: fade + small rise. Delay is in frames.
export const useEntrance = (delayFrames = 0, config = { damping: 200 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - delayFrames,
    fps,
    config,
  });
  const opacity = interpolate(progress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(progress, [0, 1], [24, 0]);
  return { opacity, translateY, progress };
};

export const Rise: React.FC<{
  delay?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, children, style }) => {
  const { opacity, translateY } = useEntrance(delay);
  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Small uppercase eyebrow label, muted.
export const Eyebrow: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div
    style={{
      fontSize: 24,
      letterSpacing: 6,
      textTransform: "uppercase",
      color: colors.muted,
      fontWeight: 600,
    }}
  >
    {children}
  </div>
);

// A single thin gradient accent rule. One hero accent per scene.
export const GradientRule: React.FC<{ width?: number; opacity?: number }> = ({
  width = 120,
  opacity = 1,
}) => (
  <div
    style={{
      width,
      height: 4,
      borderRadius: 2,
      background: brandGradient,
      opacity,
    }}
  />
);

// A surface card with a soft slate border.
export const Card: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  accent?: boolean;
}> = ({ children, style, accent }) => (
  <div
    style={{
      backgroundColor: colors.surface,
      border: `1px solid ${accent ? colors.indigo : colors.surfaceLine}`,
      borderRadius: 18,
      boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
      ...style,
    }}
  >
    {children}
  </div>
);

export const mono: React.CSSProperties = {
  fontFamily: monoStack,
  fontVariantNumeric: "tabular-nums",
};
