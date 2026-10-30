import { app, BrowserWindow, Menu, shell, type MenuItemConstructorOptions } from 'electron'
import { SUPPORTED_LANGUAGES, type Language } from '@shared/i18n'
import { IpcChannel, type MenuAction, type MenuState } from '@shared/ipc'
import { guideUrl, ISSUES_URL, PROJECT_URL } from '@shared/links'
import { requestOpen } from './files'
import { t } from './i18n'
import { getSettings, updateSettings } from './settings'

let state: MenuState = {
  hasDocument: false,
  canUndo: false,
  canRedo: false,
  hasSelection: false,
  viewMode: 'family'
}

/** Items enabled only when a document is open. */
const DOCUMENT_ITEMS = [
  'save',
  'save-as',
  'export-csv',
  'export-image',
  'print',
  'close',
  'add-person',
  'find',
  'sources',
  'places',
  'statistics',
  'fit',
  'zoom-in',
  'zoom-out',
  'zoom-reset',
  'mode-family',
  'mode-ancestors',
  'mode-descendants',
  'mode-hourglass'
]

function applyState(menu: Menu | null): void {
  if (!menu) return
  for (const id of DOCUMENT_ITEMS) {
    const item = menu.getMenuItemById(id)
    if (item) item.enabled = state.hasDocument
  }
  const set = (id: string, enabled: boolean): void => {
    const item = menu.getMenuItemById(id)
    if (item) item.enabled = enabled
  }
  set('undo', state.canUndo)
  set('redo', state.canRedo)
  set('delete', state.hasDocument && state.hasSelection)
  const mode = menu.getMenuItemById(`mode-${state.viewMode}`)
  if (mode) mode.checked = true
}

export function setMenuState(next: MenuState): void {
  const rebuild = next.viewMode !== state.viewMode
  state = next
  if (rebuild) buildMenu()
  else applyState(Menu.getApplicationMenu())
}

