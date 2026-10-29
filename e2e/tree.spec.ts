import { copyFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { launch, tempDir } from './app'

function sample(): string {
  const path = join(tempDir(), 'kowalscy.finsight')
  copyFileSync(join(__dirname, 'fixtures', 'kowalscy.finsight'), path)
  return path
}

test('tree canvas: select, context menu and root person', async () => {
  const { app, page } = await launch({ args: [sample()] })
  const canvas = page.getByRole('application', { name: 'Family tree' })
  await expect(canvas.getByRole('button', { name: /^Piotr Kowalski/ })).toBeVisible()
  await expect(canvas.locator('[data-person-id]')).toHaveCount(15)

  await canvas.getByRole('button', { name: /^Piotr Kowalski/ }).click()
  await expect(page.getByRole('heading', { name: 'Piotr Kowalski' })).toBeVisible()

  await canvas.getByRole('button', { name: /^Ewa Lis/ }).click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Set as root person' }).click()
  await expect(canvas.locator('[data-person-id="ewa"] [title="Root person"]')).toBeVisible()
  await expect(page.getByText('Unsaved changes')).toBeVisible()

  // Double-click focuses the editor.
  await canvas.getByRole('button', { name: /^Marek Lis/ }).dblclick()
  await expect(page.getByLabel('Given names')).toBeFocused()
  await expect(page.getByLabel('Given names')).toHaveValue('Marek')

  // Clicking the background clears the selection.
  await canvas.click({ position: { x: 20, y: 20 } })
  await expect(page.getByRole('heading', { name: 'Marek Lis' })).toBeHidden()
  await app.close()
})

test('canvas navigation: keyboard, zoom controls and minimap', async () => {
  const { app, page } = await launch({ args: [sample()] })
  const canvas = page.getByRole('application', { name: 'Family tree' })
  await expect(canvas.getByRole('button', { name: /^Jan Kowalski/ })).toBeVisible()
  await expect(page.getByRole('img', { name: 'Overview map' })).toBeVisible()

  // Arrow keys: first press selects the root person (Jan), ↑ goes to a parent, ↓ back to a child.
  await canvas.focus()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('heading', { name: 'Jan Kowalski' })).toBeVisible()
  await page.keyboard.press('ArrowUp')
  await expect(page.getByRole('heading', { name: /Maria Kowalska|Józef Kowalski/ })).toBeVisible()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('heading', { name: /Jan Kowalski|Zofia Kowalska/ })).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.getByLabel('Given names')).toBeFocused()

  // Zoom controls and keyboard shortcuts.
  const zoomLabel = page.getByTitle('Reset to 100%')
  await page.getByRole('button', { name: 'Zoom in' }).click()
  const zoomed = Number((await zoomLabel.innerText()).replace('%', ''))
  await zoomLabel.click()
  await expect(zoomLabel).toHaveText('100%')
  expect(zoomed).toBeGreaterThan(0)
  await canvas.focus()
  await page.keyboard.press('-')
  await expect(zoomLabel).toHaveText('80%')
  await page.keyboard.press('0')
  await expect(zoomLabel).toHaveText('100%')
  await page.getByRole('button', { name: 'Overview map' }).click()
  await expect(page.getByRole('img', { name: 'Overview map' })).toBeHidden()
  await app.close()
})

test('people list: diacritics-insensitive search, keyboard and selection', async () => {
  const { app, page } = await launch({ args: [sample()], language: 'pl' })
  const list = page.getByRole('listbox', { name: 'Osoby' })
  await expect(list.getByRole('option')).toHaveCount(15)

  await page.keyboard.press('Control+f')
  await expect(page.getByLabel('Szukaj')).toBeFocused()
  await page.keyboard.type('wisniewsk')
  await expect(list.getByRole('option')).toHaveCount(3)
  await expect(page.getByText('3 z 15')).toBeVisible()

  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('heading', { name: 'Anna Kowalska' })).toBeVisible()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('heading', { name: 'Helena Wiśniewska' })).toBeVisible()

  await page.getByLabel('Szukaj').fill('xyz')
  await expect(page.getByText('Nikt nie pasuje do „xyz”.')).toBeVisible()
  await page.getByLabel('Szukaj').press('Escape')
  await expect(list.getByRole('option')).toHaveCount(15)
  await app.close()
})
