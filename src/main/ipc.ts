import { app, ipcMain } from 'electron'
import { isLanguage } from '@shared/i18n'
import { IpcChannel, type AppInfo } from '@shared/ipc'
import { setMainLanguage } from './i18n'
import { buildMenu } from './menu'

export function registerIpcHandlers(): void {
  ipcMain.handle(IpcChannel.AppGetInfo, (): AppInfo => ({
    name: app.getName(),
    version: app.getVersion(),
    platform: process.platform,
    locale: app.getLocale()
  }))

  ipcMain.handle(IpcChannel.AppSetLanguage, async (_event, language: unknown) => {
    // Never trust renderer input: validate everything crossing the IPC boundary.
    if (!isLanguage(language)) throw new Error(`Unsupported language: ${String(language)}`)
    await setMainLanguage(language)
    buildMenu()
  })
}
