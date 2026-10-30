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
  openFileDialog: (format) => ipcRenderer.invoke(IpcChannel.FileOpenDialog, format),
  readFile: (path) => ipcRenderer.invoke(IpcChannel.FileRead, path),
  saveFileDialog: (format, name) => ipcRenderer.invoke(IpcChannel.FileSaveDialog, format, name),
  writeFile: (path, content, options) =>
    ipcRenderer.invoke(IpcChannel.FileWrite, path, content, options),
  writeDocument: (path, json, library, options) =>
    ipcRenderer.invoke(IpcChannel.FileWriteDocument, path, json, library, options),
  showInFolder: (path) => ipcRenderer.invoke(IpcChannel.FileShowInFolder, path),
  filesExist: (paths) => ipcRenderer.invoke(IpcChannel.FileExists, paths),
  pickPhoto: () => ipcRenderer.invoke(IpcChannel.PhotoPick),
  createMediaLibrary: () => ipcRenderer.invoke(IpcChannel.MediaCreateLibrary),
  releaseMediaLibrary: (library) => ipcRenderer.invoke(IpcChannel.MediaReleaseLibrary, library),
  importMedia: (library, multiple) => ipcRenderer.invoke(IpcChannel.MediaImport, library, multiple),
  putMedia: (library, data, fileName) =>
    ipcRenderer.invoke(IpcChannel.MediaPut, library, data, fileName),
  getMedia: (library, hash) => ipcRenderer.invoke(IpcChannel.MediaGet, library, hash),
  getThumbnails: (library) => ipcRenderer.invoke(IpcChannel.MediaThumbs, library),
  listMediaHashes: (library) => ipcRenderer.invoke(IpcChannel.MediaHashes, library),
  putThumbnail: (library, hash, data) =>
    ipcRenderer.invoke(IpcChannel.MediaPutThumb, library, hash, data),
  exportMedia: (library, hash, fileName) =>
    ipcRenderer.invoke(IpcChannel.MediaExport, library, hash, fileName),
  openMediaExternally: (library, hash, fileName) =>
    ipcRenderer.invoke(IpcChannel.MediaOpenExternal, library, hash, fileName),
  lookupPlace: (requestId, query) => ipcRenderer.invoke(IpcChannel.PlaceLookup, requestId, query),
  cancelPlaceLookup: (requestId) => ipcRenderer.invoke(IpcChannel.PlaceLookupCancel, requestId),
  exportPdf: (svg, options, path) => ipcRenderer.invoke(IpcChannel.ExportPdf, svg, options, path),
  print: (svg, options) => ipcRenderer.invoke(IpcChannel.Print, svg, options),
  takePendingFile: () => ipcRenderer.invoke(IpcChannel.FileTakePending),
  onOpenFileRequest: (listener) => subscribe<string>(IpcChannel.FileOpenRequest, listener),
  askUnsaved: (name) => ipcRenderer.invoke(IpcChannel.DialogUnsaved, name),
  onCloseRequest: (listener) => subscribe<void>(IpcChannel.WindowCloseRequest, listener),
  closeWindow: () => ipcRenderer.invoke(IpcChannel.WindowClose),
  getPathForFile: (file) => webUtils.getPathForFile(file),
  writeRecovery: (id, originalPath, name, content, library) =>
    ipcRenderer.invoke(IpcChannel.RecoveryWrite, id, originalPath, name, content, library),
  clearRecovery: (id) => ipcRenderer.invoke(IpcChannel.RecoveryClear, id),
  listRecovery: () => ipcRenderer.invoke(IpcChannel.RecoveryList),
  readRecovery: (id) => ipcRenderer.invoke(IpcChannel.RecoveryRead, id),
  setMenuState: (state) => ipcRenderer.invoke(IpcChannel.MenuSetState, state),
  onMenuAction: (listener) => subscribe<MenuAction>(IpcChannel.MenuAction, listener)
}

contextBridge.exposeInMainWorld('familyInsight', api)
