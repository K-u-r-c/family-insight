import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { _electron as electron, type ElectronApplication, type Page } from '@playwright/test'

export interface Launched {
  app: ElectronApplication
  page: Page
  userData: string
}

interface LaunchOptions {
  language?: 'en' | 'pl'
  args?: string[]
  userData?: string
}

/** Launches the built app (`out/`) with an isolated profile in a hidden window. */
export async function launch(options: LaunchOptions = {}): Promise<Launched> {
  const userData = options.userData ?? mkdtempSync(join(tmpdir(), 'fi-e2e-'))
  if (!options.userData) {
    writeFileSync(
      join(userData, 'settings.json'),
      JSON.stringify({ language: options.language ?? 'en', theme: 'light' })
    )
  }
  const app = await electron.launch({
    args: ['.', ...(options.args ?? [])],
    env: { ...process.env, FAMILY_INSIGHT_USER_DATA: userData, FAMILY_INSIGHT_HIDDEN: '1' }
  })
  const page = await app.firstWindow()
  await page.waitForSelector('#root > *')
  return { app, page, userData }
}

/** Replaces native dialogs in the main process with scripted answers. */
export async function mockDialogs(
  app: ElectronApplication,
  answers: { open?: string; save?: string; message?: number }
): Promise<void> {
  await app.evaluate(({ dialog }, a) => {
    dialog.showOpenDialog = (async () => ({
      canceled: !a.open,
      filePaths: a.open ? [a.open] : []
    })) as never
    dialog.showSaveDialog = (async () => ({ canceled: !a.save, filePath: a.save })) as never
    dialog.showMessageBox = (async () => ({
      response: a.message ?? 0,
      checkboxChecked: false
    })) as never
  }, answers)
}

export function tempDir(): string {
  return mkdtempSync(join(tmpdir(), 'fi-files-'))
}

/** Closes the app, answering "Don't save" if it asks about unsaved changes. */
export async function closeApp(app: ElectronApplication): Promise<void> {
  await mockDialogs(app, { message: 1 })
  await app.close()
}
