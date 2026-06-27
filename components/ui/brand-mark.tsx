/**
 * ShieldPay brand mark: the negative-space privacy slit. A shield filled with the
 * signature 135deg indigo-to-emerald gradient (protected, then proven), with the
 * check cut OUT of it as a slit so the surface behind shows through. The shield
 * holds the figure; the slit is the controlled disclosure. This carries the
 * masked-to-disclosed signature inside the glyph itself.
 *
 * Use for identity spots (logo, page headers). Keep lucide ShieldCheck for the
 * functional verified badge so identity and status never compete.
 */
const SHIELD = 'M12 2.5 4.5 5.5v6c0 4.6 3.2 7.8 7.5 9.5 4.3-1.7 7.5-4.9 7.5-9.5v-6L12 2.5Z';
const SLIT = 'M8.5 12.2 11 14.7 15.8 9.6';

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
        {/* The shield is visible (white); the check is cut away (black). */}
        <mask id="sp-brand-slit" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
          <path d={SHIELD} fill="white" />
          <path
            d={SLIT}
            stroke="black"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </mask>
      </defs>
      <path d={SHIELD} fill="url(#sp-brand-grad)" mask="url(#sp-brand-slit)" />
    </svg>
  );
}
