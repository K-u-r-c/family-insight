import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { closeApp, launch, mockDialogs, tempDir } from './app'

function sample(): string {
  const path = join(tempDir(), 'kowalscy.finsight')
  copyFileSync(join(__dirname, 'fixtures', 'kowalscy.finsight'), path)
  return path
}

test('export CSV with semicolons and Polish headers', async () => {
  const target = join(tempDir(), 'export.csv')
  const { app, page } = await launch({ args: [sample()], language: 'pl' })
  await mockDialogs(app, { save: target })
  await page.getByRole('button', { name: 'Plik' }).click()
  await page.getByRole('menuitem', { name: 'Eksportuj CSV…' }).click()
  await page.getByRole('radio', { name: 'Średnik ( ; )' }).click()
  await page.getByRole('radio', { name: 'Polski' }).click()
  await page.getByRole('button', { name: 'Eksportuj…' }).click()
  await expect(page.getByText('Wyeksportowano 15 osób')).toBeVisible()
  await expect.poll(() => existsSync(target)).toBe(true)
  const csv = readFileSync(target, 'utf8')
  expect(csv.charCodeAt(0)).toBe(0xfeff)
  const lines = csv.slice(1).split('\r\n')
  expect(lines[0]).toBe(
    'id;imiona;nazwisko;nazwisko_rodowe;plec;data_urodzenia;miejsce_urodzenia;data_smierci;miejsce_smierci;zyje;ojciec_id;matka_id;partnerzy_id;notatki'
  )
  expect(lines).toHaveLength(17)
  expect(csv).toContain(';Józef;Kowalski;;mężczyzna;~1898;Kraków;1971-03-02;Łódź;')
  await closeApp(app)
})

test('import CSV: preview, blocking errors, then a valid Polish file', async () => {
  const dir = tempDir()
  const bad = join(dir, 'bad.csv')
  const good = join(dir, 'rodzina.csv')
  writeFileSync(bad, 'id,given_names,surname,father_id\np1,Jan,K,ghost\n')
  writeFileSync(
    good,
    '﻿id;imiona;nazwisko;płeć;data_urodzenia;ojciec_id;matka_id;partnerzy_id;rozmiar_buta\r\n' +
      'a;Łucja;Żółć;kobieta;ok. 1900;;;b;38\r\n' +
      'b;Jerzy;Żółć;mężczyzna;1898;;;a;44\r\n' +
      'c;Ewa;Żółć;K;12.05.1925;b;a;;37\r\n'
  )
  const { app, page } = await launch({ language: 'pl' })
  await mockDialogs(app, { open: bad })
  await page.getByRole('button', { name: 'Importuj z CSV…' }).click()
  await expect(page.getByText('1 problem do poprawienia')).toBeVisible()
  await expect(page.getByText('Odwołanie do „ghost”, ale nie ma wiersza z takim id.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Importuj', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Anuluj' }).click()

  await mockDialogs(app, { open: good })
  await page.getByRole('button', { name: 'Importuj z CSV…' }).click()
  await expect(page.getByText('Wykryto: separator średnik ( ; ), kodowanie UTF-8.')).toBeVisible()
  await expect(page.getByText('Osoby: 3, relacje: 3')).toBeVisible()
  await expect(
    page.getByText('Kolumna „rozmiar_buta” nie została rozpoznana i zostanie pominięta.')
  ).toBeVisible()
  await page.getByRole('button', { name: 'Importuj', exact: true }).click()
  await expect(page.getByText('Zaimportowano 3 osoby')).toBeVisible()
  await expect(page.getByRole('application').locator('[data-person-id]')).toHaveCount(3)
  await expect(page.getByText('Niezapisane zmiany')).toBeVisible()

  // Merge the same file into the current tree.
  await page.getByRole('button', { name: 'Plik' }).click()
  await page.getByRole('menuitem', { name: 'Importuj CSV…' }).click()
  await page.getByRole('radio', { name: 'Bieżącego drzewa' }).click()
  await page.getByRole('button', { name: 'Importuj', exact: true }).click()
  await expect(page.getByRole('application').locator('[data-person-id]')).toHaveCount(6)
  await page.getByRole('button', { name: 'Cofnij' }).first().click()
  await expect(page.getByRole('application').locator('[data-person-id]')).toHaveCount(3)
  await closeApp(app)
})
