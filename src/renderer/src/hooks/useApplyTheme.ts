import { useEffect } from 'react'
import type { AppStyle, ThemePreference } from '@core/settings'
import { useSettings } from '@renderer/store/settings'

export function applyTheme(theme: ThemePreference): void {
  const root = document.documentElement
  if (theme === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', theme)
}

/** The modern style is the default token set; other styles override it via `data-style`. */
export function applyStyle(style: AppStyle): void {
  const root = document.documentElement
  if (style === 'modern') root.removeAttribute('data-style')
  else root.setAttribute('data-style', style)
}

/**
 * Mirrors the theme and style preferences onto `<html data-theme data-style>` so CSS tokens can
 * react to them.
 */
export function useApplyTheme(): void {
  const theme = useSettings((s) => s.settings.theme)
  const style = useSettings((s) => s.settings.style)
  useEffect(() => applyTheme(theme), [theme])
  useEffect(() => applyStyle(style), [style])
}
