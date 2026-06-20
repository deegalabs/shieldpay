import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 15000, // Poseidon (circomlibjs) build is ~1s
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
});
