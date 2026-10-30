import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { closeApp, launch, mockDialogs, tempDir, readTree } from './app'

test('life event: add military service 1914–1918, save, reopen, see it in details', async () => {
  const target = join(tempDir(), 'events.finsight')
  const { app, page } = await launch()
  await mockDialogs(app, { save: target })
  await page.getByRole('button', { name: 'New family tree' }).click()
  await page.getByRole('button', { name: 'Create' }).click()
  await page.getByLabel('Given names').fill('Jan')
  await page.getByLabel('Surname', { exact: true }).fill('Kowalski')
  await page.getByLabel('Date of birth').fill('1895')
  await page.getByLabel('Date of birth').press('Enter')

  await page.getByRole('button', { name: 'Add event' }).click()
  await page.getByRole('menuitem', { name: 'Military service' }).click()
  await page.getByLabel('Date (or start)').fill('1914')
  await page.getByLabel('Date (or start)').press('Enter')
  await page.getByLabel('End date (optional)').fill('1918')
  await page.getByLabel('End date (optional)').press('Enter')
  await page.getByLabel('Place', { exact: true }).fill('Kraków')
  await page.getByLabel('Place', { exact: true }).press('Enter')
  await expect(page.getByText('1914 – 1918 · Kraków')).toBeVisible()

  await app.evaluate(({ BrowserWindow }) => {
    BrowserWindow.getAllWindows()[0]!.webContents.send('menu:action', 'file:save-as')
  })
  await expect.poll(() => existsSync(target)).toBe(true)
  const saved = readTree(target)
  const jan = Object.values(saved.persons as Record<string, { events: unknown[] }>)[0]!
  expect(jan.events).toMatchObject([
    {
      type: 'military-service',
      date: { value: '1914' },
      endDate: { value: '1918' },
      place: 'Kraków'
    }
  ])
  await closeApp(app)

  const second = await launch({ args: [target] })
  const canvas = second.page.getByRole('application', { name: 'Family tree' })
  await canvas.getByRole('button', { name: /^Jan Kowalski/ }).click()
  const event = second.page.locator('[data-type="event"]')
  await expect(event).toContainText('Military service')
  await expect(event).toContainText('1914 – 1918')
  await expect(event).toContainText('Kraków')
  await closeApp(second.app)
})
