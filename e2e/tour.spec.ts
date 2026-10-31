import { copyFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { closeApp, launch, tempDir } from './app'

test('the guided tour starts from the Help menu, works by keyboard and is remembered', async () => {
  const file = join(tempDir(), 'kowalscy.finsight')
  copyFileSync(join(__dirname, 'fixtures', 'kowalscy.finsight'), file)
  const { app, page, userData } = await launch({ args: [file] })
  await expect(page.locator('[data-person-id]').first()).toBeVisible()

  await app.evaluate(({ Menu }) => Menu.getApplicationMenu()!.getMenuItemById('tour')!.click())
  const step = page.getByRole('dialog', { name: 'Add people' })
  await expect(step).toBeVisible()
  await expect(step).toBeFocused()
  await expect(step).toContainText('Step 1 of 4')
  // The spotlight surrounds the Add person button.
  const button = (await page.locator('[data-tour="add-person"]').boundingBox())!
  const hole = await page.locator('[data-tour-overlay] > svg path').nth(1).getAttribute('d')
  const startX = Number(/^M([\d.]+)/.exec(hole!)![1])
  expect(Math.abs(startX - (button.x - 8 + 10))).toBeLessThan(1)

  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('dialog', { name: 'Choose what you see' })).toBeVisible()
  await page.keyboard.press('ArrowLeft')
  await expect(page.getByRole('dialog', { name: 'Add people' })).toBeVisible()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByRole('dialog', { name: 'Find anyone' })).toBeVisible()

  // The app stays usable during the tour.
  await page.locator('#workspace-search').fill('Lis')
  await expect(page.locator('[data-dimmed]').first()).toBeAttached()

  await page.keyboard.press('Escape')
  await expect(page.locator('[data-tour-overlay]')).toHaveCount(0)
  await expect
    .poll(() => JSON.parse(readFileSync(join(userData, 'settings.json'), 'utf8')).tours)
    .toEqual(['basics'])

  // Reset from the settings menu.
  await page.getByRole('button', { name: 'Settings' }).click()
  await page.getByRole('menuitem', { name: 'Reset tips and guided tours' }).click()
  await expect
    .poll(() => JSON.parse(readFileSync(join(userData, 'settings.json'), 'utf8')).tours)
    .toEqual([])
  await closeApp(app)
})
