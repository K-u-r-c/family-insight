import { join } from 'node:path'
import { app, BrowserWindow, shell } from 'electron'
import { resolveLanguage } from '@shared/i18n'
import { initMainI18n, setMainLanguage } from './i18n'
import { registerIpcHandlers } from './ipc'
import { buildMenu } from './menu'
import { flushSettings, loadSettings, onSettingsChanged } from './settings'
import { restoredBounds, trackWindowState, wasMaximized } from './windowState'

function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    ...restoredBounds(),
    minWidth: 900,
    minHeight: 600,
    show: false,
    title: 'Family Insight',
    backgroundColor: '#f6f4f0',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  window.once('ready-to-show', () => {
    if (wasMaximized()) window.maximize()
    window.show()
  })
  trackWindowState(window)

  // Open external links in the default browser, never inside the app.
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url)
    return { action: 'deny' }
  })
  window.webContents.on('will-navigate', (event, url) => {
    if (url !== window.webContents.getURL()) event.preventDefault()
  })

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    void window.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return window
}

const hasLock = app.requestSingleInstanceLock()
if (!hasLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const [window] = BrowserWindow.getAllWindows()
    if (window) {
      if (window.isMinimized()) window.restore()
      window.focus()
    }
  })

  void app.whenReady().then(async () => {
    const settings = await loadSettings()
    await initMainI18n(resolveLanguage(settings.language))
    onSettingsChanged((next, previous) => {
      if (next.language !== previous.language) {
        void setMainLanguage(resolveLanguage(next.language)).then(buildMenu)
      }
    })
    registerIpcHandlers()
    buildMenu()
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

  app.on('will-quit', (event) => {
    event.preventDefault()
    void flushSettings().finally(() => app.exit())
  })
}
