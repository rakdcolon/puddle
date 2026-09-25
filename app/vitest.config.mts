import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    include: ['tests/{unit,component,integration}/**/*.test.{ts,tsx}'],
    environment: 'node',
    setupFiles: ['tests/setup.ts'],
    restoreMocks: true,
    testTimeout: 15000,
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/lib/utils/*.ts', 'src/lib/github/webhook.ts', 'src/lib/puzzles/sync.ts', 'src/lib/environment.mjs'],
      thresholds: { lines: 85, statements: 85, functions: 90, branches: 80 },
    },
  },
})
