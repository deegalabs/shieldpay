// ShieldPay brand tokens. Finance-grade, quiet, crypto is invisible.
// No neon, no hacker aesthetic. Calm slate with a single indigo->emerald accent.

export const colors = {
  bg: "#0B1120", // page canvas, darkest (surface-base)
  surface: "#0F172A", // cards / panels (surface-1)
  surface2: "#1A2235", // nested / raised (surface-2)
  surfaceLine: "#1F2A3C", // hairline borders
  text: "#F8FAFC", // slate-50
  muted: "#94A3B8", // slate-400
  indigo: "#6366F1",
  emerald: "#10B981",
  amber: "#F59E0B",
  red: "#EF4444",
} as const;

// The signature motif: a single indigo-to-emerald gradient.
// "protected, then proven". Use sparingly, one hero accent per scene.
export const brandGradient = `linear-gradient(135deg, ${colors.indigo} 0%, ${colors.emerald} 100%)`;

// SVG gradient id used by the brand mark.
export const GRADIENT_ID = "shieldpay-grad";

export const fontStack =
  "Inter, system-ui, -apple-system, sans-serif";

// Monospace for amounts, hashes, proof ids (tabular).
export const monoStack =
  "'SFMono-Regular', ui-monospace, 'Menlo', 'Consolas', monospace";
