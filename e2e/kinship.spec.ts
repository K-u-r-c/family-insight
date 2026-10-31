import { expect, test } from '@playwright/test'
import { closeApp, launch } from './app'

const CASES = {
  en: {
    trySample: 'Try a sample family',
    title: 'Relationship calculator',
    reference: 'In relation to',
    swap: 'Swap people',
    showOnTree: 'Show on tree',
    hidePath: 'Hide path',
    rootLine: 'The grandson of Jan Kowalski',
    sentence: 'Michał Kowalski is the first cousin of Aleksandra Lis.',
    swapped: 'Aleksandra Lis is the first cousin of Michał Kowalski.'
  },
  pl: {
    trySample: 'Wypróbuj przykładową rodzinę',
    title: 'Kalkulator pokrewieństwa',
    reference: 'W stosunku do',
    swap: 'Zamień osoby',
    showOnTree: 'Pokaż na drzewie',
    hidePath: 'Ukryj ścieżkę',
    rootLine: 'Wnuk osoby Jan Kowalski',
    sentence: 'Michał Kowalski to brat wujeczny osoby Aleksandra Lis.',
    swapped: 'Aleksandra Lis to siostra cioteczna osoby Michał Kowalski.'
  }
}

for (const [language, s] of Object.entries(CASES)) {
  test(`relationship calculator: two cousins in the sample family (${language})`, async () => {
    const { app, page } = await launch({ language })
    await page.getByRole('button', { name: s.trySample }).click()
    const canvas = page.getByRole('application')
    await canvas.getByRole('button', { name: /^Michał Kowalski/ }).click()
    // The details show how the person is related to the root person.
    await expect(page.getByRole('button', { name: s.rootLine })).toBeVisible()

    await page.getByRole('button', { name: s.title }).click()
    const dialog = page.getByRole('dialog', { name: s.title })
    await dialog.getByRole('button', { name: s.reference }).click()
    const picker = page.getByRole('dialog', { name: s.reference })
    await picker.getByRole('searchbox').fill('Aleksandra')
    await picker.getByRole('option', { name: /Aleksandra Lis/ }).click()
    await expect(dialog.getByRole('status')).toHaveText(s.sentence)
    await dialog.getByRole('button', { name: s.swap }).click()
    await expect(dialog.getByRole('status')).toHaveText(s.swapped)

    // The path is highlighted on the tree and the other people fade.
    await dialog.getByRole('button', { name: s.showOnTree }).click()
    await expect(dialog).toBeHidden()
    const onPath = canvas.locator('[data-on-path]')
    await expect(onPath).toHaveCount(5)
    for (const name of ['Michał Kowalski', 'Piotr Kowalski', 'Jan Kowalski', 'Ewa Lis']) {
      await expect(onPath.filter({ hasText: name })).toHaveCount(1)
    }
    await expect(onPath.filter({ hasText: 'Aleksandra Lis' })).toHaveCount(1)
    await expect(canvas.locator('[data-dimmed]').first()).toBeVisible()
    await page.getByRole('button', { name: s.hidePath }).click()
    await expect(onPath).toHaveCount(0)
    await closeApp(app)
  })
}
