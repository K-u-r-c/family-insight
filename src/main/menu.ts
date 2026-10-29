import { app, BrowserWindow, Menu, shell, type MenuItemConstructorOptions } from 'electron'
import { IpcChannel, type MenuAction } from '@shared/ipc'
import { t } from './i18n'

const PROJECT_URL = 'https://github.com/K-u-r-c/family-insight'

function send(action: MenuAction): void {
  BrowserWindow.getFocusedWindow()?.webContents.send(IpcChannel.MenuAction, action)
}

/** Builds the localized application menu. Call again after the language changes. */
export function buildMenu(): void {
  const isMac = process.platform === 'darwin'

  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: 'appMenu' as const }] : []),
    {
      label: t('menu.file'),
      submenu: [
        { label: t('menu.newTree'), accelerator: 'CmdOrCtrl+N', click: () => send('file:new') },
        { label: t('menu.open'), accelerator: 'CmdOrCtrl+O', click: () => send('file:open') },
        { type: 'separator' },
        { label: t('menu.save'), accelerator: 'CmdOrCtrl+S', click: () => send('file:save') },
        {
          label: t('menu.saveAs'),
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => send('file:save-as')
        },
        { type: 'separator' },
        { label: t('menu.importCsv'), click: () => send('file:import-csv') },
        { label: t('menu.exportCsv'), click: () => send('file:export-csv') },
        ...(isMac
          ? []
          : [{ type: 'separator' as const }, { label: t('menu.quit'), role: 'quit' as const }])
      ]
    },
    {
      label: t('menu.edit'),
      submenu: [
        { label: t('menu.undo'), accelerator: 'CmdOrCtrl+Z', click: () => send('edit:undo') },
        {
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
        { label: t('menu.about'), click: () => send('help:about') },
        { label: t('menu.website'), click: () => void shell.openExternal(PROJECT_URL) }
      ]
    }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
