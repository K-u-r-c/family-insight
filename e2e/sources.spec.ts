import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { closeApp, launch, mockDialogs, tempDir } from './app'

test('sources: cite a new source on a birth date, save, reopen, citation is shown', async () => {
  const target = join(tempDir(), 'sources.finsight')
  const { app, page } = await launch()
  await mockDialogs(app, { save: target })
  await page.getByRole('button', { name: 'New family tree' }).click()
  await page.getByRole('button', { name: 'Create' }).click()
  await page.getByLabel('Given names').fill('Jan')
  await page.getByLabel('Surname', { exact: true }).fill('Kowalski')
  await page.getByLabel('Date of birth').fill('12.05.1890')
  await page.getByLabel('Date of birth').press('Enter')

  await page.getByRole('button', { name: /^Sources for Jan Kowalski – Born/ }).click()
  const dialog = page.getByRole('dialog', { name: 'Sources' })
  await dialog.getByLabel('New source').fill('Parish register of births 1890')
  await dialog.getByRole('button', { name: 'Create and cite' }).click()
  await dialog.getByLabel('Page or entry').fill('entry 345')
  await dialog.getByLabel('Page or entry').press('Enter')
  await expect(dialog.getByText('entry 345', { exact: true })).toBeVisible()
  await dialog.getByRole('button', { name: 'Done' }).click()
  await expect(
    page.getByRole('button', { name: /^Sources for Jan Kowalski – Born \(1 source\)/ })
  ).toBeVisible()

  await app.evaluate(({ BrowserWindow }) => {
    BrowserWindow.getAllWindows()[0]!.webContents.send('menu:action', 'file:save-as')
  })
  await expect.poll(() => existsSync(target)).toBe(true)
  await closeApp(app)

  const second = await launch({ args: [target] })
  const canvas = second.page.getByRole('application', { name: 'Family tree' })
  await canvas.getByRole('button', { name: /^Jan Kowalski/ }).click()
  const birth = second.page.locator('[data-type="birth"]')
  await expect(birth.getByRole('button', { name: '1 source – show' })).toBeVisible()
  await expect(
    second.page.getByRole('button', { name: 'Parish register of births 1890' })
  ).toBeVisible()
  await birth.getByRole('button', { name: '1 source – show' }).click()
  await expect(second.page.getByRole('dialog', { name: 'Sources' })).toContainText('entry 345')
  await closeApp(second.app)
})
