import type { Config } from 'tailwindcss';

/**
 * ShieldPay design system — "Fintech Premium".
 * References: Stripe Dashboard, Deel, QuickBooks.
 * Rule: cryptography is invisible. No neon, no hacker aesthetic.
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
        // Surfaces
        background: '#0F172A', // slate-900
        surface: '#1E293B', // slate-800
        foreground: '#F8FAFC', // slate-50
        muted: '#94A3B8', // slate-400
        border: '#334155', // slate-700
        // Semantic
        primary: '#10B981', // emerald-500 — primary action / success
        warning: '#F59E0B', // amber-500
        danger: '#EF4444', // red-500
        accent: '#6366F1', // indigo-500
      },
      borderRadius: {
        lg: '0.75rem',
        xl: '1rem',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
