import { defineConfig } from '@playwright/test'

// Dates and times in the screenshots don't depend on where they are generated.
process.env['TZ'] = 'Europe/Warsaw'

/** Generates the documentation screenshots (`npm run docs:screenshots`), not a test suite. */
export default defineConfig({
  testDir: './docs/.screenshots',
  timeout: 180_000,
  // A session now and then waits forever for an animation frame (Electron throttles a window that
  // isn't shown yet); a fresh session renders the shot fine.
  retries: 1,
  fullyParallel: false,
  workers: 1,
  reporter: 'list'
})
