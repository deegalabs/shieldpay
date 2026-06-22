/**
 * ShieldPay brand mark: a shield with a check, carrying the signature
 * indigo-to-emerald gradient (protected, then proven). Use this for identity
 * spots (logo, page headers); keep lucide ShieldCheck for functional badges.
 */
export function BrandMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      aria-label="ShieldPay"
      className={className}
    >
      <defs>
        <linearGradient id="sp-brand-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.5 4.5 5.5v6c0 4.6 3.2 7.8 7.5 9.5 4.3-1.7 7.5-4.9 7.5-9.5v-6L12 2.5Z"
        stroke="url(#sp-brand-grad)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 12.2 11 14.7 15.8 9.6"
        stroke="url(#sp-brand-grad)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
