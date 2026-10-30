import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { importCsv } from '../src/core/io/csv/import'
import { displayName, getParents } from '../src/core/model/tree'
import type { FamilyTree } from '../src/core/model/types'
import { closeApp, launch, mockDialogs, tempDir } from './app'

const SAMPLE_PL = join(__dirname, '..', 'resources', 'samples', 'example-pl.csv')

/** Id-independent summary used to compare CSV files. */
function canonical(tree: FamilyTree): string[] {
  return Object.values(tree.persons)
    .map((p) =>
      [
        displayName(p),
        p.birth?.date?.value ?? '',
        getParents(tree, p.id)
          .map((x) => displayName(x))
          .sort()
          .join('+')
      ].join(' / ')
    )
    .sort()
}

test.describe('smoke', () => {
  test('1. launches in English and switches to Polish', async () => {
    const { app, page } = await launch({ language: 'en' })
    await expect(page.getByRole('heading', { name: 'Welcome to Family Insight' })).toBeVisible()
    const picker = page.getByRole('combobox', { name: 'Language' })
    // Every language is listed in its own name.
    await expect(picker.getByRole('option')).toHaveText(['English', 'Polski'])
    await picker.selectOption('pl')
    await expect(page.getByRole('heading', { name: 'Witaj w Family Insight' })).toBeVisible()
    await closeApp(app)
  })

  test('2–3, 5. build a family, undo/redo, save, reopen', async () => {
    const file = join(tempDir(), 'smoke.finsight')
    const { app, page, userData } = await launch()
    await page.getByRole('button', { name: 'New family tree' }).click()
    await page.getByRole('button', { name: 'Create' }).click()
    await page.getByLabel('Given names').fill('Anna')
    await page.getByLabel('Given names').press('Enter')
    for (const [role, name] of [
      ['Father', 'Jan'],
      ['Mother', 'Maria'],
      ['Child', 'Ola']
    ] as const) {
      await page.getByRole('application').getByRole('button', { name: /^Anna/ }).click()
      await page.getByRole('button', { name: role, exact: true }).click()
      await page.getByLabel('Given names').fill(name)
      await page.getByLabel('Given names').press('Enter')
    }
    const cards = page.getByRole('application').locator('[data-person-id]')
    await expect(cards).toHaveCount(4)

    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(page.getByRole('application').getByRole('button', { name: /^Ola/ })).toHaveCount(0)
    await page.getByRole('button', { name: 'Redo' }).click()
    await expect(page.getByRole('application').getByRole('button', { name: /^Ola/ })).toHaveCount(1)

    await mockDialogs(app, { save: file })
    await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0]!.webContents.send('menu:action', 'file:save')
    )
    await expect.poll(() => existsSync(file)).toBe(true)
    await closeApp(app)

    const again = await launch({ args: [file], userData })
    await expect(again.page.getByRole('application').locator('[data-person-id]')).toHaveCount(4)
    await closeApp(again.app)
  })

  test('4. import the Polish sample and export an equivalent CSV', async () => {
    const out = join(tempDir(), 'export.csv')
    const { app, page } = await launch({ language: 'pl' })
    await mockDialogs(app, { open: SAMPLE_PL, save: out })
    await page.getByRole('button', { name: 'Importuj z CSV…' }).click()
    await page.getByRole('button', { name: 'Importuj', exact: true }).click()
    await expect(page.getByRole('application').locator('[data-person-id]').first()).toBeVisible()
    await expect(page.getByText('25 osób', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'Plik' }).click()
    await page.getByRole('menuitem', { name: 'Eksportuj CSV…' }).click()
    await page.getByRole('button', { name: 'Eksportuj…' }).click()
    await expect.poll(() => existsSync(out)).toBe(true)
    const exported = importCsv(readFileSync(out, 'utf8')).tree
    const original = importCsv(readFileSync(SAMPLE_PL, 'utf8')).tree
    expect(canonical(exported)).toEqual(canonical(original))
    await closeApp(app)
  })
})
