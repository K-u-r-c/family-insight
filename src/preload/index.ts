import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { IpcChannel, type MenuAction, type FamilyInsightApi } from '@shared/ipc'

const api: FamilyInsightApi = {
  getAppInfo: () => ipcRenderer.invoke(IpcChannel.AppGetInfo),
  setLanguage: (language) => ipcRenderer.invoke(IpcChannel.AppSetLanguage, language),
  onMenuAction: (listener) => {
    const handler = (_event: IpcRendererEvent, action: MenuAction): void => listener(action)
    ipcRenderer.on(IpcChannel.MenuAction, handler)
    return () => ipcRenderer.removeListener(IpcChannel.MenuAction, handler)
  }
}

contextBridge.exposeInMainWorld('familyInsight', api)
