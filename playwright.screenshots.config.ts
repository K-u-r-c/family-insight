import { defineConfig } from '@playwright/test'

// Dates and times in the screenshots don't depend on where they are generated.
process.env['TZ'] = 'Europe/Warsaw'

/** Generates the documentation screenshots (`npm run docs:screenshots`), not a test suite. */
export default defineConfig({
  testDir: './docs/.screenshots',
  timeout: 180_000,
  retries: 0,
  fullyParallel: false,
  workers: 1,
  reporter: 'list'
})
