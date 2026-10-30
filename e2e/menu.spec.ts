import { expect, test, type ElectronApplication } from '@playwright/test'
import { closeApp, launch } from './app'

interface Item {
  label: string
  enabled: boolean
  submenu?: Item[]
}

function menuTree(app: ElectronApplication): Promise<Item[]> {
  return app.evaluate(({ Menu }) => {
    const map = (items: Electron.MenuItem[]): Item[] =>
      items
        .filter((i) => i.type !== 'separator')
        .map((i) => ({
          label: i.label,
          enabled: i.enabled,
          submenu: i.submenu ? map(i.submenu.items) : undefined
        }))
    return map(Menu.getApplicationMenu()!.items)
  })
}

const find = (items: Item[], path: string[]): Item | undefined => {
  let current: Item | undefined
  let list = items
  for (const label of path) {
    current = list.find((i) => i.label === label)
    list = current?.submenu ?? []
  }
  return current
}

test('native menu is localized, reflects state and drives the app', async () => {
  const { app, page } = await launch({ language: 'pl' })
  let menu = await menuTree(app)
  expect(menu.map((i) => i.label)).toEqual(
    expect.arrayContaining(['Plik', 'Edycja', 'Widok', 'Pomoc'])
  )
  expect(find(menu, ['Plik', 'Zapisz'])?.enabled).toBe(false)
  expect(find(menu, ['Plik', 'Eksportuj', 'Obraz (PNG, SVG, PDF)…'])?.enabled).toBe(false)

  await page.getByRole('button', { name: 'Wypróbuj przykładową rodzinę' }).click()
  await expect(page.getByRole('application')).toBeVisible()
  await expect.poll(async () => find(await menuTree(app), ['Plik', 'Zapisz'])?.enabled).toBe(true)

  // Switching the language from the menu updates the menu and the UI.
  await app.evaluate(({ Menu }) => {
    const view = Menu.getApplicationMenu()!.items.find((i) => i.label === 'Widok')!
    const language = view.submenu!.items.find((i) => i.label === 'Język')!
    language.submenu!.items.find((i) => i.label === 'English')!.click()
  })
  await expect(page.getByRole('button', { name: 'Add person' })).toBeVisible()
  menu = await menuTree(app)
  expect(menu.map((i) => i.label)).toEqual(expect.arrayContaining(['File', 'Edit', 'View', 'Help']))

  await app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0]!.webContents.send('menu:action', 'help:about')
  )
  await expect(page.getByText('Version 0.1.0')).toBeVisible()
  await page.getByRole('button', { name: 'Close', exact: true }).last().click()

  await app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0]!.webContents.send('menu:action', 'view:mode-ancestors')
  )
  await expect(page.getByRole('radio', { name: 'Ancestors' })).toHaveAttribute(
    'aria-checked',
    'true'
  )
  await closeApp(app)
})
