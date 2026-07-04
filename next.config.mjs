import withSerwistInit from '@serwist/next';

// Conservative security headers applied to every response. A strict
// Content-Security-Policy is intentionally left out for now: it needs testing
// against Privy's scripts before it can be enabled without breaking login.
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  // snarkjs pulls in optional native bindings it does not need in the browser.
  // Mark them external so the server bundle stays clean on Railway.
  webpack: (config) => {
    config.externals = config.externals || [];
    config.externals.push('snarkjs', 'circomlibjs');
    // Host disk is tight; skip the large webpack filesystem cache.
    config.cache = false;
    // Privy references optional integrations we don't use; resolve them to empty
    // modules so the client bundle builds without installing them.
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@stripe/crypto': false,
      '@farcaster/mini-app-solana': false,
      '@farcaster/frame-sdk': false,
      '@farcaster/miniapp-sdk': false,
    };
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['snarkjs', 'circomlibjs', '@stellar/stellar-sdk', 'pg', 'jspdf', 'qrcode'],
  },
};

// PWA: Serwist compiles app/sw.ts to public/sw.js (gitignored build output).
// Disabled in dev so the service worker never caches during local work.
const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
});

export default withSerwist(nextConfig);
