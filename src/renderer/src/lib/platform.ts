export const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.userAgent)

/**
 * Formats a shortcut written with `Mod` (Cmd on macOS, Ctrl elsewhere),
 * e.g. `Mod+Shift+S` → `⌘⇧S` / `Ctrl+Shift+S`.
 */
export function formatShortcut(shortcut: string, mac = isMac): string {
  const parts = shortcut.split('+')
  if (!mac) return parts.map((p) => (p === 'Mod' ? 'Ctrl' : p)).join('+')
  const map: Record<string, string> = {
    Mod: '⌘',
    Shift: '⇧',
    Alt: '⌥',
    Ctrl: '⌃',
    Delete: '⌫',
    Enter: '↩'
  }
  return parts.map((p) => map[p] ?? p).join('')
}
