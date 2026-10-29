import { expect, test } from '@playwright/test'
import { launch } from './app'

test('add and edit a person, then undo', async () => {
  const { app, page } = await launch()
  await page.getByRole('button', { name: 'New family tree' }).click()
  await page.getByRole('button', { name: 'Add the first person' }).click()

  const given = page.getByLabel('Given names')
  await expect(given).toBeFocused()
  await given.fill('Anna')
  await page.getByLabel('Surname', { exact: true }).click()
  await page.getByLabel('Surname', { exact: true }).fill('Nowak')
  await page.getByLabel('Surname', { exact: true }).press('Enter')
  await expect(page.getByRole('heading', { name: 'Anna Nowak' })).toBeVisible()

  await page.getByRole('radio', { name: 'Female' }).click()
  await page.getByLabel('Date of birth').fill('~05.1890')
  await expect(page.getByText('about May 1890')).toBeVisible()
  await page.getByLabel('Date of birth').press('Enter')
  await expect(page.getByLabel('Date of birth')).toHaveValue('1890-05')
  await expect(page.getByLabel('Date precision').first()).toHaveValue('about')

  await page.getByLabel('Date of death').fill('1880')
  await page.getByLabel('Date of death').press('Enter')
  await expect(page.getByText('The date of death is before the date of birth.')).toBeVisible()

  await expect(page.getByText('1 person')).toBeVisible()
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(page.getByText('The date of death is before the date of birth.')).toBeHidden()
  await app.close()
})

test('delete a person with confirmation, then undo', async () => {
  const { app, page } = await launch({ language: 'pl' })
  await page.getByRole('button', { name: 'Nowe drzewo rodzinne' }).click()
  await page.getByRole('button', { name: 'Dodaj pierwszą osobę' }).click()
  await page.getByLabel('Imiona').fill('Anna')
  await page.getByLabel('Imiona').press('Enter')
  await page.getByRole('button', { name: 'Ojciec' }).click()
  await page.getByLabel('Imiona').fill('Jan')
  await page.getByLabel('Imiona').press('Enter')
  await page.getByRole('button', { name: 'Anna', exact: true }).click()
  await expect(page.getByText('2 osoby')).toBeVisible()

  // Delete key on the selection (focus outside text fields).
  await page.getByRole('heading', { name: 'Anna' }).click()
  await page.keyboard.press('Delete')
  await expect(page.getByText('Osoba Anna zostanie usunięta razem z 1 relacją.')).toBeVisible()
  await page.getByRole('button', { name: 'Anuluj' }).click()
  await expect(page.getByText('2 osoby')).toBeVisible()

  await page.getByRole('button', { name: 'Usuń osobę' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Usuń' }).click()
  await expect(page.getByText('1 osoba')).toBeVisible()
  await page
    .getByRole('region', { name: 'Powiadomienia' })
    .getByRole('button', { name: 'Cofnij' })
    .click()
  await expect(page.getByText('2 osoby')).toBeVisible()
  await app.close()
})
