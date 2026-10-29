import { useEffect } from 'react'
import type { ThemePreference } from '@core/settings'
import { useSettings } from '@renderer/store/settings'

export function applyTheme(theme: ThemePreference): void {
  const root = document.documentElement
  if (theme === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', theme)
}

/** Mirrors the theme preference onto `<html data-theme>` so CSS tokens can react to it. */
export function useApplyTheme(): void {
  const theme = useSettings((s) => s.settings.theme)
  useEffect(() => applyTheme(theme), [theme])
}
