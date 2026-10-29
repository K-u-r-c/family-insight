import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { closeApp, launch, mockDialogs, tempDir } from './app'

test('new tree in two clicks, sample family and recent files', async () => {
  const dir = tempDir()
  const saved = join(dir, 'Nowakowie.finsight')
  const first = await launch({ language: 'pl' })
  let page = first.page

  // Click 1: new tree, click 2: create → editing the first person.
  await page.getByRole('button', { name: 'Nowe drzewo rodzinne' }).click()
  await page.getByLabel('Nazwa drzewa').fill('Nowakowie')
  await page.getByRole('button', { name: 'Utwórz' }).click()
  await expect(page.getByLabel('Imiona')).toBeFocused()
  await page.keyboard.type('Adam')
  await page.keyboard.press('Enter')
  await mockDialogs(first.app, { save: saved })
  // Native menu accelerators are not triggered by synthetic key presses; send the menu action.
  await first.app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0]!.webContents.send('menu:action', 'file:save')
  )
  await expect(page.getByText('Wszystkie zmiany zapisane')).toBeVisible()
  await closeApp(first.app)

  // The recent list remembers the file; a missing file is shown as such.
  const second = await launch({ userData: first.userData })
  page = second.page
  await expect(page.getByRole('button', { name: /^Nowakowie/ })).toBeVisible()
  await closeApp(second.app)
  rmSync(saved)
  const third = await launch({ userData: first.userData })
  page = third.page
  await expect(page.getByText('Nie znaleziono pliku')).toBeVisible()
  await page.getByRole('button', { name: 'Usuń Nowakowie z ostatnich plików' }).click()
  await expect(page.getByText('Ostatnie')).toBeHidden()

  await page.getByRole('button', { name: 'Wypróbuj przykładową rodzinę' }).click()
  await expect(page.getByRole('button', { name: /Przykładowa rodzina/ })).toBeVisible()
  await expect(page.getByRole('application').locator('[data-person-id]')).toHaveCount(25)
  await closeApp(third.app)
})
