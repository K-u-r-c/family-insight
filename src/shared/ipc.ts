import type { Language } from './i18n'

/** IPC channel names. Every channel used between main and renderer is declared here. */
export const IpcChannel = {
  AppGetInfo: 'app:get-info',
  AppSetLanguage: 'app:set-language',
  MenuAction: 'menu:action'
} as const

export interface AppInfo {
  name: string
  version: string
  platform: string
  locale: string
}

/** Actions triggered from the native menu and forwarded to the renderer. */
export type MenuAction =
  | 'file:new'
  | 'file:open'
  | 'file:save'
  | 'file:save-as'
  | 'file:import-csv'
  | 'file:export-csv'
  | 'edit:undo'
  | 'edit:redo'
  | 'help:about'

/** The API exposed to the renderer as `window.ohara` by the preload script. */
export interface OharaApi {
  getAppInfo(): Promise<AppInfo>
  setLanguage(language: Language): Promise<void>
  onMenuAction(listener: (action: MenuAction) => void): () => void
}
