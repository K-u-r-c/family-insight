import { formatShortcut as format } from '@shared/shortcuts'

export const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.userAgent)

/**
 * Formats a shortcut written with `Mod` (Cmd on macOS, Ctrl elsewhere),
 * e.g. `Mod+Shift+S` → `⌘⇧S` / `Ctrl+Shift+S`.
 */
export function formatShortcut(shortcut: string, mac = isMac): string {
  return format(shortcut, mac)
}
