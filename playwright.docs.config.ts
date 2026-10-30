import { defineConfig } from '@playwright/test'

/** Checks the built documentation website (`npm run docs:test`, after `npm run docs:build`). */
export default defineConfig({
  testDir: './docs/.test',
  timeout: 600_000,
  retries: 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['github']] : 'list'
})
