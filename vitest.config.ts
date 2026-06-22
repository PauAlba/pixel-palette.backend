import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./src/__tests__/setup.ts'],
    environment: 'node',
    include: ['src/**/*.test.ts'],
    fileParallelism: false,
    hookTimeout: 30000,
  },
});
