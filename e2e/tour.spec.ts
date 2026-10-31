import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { closeApp, launch } from './app'

const seenTours = (userData: string): string[] =>
  JSON.parse(readFileSync(join(userData, 'settings.json'), 'utf8')).tours
const step = (page: Page, name: string) => page.getByRole('dialog', { name })

test('first launch: the guided tour builds the first tree hand in hand', async () => {
  const { app, page, userData } = await launch({ firstRun: true })
  await expect(page.getByRole('heading', { name: 'New here?' })).toBeVisible()
  await page.getByRole('button', { name: 'Show me around' }).click()

  // 1. Start a tree – the step points at New family tree and waits for a tree.
  await expect(step(page, 'Start your tree')).toBeFocused()
  await expect(step(page, 'Start your tree')).toContainText('Step 1 of 8')
  await expect(page.getByRole('heading', { name: 'New here?' })).toHaveCount(0)
  await page.getByRole('button', { name: 'New family tree' }).click()
  await page.getByRole('button', { name: 'Create' }).click()

  // 2. Add yourself – advances once someone has a name and the form is closed.
  await expect(step(page, 'Add yourself')).toBeVisible()
  await page.locator('#person-given-names').fill('Adam')
  await page.locator('#person-given-names').press('Tab')
  await page.getByRole('button', { name: 'Done' }).click()

  // 3. The details panel waits for Next; the arrow keys work inside the popover.
  await expect(step(page, 'Everything about a person')).toBeVisible()
  await step(page, 'Everything about a person').focus()
  await page.keyboard.press('ArrowRight')

  // 4. Add a parent – waits for a parent link and the closed form.
  await expect(step(page, 'Add a parent')).toBeVisible()
  await page.getByRole('button', { name: 'Father' }).click()
  await page.locator('#person-given-names').fill('Jan')
  await page.locator('#person-given-names').press('Tab')
  await page.getByRole('button', { name: 'Done' }).click()

  // 5–8. Moving around, views, search, saving.
  await expect(step(page, 'Move around the tree')).toBeVisible()
  // Going back to a step that is already done does not bounce forward.
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(step(page, 'Add a parent')).toBeVisible()
  await page.waitForTimeout(600)
  await expect(step(page, 'Add a parent')).toBeVisible()
  for (const name of ['Move around the tree', 'Choose what you see', 'Find anyone']) {
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(step(page, name)).toBeVisible()
  }
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(step(page, 'Keep it safe')).toContainText('Step 8 of 8')
  await page.getByRole('button', { name: 'Done' }).last().click()
  await expect(page.locator('[data-tour-overlay]')).toHaveCount(0)
  expect(await page.locator('[data-person-id]').count()).toBe(2)
  await expect.poll(() => seenTours(userData)).toEqual(['first-run'])
  await app.evaluate(({ dialog }) => {
    dialog.showMessageBox = (async () => ({ response: 1 })) as never
  })
  await closeApp(app)

  // Not offered again; Help → Show guided tour starts it again.
  const again = await launch({ userData })
  await expect(again.page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(again.page.getByRole('heading', { name: 'New here?' })).toHaveCount(0)
  await again.app.evaluate(({ Menu }) =>
    Menu.getApplicationMenu()!.getMenuItemById('tour')!.click()
  )
  await expect(step(again.page, 'Start your tree')).toBeVisible()
  await again.page.keyboard.press('Escape')
  await expect(again.page.locator('[data-tour-overlay]')).toHaveCount(0)
  await closeApp(again.app)
})

test('“Not now” hides the offer for good', async () => {
  const { app, page, userData } = await launch({ firstRun: true })
  await page.getByRole('button', { name: 'Not now' }).click()
  await expect(page.getByRole('heading', { name: 'New here?' })).toHaveCount(0)
  await expect.poll(() => seenTours(userData)).toEqual(['first-run'])
  await closeApp(app)
  const again = await launch({ userData })
  await expect(again.page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(again.page.getByRole('heading', { name: 'New here?' })).toHaveCount(0)
  await closeApp(again.app)
})
