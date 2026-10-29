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
