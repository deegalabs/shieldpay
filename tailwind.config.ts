import type { Config } from 'tailwindcss';

/**
 * ShieldPay design system — "Fintech Premium" with depth.
 * Tokens are CSS variables (see app/globals.css) so the palette can evolve and
 * theme without touching components. References: Deel, Stripe, QuickBooks.
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
        surface: 'hsl(var(--surface) / <alpha-value>)',
        'surface-2': 'hsl(var(--surface-2) / <alpha-value>)',
        'surface-3': 'hsl(var(--surface-3) / <alpha-value>)',
        'surface-overlay': 'hsl(var(--surface-overlay) / <alpha-value>)',
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
        brand: 'hsl(var(--brand) / <alpha-value>)',
        'brand-text': 'hsl(var(--brand-text) / <alpha-value>)',
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
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        // Display tier comes from Inter's optical-size axis (font-optical-sizing: auto).
        display: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        // Elevation is lightness-based on dark; these are top-edge highlights, not shadows.
        edge: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        'edge-2': 'inset 0 1px 0 rgba(255,255,255,0.06)',
        'edge-brand': 'inset 0 1px 0 rgba(255,255,255,0.04), inset 0 2px 0 -1px rgba(99,102,241,0.18)',
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
