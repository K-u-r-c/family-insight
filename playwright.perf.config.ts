import { defineConfig } from '@playwright/test'

/** Manual performance checks in `e2e/perf` (not run in CI): `npm run test:perf`. */
export default defineConfig({
  testDir: './e2e/perf',
  testMatch: '**/*.perf.ts',
  timeout: 180_000,
  workers: 1,
  reporter: 'list'
})
