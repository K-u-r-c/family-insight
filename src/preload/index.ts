import { contextBridge, ipcRenderer, webUtils, type IpcRendererEvent } from 'electron'
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
  setDocumentEdited: (edited) => ipcRenderer.invoke(IpcChannel.WindowSetDocumentEdited, edited),
  openFileDialog: (kind) => ipcRenderer.invoke(IpcChannel.FileOpenDialog, kind),
  readFile: (path) => ipcRenderer.invoke(IpcChannel.FileRead, path),
  saveFileDialog: (kind, name) => ipcRenderer.invoke(IpcChannel.FileSaveDialog, kind, name),
  writeFile: (path, content) => ipcRenderer.invoke(IpcChannel.FileWrite, path, content),
  showInFolder: (path) => ipcRenderer.invoke(IpcChannel.FileShowInFolder, path),
  takePendingFile: () => ipcRenderer.invoke(IpcChannel.FileTakePending),
  onOpenFileRequest: (listener) => subscribe<string>(IpcChannel.FileOpenRequest, listener),
  askUnsaved: (name) => ipcRenderer.invoke(IpcChannel.DialogUnsaved, name),
  onCloseRequest: (listener) => subscribe<void>(IpcChannel.WindowCloseRequest, listener),
  closeWindow: () => ipcRenderer.invoke(IpcChannel.WindowClose),
  getPathForFile: (file) => webUtils.getPathForFile(file),
  setMenuState: (state) => ipcRenderer.invoke(IpcChannel.MenuSetState, state),
  onMenuAction: (listener) => subscribe<MenuAction>(IpcChannel.MenuAction, listener)
}

contextBridge.exposeInMainWorld('familyInsight', api)
