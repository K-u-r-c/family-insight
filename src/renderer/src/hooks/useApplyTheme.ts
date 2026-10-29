import { useEffect } from 'react'
import { usePreferences } from '@renderer/store/preferences'

/** Mirrors the theme preference onto `<html data-theme>` so CSS tokens can react to it. */
export function useApplyTheme(): void {
  const theme = usePreferences((s) => s.theme)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
  }, [theme])
}
