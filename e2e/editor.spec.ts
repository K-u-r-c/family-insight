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
