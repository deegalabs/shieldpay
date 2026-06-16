/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // snarkjs pulls in optional native bindings it does not need in the browser.
  // Mark them external so the server bundle stays clean on Railway.
  webpack: (config) => {
    config.externals = config.externals || [];
    config.externals.push('snarkjs', 'circomlibjs');
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['snarkjs', 'circomlibjs', '@stellar/stellar-sdk', 'pg'],
  },
};

export default nextConfig;
