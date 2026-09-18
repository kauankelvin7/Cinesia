import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.integration.test.js'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
