import { app, ipcMain } from 'electron'
import { IpcChannel, type AppInfo } from '@shared/ipc'
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
}
