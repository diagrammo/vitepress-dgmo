import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['tests/**/*.test.ts'],
    // The real-render tests load dgmo + its fonts on first use; on a shared gate
    // machine that alone has passed vitest's 5s default. This bounds a hang, it
    // does not measure speed — same headroom astro-dgmo uses.
    testTimeout: 20000,
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: ['src/**/*.d.ts', 'src/client.ts'],
      reporter: ['text-summary'],
      // src/client.ts is browser-only (excluded above); thresholds cover the
      // build-time surface (cache, vite plugin, markdown override, config).
      thresholds: {
        lines: 85,
        statements: 85,
        branches: 85,
        functions: 85,
      },
    },
  },
});
