import { expect, test } from '@playwright/test'
import { launch } from './app'

test('build a three-generation family from one person', async () => {
  const { app, page } = await launch()
  await page.getByRole('button', { name: 'New family tree' }).click()
  await page.getByRole('button', { name: 'Add the first person' }).click()
  const given = page.getByLabel('Given names')

  await given.fill('Jan')
  await given.press('Enter')
  await expect(page.getByRole('heading', { name: 'Jan' })).toBeVisible()

  // Father: one click + typing; surname is prefilled from the child.
  await page.getByRole('button', { name: 'Father' }).click()
  await expect(page.getByLabel('Given names')).toBeFocused()
  await page.getByLabel('Given names').fill('Józef')
  await page.getByLabel('Given names').press('Enter')
  await expect(page.getByRole('heading', { name: 'Józef' })).toBeVisible()

  // Back to Jan via the Children list, then add the mother.
  await page.getByRole('button', { name: 'Jan', exact: true }).click()
  await page.getByRole('button', { name: 'Mother' }).click()
  await page.getByLabel('Given names').fill('Maria')
  await page.getByLabel('Given names').press('Enter')
  // The mother was partnered with the father automatically.
  await expect(page.getByRole('button', { name: 'Józef', exact: true }).first()).toBeVisible()

  await page.getByRole('button', { name: 'Jan', exact: true }).first().click()
  await page.getByRole('button', { name: 'Child', exact: true }).click()
  await page.getByLabel('Given names').fill('Ola')
  await page.getByLabel('Given names').press('Enter')

  await expect(page.getByText('4 people')).toBeVisible()
  await page.getByRole('button', { name: 'Jan', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Józef', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Maria', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Ola', exact: true })).toBeVisible()

  // Self-link is rejected with a friendly message (cycle): link Ola as Jan's parent.
  await page.getByRole('button', { name: 'Link an existing person' }).first().click()
  await page.getByRole('option', { name: /Ola/ }).click()
  await expect(page.getByText('That would make someone their own ancestor.')).toBeVisible()
  await app.close()
})
