import type { MetadataRoute } from 'next';

/**
 * Web app manifest, served by Next at /manifest.webmanifest. Replaces the old
 * static public/manifest.webmanifest with the full install-grade field set:
 * maskable icon, categories, orientation, id/scope. theme_color and
 * background_color are the app canvas (#020617, slate-950), kept exact.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'ShieldPay',
    short_name: 'ShieldPay',
    description: 'Pay anyone in the world. Prove mathematically that you paid.',
    start_url: '/',
    scope: '/',
    // Request an immersive fullscreen window (hides the system status/nav bars on
    // Android) and fall back to standalone where fullscreen is unsupported.
    display: 'fullscreen',
    display_override: ['fullscreen', 'standalone', 'minimal-ui'],
    orientation: 'portrait',
    lang: 'en',
    dir: 'ltr',
    categories: ['finance', 'business', 'productivity'],
    background_color: '#020617',
    theme_color: '#020617',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
