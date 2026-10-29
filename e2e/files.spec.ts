import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { launch, mockDialogs, tempDir } from './app'

const SAMPLE = {
  format: 'family-insight',
  schemaVersion: 1,
  meta: {
    name: 'Kowalscy',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  persons: {
    p1: {
      id: 'p1',
      givenNames: 'Jan',
      surname: 'Kowalski',
      sex: 'male',
      createdAt: 'x',
      updatedAt: 'x'
    }
  },
  relationships: {}
}

test('new tree, save as, reopen from argv', async () => {
  const dir = tempDir()
  const target = join(dir, 'family.finsight')
  const { app, page } = await launch()
  await mockDialogs(app, { save: target })

  await page.getByRole('button', { name: 'New family tree' }).click()
  await expect(page.getByText('Your tree is empty')).toBeVisible()
  await app.evaluate(({ BrowserWindow }) => {
    BrowserWindow.getAllWindows()[0]!.webContents.send('menu:action', 'file:save-as')
  })
  await expect.poll(() => existsSync(target)).toBe(true)
  const saved = JSON.parse(readFileSync(target, 'utf8'))
  expect(saved).toMatchObject({
    format: 'family-insight',
    schemaVersion: 1,
    meta: { name: 'My family' }
  })
  await expect(page.getByText('All changes saved')).toBeVisible()
  await app.close()

  writeFileSync(target, JSON.stringify(SAMPLE))
  const second = await launch({ args: [target] })
  await expect(second.page.getByRole('button', { name: /Tree name: Kowalscy/ })).toBeVisible()
  await expect(second.page.getByText('1 person')).toBeVisible()
  await second.app.close()
})

test('friendly error for a damaged file', async () => {
  const dir = tempDir()
  const bad = join(dir, 'bad.finsight')
  writeFileSync(bad, '{ not json')
  const { app, page } = await launch({ language: 'pl' })
  await mockDialogs(app, { open: bad })
  await page.getByRole('button', { name: 'Otwórz drzewo…' }).click()
  await expect(
    page.getByText('Plik jest uszkodzony albo nie jest drzewem Family Insight.')
  ).toBeVisible()
  await app.close()
})

test('closing with unsaved changes asks first', async () => {
  const { app, page } = await launch()
  await page.getByRole('button', { name: 'New family tree' }).click()
  await page.getByRole('button', { name: /Tree name/ }).click()
  await page.keyboard.type('Renamed')
  await page.keyboard.press('Enter')
  await expect(page.getByText('Unsaved changes')).toBeVisible()
  // Answer "Cancel" (index 2): the window must stay open.
  await mockDialogs(app, { message: 2 })
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]!.close())
  await page.waitForTimeout(500)
  expect(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length)).toBe(1)
  // Answer "Don't save" (index 1): the window closes.
  await mockDialogs(app, { message: 1 })
  const closed = app.waitForEvent('close')
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]!.close())
  await closed
})
