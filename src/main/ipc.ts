import { app, BrowserWindow, ipcMain } from 'electron'
import { IpcChannel, type AppInfo } from '@shared/ipc'
import { setMenuState } from './menu'
import { getSettings, updateSettings } from './settings'

export function registerIpcHandlers(): void {
  ipcMain.handle(IpcChannel.AppGetInfo, (): AppInfo => ({
    name: app.getName(),
    version: app.getVersion(),
    platform: process.platform,
    locale: app.getLocale()
  }))

  ipcMain.handle(IpcChannel.SettingsGet, () => getSettings())
  // The patch is untrusted: updateSettings sanitises every field.
  ipcMain.handle(IpcChannel.SettingsUpdate, (_event, patch: unknown) => updateSettings(patch))

  ipcMain.handle(IpcChannel.MenuSetState, (_event, state: unknown) => {
    const s = (typeof state === 'object' && state !== null ? state : {}) as Record<string, unknown>
    setMenuState({
      hasDocument: s.hasDocument === true,
      canUndo: s.canUndo === true,
      canRedo: s.canRedo === true
    })
  })

  ipcMain.handle(IpcChannel.WindowSetDocumentEdited, (event, edited: unknown) => {
    BrowserWindow.fromWebContents(event.sender)?.setDocumentEdited(edited === true)
  })
}
