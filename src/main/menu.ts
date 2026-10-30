import { app, BrowserWindow, Menu, shell, type MenuItemConstructorOptions } from 'electron'
import { IpcChannel, type MenuAction, type MenuState } from '@shared/ipc'
import { requestOpen } from './files'
import { t } from './i18n'
import { getSettings, updateSettings } from './settings'

const PROJECT_URL = 'https://github.com/K-u-r-c/family-insight'

let state: MenuState = { hasDocument: false, canUndo: false, canRedo: false }

/** Items enabled only when a document is open. */
const DOCUMENT_ITEMS = ['save', 'save-as', 'export-csv']

function applyState(menu: Menu | null): void {
  if (!menu) return
  for (const id of DOCUMENT_ITEMS) {
    const item = menu.getMenuItemById(id)
    if (item) item.enabled = state.hasDocument
  }
  const undo = menu.getMenuItemById('undo')
  if (undo) undo.enabled = state.canUndo
  const redo = menu.getMenuItemById('redo')
  if (redo) redo.enabled = state.canRedo
}

export function setMenuState(next: MenuState): void {
  state = next
  applyState(Menu.getApplicationMenu())
}

function send(action: MenuAction): void {
  BrowserWindow.getFocusedWindow()?.webContents.send(IpcChannel.MenuAction, action)
}

function recentSubmenu(): MenuItemConstructorOptions[] {
  const recent = getSettings().recentFiles
  if (!recent.length) return [{ label: t('menu.noRecent'), enabled: false }]
  return [
    ...recent.map((file) => ({
      label: file.name,
      sublabel: file.path,
      click: () => requestOpen(file.path)
    })),
    { type: 'separator' as const },
    {
      label: t('menu.clearRecent'),
      click: () => {
        updateSettings({ recentFiles: [] })
        app.clearRecentDocuments()
      }
    }
  ]
}

/** Builds the localized application menu. Call again after the language or recent files change. */
export function buildMenu(): void {
  const isMac = process.platform === 'darwin'

  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: 'appMenu' as const }] : []),
    {
      label: t('menu.file'),
      submenu: [
        { label: t('menu.newTree'), accelerator: 'CmdOrCtrl+N', click: () => send('file:new') },
        { label: t('menu.open'), accelerator: 'CmdOrCtrl+O', click: () => send('file:open') },
        {
          label: t('menu.openRecent'),
          submenu: recentSubmenu()
        },
        { type: 'separator' },
        {
          id: 'save',
          label: t('menu.save'),
          accelerator: 'CmdOrCtrl+S',
          click: () => send('file:save')
        },
        {
          id: 'save-as',
          label: t('menu.saveAs'),
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => send('file:save-as')
        },
        { type: 'separator' },
        { label: t('menu.importCsv'), click: () => send('file:import-csv') },
        { id: 'export-csv', label: t('menu.exportCsv'), click: () => send('file:export-csv') },
        ...(isMac
          ? []
          : [{ type: 'separator' as const }, { label: t('menu.quit'), role: 'quit' as const }])
      ]
    },
    {
      label: t('menu.edit'),
      submenu: [
        {
          id: 'undo',
          label: t('menu.undo'),
          accelerator: 'CmdOrCtrl+Z',
          click: () => send('edit:undo')
        },
        {
          id: 'redo',
          label: t('menu.redo'),
          accelerator: isMac ? 'Cmd+Shift+Z' : 'Ctrl+Y',
          click: () => send('edit:redo')
        },
        { type: 'separator' },
        { label: t('menu.cut'), role: 'cut' },
        { label: t('menu.copy'), role: 'copy' },
        { label: t('menu.paste'), role: 'paste' },
        { label: t('menu.selectAll'), role: 'selectAll' }
      ]
    },
    {
      label: t('menu.view'),
      submenu: [
        ...(app.isPackaged
          ? []
          : [
              { label: t('menu.reload'), role: 'reload' as const },
              { label: t('menu.toggleDevTools'), role: 'toggleDevTools' as const },
              { type: 'separator' as const }
            ]),
        { label: t('menu.resetZoom'), role: 'resetZoom' },
        { label: t('menu.zoomIn'), role: 'zoomIn' },
        { label: t('menu.zoomOut'), role: 'zoomOut' },
        { type: 'separator' },
        { label: t('menu.toggleFullscreen'), role: 'togglefullscreen' }
      ]
    },
    {
      label: t('menu.help'),
      submenu: [
        { label: t('menu.csvFormat'), click: () => send('help:csv-format') },
        { label: t('menu.csvTemplate'), click: () => send('help:csv-template') },
        { type: 'separator' },
        { label: t('menu.about'), click: () => send('help:about') },
        { label: t('menu.website'), click: () => void shell.openExternal(PROJECT_URL) }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  applyState(menu)
  Menu.setApplicationMenu(menu)
}
