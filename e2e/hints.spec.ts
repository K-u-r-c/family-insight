import { copyFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { closeApp, launch, tempDir } from './app'

const settingsOf = (userData: string): { tips: string[]; showTips: boolean } =>
  JSON.parse(readFileSync(join(userData, 'settings.json'), 'utf8'))

test('one-time hints: the map and the relationship calculator, one per start', async () => {
  const file = join(tempDir(), 'kowalscy.finsight')
  copyFileSync(join(__dirname, 'fixtures', 'kowalscy.finsight'), file)
  const { app, page, userData } = await launch({ args: [file], tips: true })
  await expect(page.locator('[data-person-id]').first()).toBeVisible()

  // First the map: its hint appears in the side panel.
  await page.getByRole('radio', { name: 'Map' }).click()
  const mapHint = page.getByRole('note', { name: 'Tip' })
  await expect(mapHint).toContainText('Each place with coordinates is a marker')
  await expect.poll(() => settingsOf(userData).tips).toEqual(['map'])
  await page.getByRole('button', { name: 'Got it' }).click()
  await expect(mapHint).toHaveCount(0)
  await page.getByRole('radio', { name: 'Tree' }).click()

  // The calculator in the same session: no second hint.
  await page.getByRole('button', { name: 'Relationship calculator' }).click()
  const dialog = page.getByRole('dialog', { name: 'Relationship calculator' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('note')).toHaveCount(0)
  await page.keyboard.press('Escape')
  await closeApp(app)

  // Next start: the calculator shows its hint once; the map stays quiet.
  const again = await launch({ args: [file], userData })
  await expect(again.page.locator('[data-person-id]').first()).toBeVisible()
  await again.page.getByRole('button', { name: 'Relationship calculator' }).click()
  const second = again.page.getByRole('dialog', { name: 'Relationship calculator' })
  await expect(second.getByRole('note', { name: 'Tip' })).toContainText('Pick two people')
  await again.page.keyboard.press('Escape')
  await again.page.getByRole('button', { name: 'Relationship calculator' }).click()
  await expect(second.getByRole('note')).toHaveCount(0)
  await again.page.keyboard.press('Escape')
  await again.page.getByRole('radio', { name: 'Map' }).click()
  await expect(again.page.getByRole('note')).toHaveCount(0)
  await expect.poll(() => settingsOf(userData).tips).toEqual(['map', 'kinship'])
  await closeApp(again.app)
})

test('the first switch to Tapestry shows a hint; “Don’t show tips” turns tips off', async () => {
  const file = join(tempDir(), 'kowalscy.finsight')
  copyFileSync(join(__dirname, 'fixtures', 'kowalscy.finsight'), file)
  const { app, page, userData } = await launch({ args: [file], tips: true })
  await expect(page.locator('[data-person-id]').first()).toBeVisible()
  await app.evaluate(({ Menu }) =>
    Menu.getApplicationMenu()!.getMenuItemById('style-tapestry')!.click()
  )
  const hint = page.getByRole('dialog', { name: 'The Tapestry style' })
  await expect(hint).toBeVisible()
  await expect(hint).toContainText('Tip')
  await expect(hint.getByRole('button', { name: 'Back' })).toHaveCount(0)
  await hint.getByRole('button', { name: 'Don’t show tips' }).click()
  await expect(hint).toHaveCount(0)
  await expect.poll(() => settingsOf(userData).showTips).toBe(false)

  // Settings: the switch and the reset bring tips back.
  await page.getByRole('button', { name: 'Settings' }).click()
  await expect(page.getByRole('menuitemradio', { name: 'Show tips' })).toHaveAttribute(
    'aria-checked',
    'false'
  )
  await page.getByRole('menuitem', { name: 'Reset tips and guided tours' }).click()
  await expect.poll(() => settingsOf(userData)).toMatchObject({ showTips: true, tips: [] })
  await closeApp(app)
})
