import type { Config } from 'tailwindcss';

/**
 * ShieldPay design system, "Confidential Ledger". Dark, tonal, hairline-precise.
 * Tokens are CSS variables (see app/globals.css) so the palette can evolve and
 * theme without touching components. Semantic names are held stable across the
 * repositioning; their values move to the Confidential Ledger ramp.
 */
const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background) / <alpha-value>)',
        'surface-base': 'hsl(var(--surface-base) / <alpha-value>)',
        'surface-lowest': 'hsl(var(--surface-lowest) / <alpha-value>)',
        surface: 'hsl(var(--surface) / <alpha-value>)',
        'surface-2': 'hsl(var(--surface-2) / <alpha-value>)',
        'surface-3': 'hsl(var(--surface-3) / <alpha-value>)',
        'surface-overlay': 'hsl(var(--surface-overlay) / <alpha-value>)',
        'surface-bright': 'hsl(var(--surface-bright) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        // 4-rung text hierarchy (raw rgba; use without an alpha modifier).
        'fg-default': 'var(--fg-default)',
        'fg-strong': 'var(--fg-strong)',
        'fg-subtle': 'var(--fg-subtle)',
        'fg-faint': 'var(--fg-faint)',
        muted: 'hsl(var(--muted) / <alpha-value>)',
        border: 'hsl(var(--border) / <alpha-value>)',
        'border-strong': 'hsl(var(--border-strong) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        verified: 'hsl(var(--verified) / <alpha-value>)',
        'verified-text': 'hsl(var(--verified-text) / <alpha-value>)',
        brand: 'hsl(var(--brand) / <alpha-value>)',
        'brand-text': 'hsl(var(--brand-text) / <alpha-value>)',
        'brand-container': 'hsl(var(--brand-container) / <alpha-value>)',
        accent: 'hsl(var(--accent) / <alpha-value>)',
        warning: 'hsl(var(--warning) / <alpha-value>)',
        danger: 'hsl(var(--danger) / <alpha-value>)',
        'danger-text': 'hsl(var(--danger-text) / <alpha-value>)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
      },
      fontFamily: {
        // Inter for body + UI labels.
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        // Reference aliases (Stitch export): body -> Inter, headline/display ->
        // Space Grotesk, label -> Public Sans, mono -> Space Mono. Kept so the raw
        // reference classes (font-headline, font-body, font-label) resolve verbatim.
        body: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        headline: ['var(--font-grotesk)', 'Space Grotesk', 'system-ui', 'sans-serif'],
        label: ['var(--font-public-sans)', 'Public Sans', 'system-ui', 'sans-serif'],
        // Space Grotesk for editorial headlines and section titles.
        grotesk: ['var(--font-grotesk)', 'Space Grotesk', 'system-ui', 'sans-serif'],
        display: ['var(--font-grotesk)', 'Space Grotesk', 'system-ui', 'sans-serif'],
        // Space Mono is the source-of-truth font: ids, hashes, amounts, overlines.
        mono: ['var(--font-mono)', 'Space Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // Confidential Ledger type scale (see DESIGN.md). Editorial + mono.
        'display-lg': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '500' }],
        'headline-lg': ['2rem', { lineHeight: '1.2', fontWeight: '600' }],
        'headline-lg-mobile': ['1.5rem', { lineHeight: '1.2', fontWeight: '600' }],
        'body-md': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        'mono-label': ['0.75rem', { lineHeight: '1', letterSpacing: '0.1em', fontWeight: '500' }],
        'mono-data': ['0.875rem', { lineHeight: '1.4', fontWeight: '400' }],
      },
      boxShadow: {
        // Elevation is lightness-based on dark; these are top-edge highlights, not shadows.
        edge: 'inset 0 1px 0 rgba(255,255,255,0.06)',
        'edge-2': 'inset 0 1px 0 rgba(255,255,255,0.10)',
        'edge-brand': 'inset 0 1px 0 rgba(255,255,255,0.10), inset 0 2px 0 -1px rgba(99,102,241,0.18)',
        // Drop shadow only at the overlay level.
        overlay: '0 16px 48px -16px rgba(0,0,0,0.65)',
        'verified-glow': '0 0 0 1px rgba(16,185,129,0.40), 0 0 16px -4px rgba(16,185,129,0.35)',
        // Legacy keys kept so existing className refs do not break.
        card: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        elevated: '0 16px 48px -16px rgba(0,0,0,0.65)',
        glow: '0 0 0 1px hsl(var(--border)), 0 8px 30px -12px hsl(var(--brand) / 0.45)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        // Amount reveal + payroll stepper (confirm-or-reveal only, no loops).
        reveal: { from: { opacity: '0' }, to: { opacity: '1' } },
        'border-sweep': { '0%': { borderColor: 'var(--brand-line)' }, '100%': { borderColor: 'var(--verified-line)' } },
        confirm: {
          '0%': { boxShadow: '0 0 0 0 rgba(16,185,129,0)' },
          '40%': { boxShadow: '0 0 0 3px rgba(16,185,129,0.35)' },
          '100%': { boxShadow: '0 0 0 0 rgba(16,185,129,0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in var(--dur-slow) var(--ease-physical)',
        reveal: 'reveal var(--dur-base) var(--ease-physical)',
        'border-sweep': 'border-sweep var(--dur-base) var(--ease-physical)',
        confirm: 'confirm var(--dur-base) var(--ease-physical)',
      },
    },
  },
  plugins: [],
};

export default config;
