import { create } from 'zustand'

export type ThemePreference = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'ohara.theme'

interface PreferencesState {
  theme: ThemePreference
  setTheme: (theme: ThemePreference) => void
}

function readTheme(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' ? stored : 'system'
}

// TODO(settings issue): persist via the main-process settings store instead of localStorage.
export const usePreferences = create<PreferencesState>((set) => ({
  theme: readTheme(),
  setTheme: (theme) => {
    localStorage.setItem(STORAGE_KEY, theme)
    set({ theme })
  }
}))
