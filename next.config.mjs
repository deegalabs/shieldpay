/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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

export default nextConfig;
