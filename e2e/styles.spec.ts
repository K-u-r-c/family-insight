import { copyFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { closeApp, launch, tempDir } from './app'

const style = (page: import('@playwright/test').Page): Promise<string | undefined> =>
  page.evaluate(() => document.documentElement.dataset.style)
const headingFont = (page: import('@playwright/test').Page): Promise<string> =>
  page.evaluate(() => getComputedStyle(document.querySelector('h1')!).fontFamily)

test('the style switches from the View menu and the settings menu, and is remembered', async () => {
  const { app, page, userData } = await launch()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect(await style(page)).toBeUndefined()
  expect(await headingFont(page)).toContain('Source Serif')

  // View → Style → Tapestry (native menu).
  await app.evaluate(({ Menu }) =>
    Menu.getApplicationMenu()!.getMenuItemById('style-tapestry')!.click()
  )
  await expect.poll(() => style(page)).toBe('tapestry')
  expect(await headingFont(page)).toContain('Cormorant')
  await expect
    .poll(() => JSON.parse(readFileSync(join(userData, 'settings.json'), 'utf8')).style)
    .toBe('tapestry')
  const checked = await app.evaluate(
    ({ Menu }) => Menu.getApplicationMenu()!.getMenuItemById('style-tapestry')!.checked
  )
  expect(checked).toBe(true)

  // It survives a restart.
  await closeApp(app)
  const file = join(tempDir(), 'kowalscy.finsight')
  copyFileSync(join(__dirname, 'fixtures', 'kowalscy.finsight'), file)
  const again = await launch({ userData, args: [file] })
  await expect(again.page.locator('[data-person-id]').first()).toBeVisible()
  expect(await style(again.page)).toBe('tapestry')

  // Back to Modern from the gear menu in the workspace.
  await again.page.getByRole('button', { name: 'Settings' }).click()
  await again.page.getByRole('menuitemradio', { name: 'Modern' }).click()
  await expect.poll(() => style(again.page)).toBeUndefined()
  await closeApp(again.app)
})
