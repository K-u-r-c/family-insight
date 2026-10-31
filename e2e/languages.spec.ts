import { expect, test } from '@playwright/test'
import { closeApp, launch } from './app'

/** Texts every language must show: the welcome heading and the native menu bar. */
const LANGUAGES: { code: string; name: string; welcome: string; menu: string[] }[] = [
  {
    code: 'de',
    name: 'Deutsch',
    welcome: 'Willkommen bei Family Insight',
    menu: ['Datei', 'Bearbeiten', 'Ansicht', 'Hilfe']
  },
  {
    code: 'fr',
    name: 'Français',
    welcome: 'Bienvenue dans Family Insight',
    menu: ['Fichier', 'Édition', 'Affichage', 'Aide']
  }
]

for (const language of LANGUAGES) {
  test(`switches to ${language.name}: welcome screen and menu bar`, async () => {
    const { app, page } = await launch({ language: 'en' })
    await page.getByRole('combobox', { name: 'Language' }).selectOption(language.code)
    await expect(page.getByRole('heading', { name: language.welcome })).toBeVisible()
    await expect
      .poll(() => app.evaluate(({ Menu }) => Menu.getApplicationMenu()!.items.map((i) => i.label)))
      .toEqual(expect.arrayContaining(language.menu))
    await closeApp(app)
  })
}
