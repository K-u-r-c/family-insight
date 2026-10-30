import { copyFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { closeApp, launch, tempDir } from './app'

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
  await closeApp(app)
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
  await closeApp(app)
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
  await closeApp(app)
})

test('person details: age, timeline and edit mode', async () => {
  const { app, page } = await launch({ args: [sample()], language: 'pl' })
  await page
    .getByRole('application')
    .getByRole('button', { name: /^Jan Kowalski/ })
    .click()
  await expect(page.getByText('1925 – 2001 · zm. w wieku 75 lat')).toBeVisible()
  await expect(page.getByText('Ślub z:')).toBeVisible()
  await expect(page.getByText('Narodziny dziecka:').first()).toBeVisible()
  await expect(page.getByText('Inżynier, budował mosty na Wiśle.', { exact: false })).toBeVisible()
  await expect(page.getByLabel('Imiona')).toBeHidden()

  await page.getByRole('button', { name: 'Edytuj', exact: true }).click()
  await expect(page.getByLabel('Imiona')).toHaveValue('Jan')
  await page.getByRole('button', { name: 'Gotowe' }).click()
  await expect(page.getByLabel('Imiona')).toBeHidden()

  // Clicking a person in the timeline navigates there.
  await page.getByRole('button', { name: 'Anna Kowalska', exact: true }).first().click()
  await expect(page.getByRole('heading', { name: 'Anna Kowalska' })).toBeVisible()
  await closeApp(app)
})

test('view modes, collapsing and saving the view with the file', async () => {
  const file = sample()
  const { app, page } = await launch({ args: [file] })
  const canvas = page.getByRole('application', { name: 'Family tree' })
  await expect(canvas.locator('[data-person-id]')).toHaveCount(15)

  // Collapse Jan's branch (root): his descendants disappear.
  await canvas.locator('[data-person-id="jan"]').hover()
  await page.getByRole('button', { name: 'Hide descendants of Jan Kowalski' }).click()
  await expect(canvas.locator('[data-person-id="piotr"]')).toHaveCount(0)
  await page.getByRole('button', { name: 'Show descendants of Jan Kowalski' }).click()
  await expect(canvas.locator('[data-person-id="piotr"]')).toHaveCount(1)

  await page.getByRole('radio', { name: 'Ancestors' }).click()
  await expect(canvas.locator('[data-person-id]')).toHaveCount(3)
  await page.getByRole('radio', { name: 'Descendants' }).click()
  await page.getByLabel('Generations to show').selectOption('1')
  await expect(canvas.locator('[data-person-id]')).toHaveCount(7)

  await app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0]!.webContents.send('menu:action', 'file:save')
  )
  await expect(page.getByText('All changes saved')).toBeVisible()
  await closeApp(app)

  const again = await launch({ args: [file] })
  await expect(again.page.getByRole('radio', { name: 'Descendants' })).toHaveAttribute(
    'aria-checked',
    'true'
  )
  await expect(again.page.getByLabel('Generations to show')).toHaveValue('1')
  await closeApp(again.app)
})
