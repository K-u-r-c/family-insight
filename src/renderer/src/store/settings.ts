import { create } from 'zustand'
import type { Settings } from '@core/settings'

interface SettingsState {
  settings: Settings
  /** Sends a validated patch to the main process; the store updates from its broadcast. */
  update: (patch: Partial<Settings>) => Promise<void>
}

/** Mirror of the main-process settings. Initialised by `initSettings()` before first render. */
export const useSettings = create<SettingsState>(() => ({
  settings: undefined as unknown as Settings,
  update: async (patch) => {
    const next = await window.familyInsight.updateSettings(patch)
    useSettings.setState({ settings: next })
  }
}))

export async function initSettings(): Promise<Settings> {
  const settings = await window.familyInsight.getSettings()
  useSettings.setState({ settings })
  window.familyInsight.onSettingsChanged((next) => useSettings.setState({ settings: next }))
  return settings
}