function send(action: MenuAction): void {
  const window = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  window?.webContents.send(IpcChannel.MenuAction, action)
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
  const settings = getSettings()
  const item = (
    id: string,
    label: string,
    action: MenuAction,
    accelerator?: string
  ): MenuItemConstructorOptions => ({
    id,
    label,
    accelerator,
    click: () => send(action)
  })

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { label: t('menu.about'), click: () => send('help:about') },
              { type: 'separator' },
              { label: t('menu.hide'), role: 'hide' },
              { label: t('menu.hideOthers'), role: 'hideOthers' },
              { label: t('menu.showAll'), role: 'unhide' },
              { type: 'separator' },
              { label: t('menu.quit'), role: 'quit' }
            ] as MenuItemConstructorOptions[]
          }
        ]
      : []),
    {
      label: t('menu.file'),
      submenu: [
        item('new', t('menu.newTree'), 'file:new', 'CmdOrCtrl+N'),
        item('open', t('menu.open'), 'file:open', 'CmdOrCtrl+O'),
        { label: t('menu.openRecent'), submenu: recentSubmenu() },
        { type: 'separator' },
        item('save', t('menu.save'), 'file:save', 'CmdOrCtrl+S'),
        item('save-as', t('menu.saveAs'), 'file:save-as', 'CmdOrCtrl+Shift+S'),
        { type: 'separator' },
        {
          label: t('menu.import'),
          submenu: [item('import-csv', t('menu.importCsvShort'), 'file:import-csv')]
        },
        {
          label: t('menu.export'),
          submenu: [
            item('export-csv', t('menu.exportCsvShort'), 'file:export-csv'),
            item('export-image', t('menu.exportImageShort'), 'file:export-image')
          ]
        },
        { type: 'separator' },
        item('print', t('menu.print'), 'file:print', 'CmdOrCtrl+P'),
        { type: 'separator' },
        item('close', t('menu.closeTree'), 'file:close', 'CmdOrCtrl+W'),
        ...(isMac
          ? []
          : [{ type: 'separator' as const }, { label: t('menu.quit'), role: 'quit' as const }])
      ]
    },
    {
      label: t('menu.edit'),
      submenu: [
        item('undo', t('menu.undo'), 'edit:undo', 'CmdOrCtrl+Z'),
        item('redo', t('menu.redo'), 'edit:redo', isMac ? 'Cmd+Shift+Z' : 'Ctrl+Y'),
        { type: 'separator' },
        { label: t('menu.cut'), role: 'cut' },
        { label: t('menu.copy'), role: 'copy' },
        { label: t('menu.paste'), role: 'paste' },
        { label: t('menu.selectAll'), role: 'selectAll' },
        { type: 'separator' },
        item('add-person', t('menu.addPerson'), 'edit:add-person', 'CmdOrCtrl+Shift+N'),
        item('delete', t('menu.deletePerson'), 'edit:delete'),
        { type: 'separator' },
        item('find', t('menu.find'), 'edit:find', 'CmdOrCtrl+F'),
        item('sources', t('menu.sources'), 'edit:sources'),
        item('places', t('menu.places'), 'edit:places')
      ]
    },
    {
      label: t('menu.view'),
      submenu: [
        ...(['family', 'ancestors', 'descendants', 'hourglass'] as const).map(
          (mode): MenuItemConstructorOptions => ({
            id: `mode-${mode}`,
            label: t(`view.${mode}`),
            type: 'radio',
            checked: state.viewMode === mode,
            click: () => send(`view:mode-${mode}`)
          })
        ),
        { type: 'separator' },
        item('fit', t('tree.fit'), 'view:fit'),
        item('zoom-in', t('tree.zoomIn'), 'view:zoom-in', 'CmdOrCtrl+='),
        item('zoom-out', t('tree.zoomOut'), 'view:zoom-out', 'CmdOrCtrl+-'),
        item('zoom-reset', t('tree.resetZoom'), 'view:zoom-reset', 'CmdOrCtrl+0'),
        { type: 'separator' },
        {
          label: t('menu.showSidebar'),
          type: 'checkbox',
          checked: settings.panels.sidebarOpen,
          click: () => send('view:toggle-sidebar')
        },
        {
          label: t('tree.minimap'),
          type: 'checkbox',
          checked: settings.showMinimap,
          click: () => updateSettings({ showMinimap: !getSettings().showMinimap })
        },
        item('statistics', t('stats.title'), 'view:statistics'),
        { type: 'separator' },
        {
          label: t('settings.theme'),
          submenu: (['system', 'light', 'dark'] as const).map((theme) => ({
            label: t(`theme.${theme}`),
            type: 'radio' as const,
            checked: settings.theme === theme,
            click: () => updateSettings({ theme })
          }))
        },
        {
          label: t('settings.language'),
          submenu: SUPPORTED_LANGUAGES.map((language: Language) => ({
            label: t(`language.${language}`),
            type: 'radio' as const,
            checked: settings.language === language,
            click: () => updateSettings({ language, csvDelimiter: language === 'pl' ? ';' : ',' })
          }))
        },
        { label: t('menu.toggleFullscreen'), role: 'togglefullscreen' },
        ...(app.isPackaged
          ? []
          : [
              { type: 'separator' as const },
              { label: t('menu.reload'), role: 'reload' as const },
              { label: t('menu.toggleDevTools'), role: 'toggleDevTools' as const }
            ])
      ]
    },
    {
      label: t('menu.help'),
      submenu: [
        {
          id: 'user-guide',
          label: t('menu.userGuide'),
          click: () => void shell.openExternal(guideUrl(getSettings().language))
        },
        item('shortcuts', t('menu.shortcuts'), 'help:shortcuts', 'F1'),
        { type: 'separator' },
        { label: t('menu.csvFormat'), click: () => send('help:csv-format') },
        { label: t('menu.csvTemplate'), click: () => send('help:csv-template') },
        { type: 'separator' },
        { label: t('menu.reportBug'), click: () => void shell.openExternal(ISSUES_URL) },
        { label: t('menu.website'), click: () => void shell.openExternal(PROJECT_URL) },
        ...(isMac
          ? []
          : [
              { type: 'separator' as const },
              { label: t('menu.about'), click: () => send('help:about') }
            ])
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  applyState(menu)
  Menu.setApplicationMenu(menu)
}
