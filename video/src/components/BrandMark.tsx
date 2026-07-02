import React from "react";
import { colors, GRADIENT_ID } from "../theme";

// The ShieldPay brand mark: the negative-space privacy slit. A shield filled with
// the indigo->emerald gradient, with the check cut OUT of it as a slit so the
// surface behind shows through. Matches components/ui/brand-mark.tsx in the app.
const SHIELD = "M12 2.5 4.5 5.5v6c0 4.6 3.2 7.8 7.5 9.5 4.3-1.7 7.5-4.9 7.5-9.5v-6L12 2.5Z";
const SLIT = "M8.5 12.2 11 14.7 15.8 9.6";
const MASK_ID = "sp-video-slit";

export const BrandMark: React.FC<{
  size?: number;
  strokeWidth?: number;
}> = ({ size = 96 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={colors.indigo} />
          <stop offset="100%" stopColor={colors.emerald} />
        </linearGradient>
        <mask id={MASK_ID} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
          <path d={SHIELD} fill="white" />
          <path
            d={SLIT}
            stroke="black"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </mask>
      </defs>
      <path d={SHIELD} fill={`url(#${GRADIENT_ID})`} mask={`url(#${MASK_ID})`} />
    </svg>
  );
};
