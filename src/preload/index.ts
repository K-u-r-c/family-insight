import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import type { Settings } from '@core/settings'
import { IpcChannel, type FamilyInsightApi, type MenuAction } from '@shared/ipc'

function subscribe<T>(channel: string, listener: (value: T) => void): () => void {
  const handler = (_event: IpcRendererEvent, value: T): void => listener(value)
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.removeListener(channel, handler)
}

const api: FamilyInsightApi = {
  getAppInfo: () => ipcRenderer.invoke(IpcChannel.AppGetInfo),
  getSettings: () => ipcRenderer.invoke(IpcChannel.SettingsGet),
  updateSettings: (patch) => ipcRenderer.invoke(IpcChannel.SettingsUpdate, patch),
  onSettingsChanged: (listener) => subscribe<Settings>(IpcChannel.SettingsChanged, listener),
  onMenuAction: (listener) => subscribe<MenuAction>(IpcChannel.MenuAction, listener)
}

contextBridge.exposeInMainWorld('familyInsight', api)
