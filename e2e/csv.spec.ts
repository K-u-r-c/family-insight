import { copyFileSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { launch, mockDialogs, tempDir } from './app'

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
  await app.close()
})
