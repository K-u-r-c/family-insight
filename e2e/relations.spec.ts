import { expect, test } from '@playwright/test'
import { closeApp, launch } from './app'

test('build a three-generation family from one person', async () => {
  const { app, page } = await launch()
  await page.getByRole('button', { name: 'New family tree' }).click()
  await page.getByRole('button', { name: 'Create' }).click()
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
  await page.getByTitle('Go to Jan').click()
  await page.getByRole('button', { name: 'Mother' }).click()
  await page.getByLabel('Given names').fill('Maria')
  await page.getByLabel('Given names').press('Enter')
  // The mother was partnered with the father automatically.
  await expect(page.getByTitle('Go to Józef').first()).toBeVisible()

  await page.getByTitle('Go to Jan').first().click()
  await page.getByRole('button', { name: 'Child', exact: true }).click()
  await page.getByLabel('Given names').fill('Ola')
  await page.getByLabel('Given names').press('Enter')

  await expect(page.getByText('4 people')).toBeVisible()
  await page.getByTitle('Go to Jan').click()
  await expect(page.getByTitle('Go to Józef')).toBeVisible()
  await expect(page.getByTitle('Go to Maria')).toBeVisible()
  await expect(page.getByTitle('Go to Ola')).toBeVisible()

  // Self-link is rejected with a friendly message (cycle): link Ola as Jan's parent.
  await page.getByRole('button', { name: 'Link an existing person' }).first().click()
  await page.getByRole('dialog').getByRole('option', { name: /Ola/ }).click()
  await expect(page.getByText('That would make someone their own ancestor.')).toBeVisible()
  await closeApp(app)
})

test('a new father of a woman gets the masculine surname and opens for editing', async () => {
  const { app, page } = await launch()
  await page.getByRole('button', { name: 'New family tree' }).click()
  await page.getByRole('button', { name: 'Create' }).click()
  await page.getByLabel('Given names').fill('Anna')
  await page.getByLabel('Surname', { exact: true }).fill('Kowalska')
  await page.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByRole('heading', { name: 'Anna Kowalska' })).toBeVisible()

  // The surname is prefilled, yet the editor still opens with the cursor in "Given names".
  await page.getByRole('button', { name: 'Father' }).click()
  await expect(page.getByLabel('Given names')).toBeFocused()
  await expect(page.getByLabel('Surname', { exact: true })).toHaveValue('Kowalski')
  await page.getByLabel('Given names').fill('Jan')
  await page.getByLabel('Given names').press('Enter')
  await page.getByRole('button', { name: 'Done' }).click()

  // With both biological parents present, another parent is added as a step-parent.
  await page.getByTitle('Go to Anna Kowalska').click()
  await page.getByRole('button', { name: 'Mother' }).click()
  await page.getByLabel('Given names').fill('Maria')
  await page.getByLabel('Given names').press('Enter')
  await page.getByTitle('Go to Anna Kowalska').first().click()
  await page.getByRole('button', { name: 'Parent', exact: true }).click()
  await expect(page.getByLabel('Given names')).toBeFocused()
  await expect(page.getByText('A person can have at most two biological parents')).toBeHidden()
  await closeApp(app)
})

test('a new partner can become the parent of children entered before them (#114)', async () => {
  const { app, page } = await launch()
  await page.getByRole('button', { name: 'New family tree' }).click()
  await page.getByRole('button', { name: 'Create' }).click()
  await page.getByLabel('Given names').fill('Maria')
  await page.getByLabel('Given names').press('Enter')

  // Two children while Maria has no partner: they get her as their only parent.
  for (const child of ['Ola', 'Piotr']) {
    await page.getByRole('button', { name: 'Child', exact: true }).click()
    await page.getByLabel('Given names').fill(child)
    await page.getByLabel('Given names').press('Enter')
    await page.getByTitle('Go to Maria').click()
  }
  await page.getByRole('button', { name: 'Partner', exact: true }).click()
  await page.getByLabel('Given names').fill('Jan')
  await page.getByLabel('Given names').press('Enter')

  // Jan's panel offers both children, ticked.
  const box = page.getByRole('group', { name: '2 children of Maria have no second parent.' })
  await expect(box).toBeVisible()
  await expect(box.getByRole('checkbox', { name: 'Ola' })).toBeChecked()
  await expect(box.getByRole('checkbox', { name: 'Piotr' })).toBeChecked()
  await box.getByRole('button', { name: 'Add Jan as parent' }).click()
  await expect(page.getByText('Linked 2 children to Jan')).toBeVisible()
  await expect(box).toBeHidden()

  // One family: the couple's line to each child (3 people), no line from Maria alone – the only
  // line between two people is the partner line.
  const lines = page.locator('path[data-people]')
  await expect(lines).toHaveCount(3)
  const people = await lines.evaluateAll((els) => els.map((e) => e.getAttribute('data-people')!))
  expect(people.map((p) => p.split(' ').length).sort()).toEqual([2, 3, 3])
  await page.getByTitle('Go to Ola').click()
  await expect(page.getByTitle('Go to Jan')).toBeVisible()
  await expect(page.getByTitle('Go to Maria')).toBeVisible()

  // One undo step removes both links.
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(page.getByTitle('Go to Jan')).toBeHidden()
  await page.getByTitle('Go to Maria').click()
  await page.getByTitle('Go to Piotr').click()
  await expect(page.getByTitle('Go to Jan')).toBeHidden()
  await closeApp(app)
})
