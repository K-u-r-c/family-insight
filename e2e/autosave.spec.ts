import { copyFileSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { closeApp, launch, tempDir } from './app'

test('autosave writes saved files and explicit saves keep backups', async () => {
  const file = join(tempDir(), 'kowalscy.finsight')
  copyFileSync(join(__dirname, 'fixtures', 'kowalscy.finsight'), file)
  const { app, page } = await launch({ args: [file] })
  await page.getByRole('button', { name: /Tree name: Kowalscy/ }).click()
  await page.keyboard.press('End')
  await page.keyboard.type(' (autosave)')
  await page.keyboard.press('Enter')
  await expect(page.getByText('Unsaved changes')).toBeVisible()
  await expect(page.getByText('All changes saved')).toBeVisible({ timeout: 6000 })
  expect(JSON.parse(readFileSync(file, 'utf8')).meta.name).toBe('Kowalscy (autosave)')
  // Autosave does not create backups; an explicit save does.
  expect(existsSync(`${file}.bak1`)).toBe(false)
  await app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0]!.webContents.send('menu:action', 'file:save')
  )
  await expect.poll(() => existsSync(`${file}.bak1`)).toBe(true)
  await closeApp(app)
})

test('a crash mid-edit offers to restore the unsaved tree', async () => {
  const first = await launch()
  await first.page.getByRole('button', { name: 'New family tree' }).click()
  await first.page.getByLabel('Tree name').fill('Lost and found')
  await first.page.getByRole('button', { name: 'Create' }).click()
  await first.page.getByLabel('Given names').fill('Rescued')
  await first.page.getByLabel('Given names').press('Enter')
  // Wait for the recovery snapshot (written 2 s after the last change), then crash.
  await first.page.waitForTimeout(3000)
  first.app.process().kill('SIGKILL')

  const second = await launch({ userData: first.userData })
  await expect(second.page.getByText('Restore unsaved work?')).toBeVisible()
  await expect(second.page.getByText('Lost and found')).toBeVisible()
  await second.page.getByRole('button', { name: 'Restore' }).click()
  await expect(
    second.page.getByRole('application').getByRole('button', { name: /^Rescued/ })
  ).toBeVisible()
  await expect(second.page.getByText('Unsaved changes')).toBeVisible()
  await closeApp(second.app)

  // Closing without saving (discard) leaves nothing to recover.
  const third = await launch({ userData: first.userData })
  await expect(third.page.getByRole('button', { name: 'New family tree' })).toBeVisible()
  await expect(third.page.getByText('Restore unsaved work?')).toBeHidden()
  await closeApp(third.app)
})
