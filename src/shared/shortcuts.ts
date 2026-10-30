/**
 * Keyboard shortcuts listed in the in-app cheat sheet (Help → Keyboard Shortcuts) and in the
 * user guide, so both always show the same keys. Keys use `Mod` for Cmd on macOS and Ctrl
 * elsewhere; labels are i18n keys.
 */
export interface ShortcutItem {
  /** Alternatives, e.g. `['Mod+Shift+Z', 'Mod+Y']`. */
  keys: string[]
  labelKey: string
}

export interface ShortcutGroup {
  titleKey: string
  items: ShortcutItem[]
}

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    titleKey: 'shortcuts.files',
    items: [
      { keys: ['Mod+N'], labelKey: 'menu.newTree' },
      { keys: ['Mod+O'], labelKey: 'menu.open' },
      { keys: ['Mod+S'], labelKey: 'menu.save' },
      { keys: ['Mod+Shift+S'], labelKey: 'menu.saveAs' },
      { keys: ['Mod+P'], labelKey: 'menu.print' },
      { keys: ['Mod+W'], labelKey: 'menu.closeTree' }
    ]
  },
  {
    titleKey: 'shortcuts.editing',
    items: [
      { keys: ['Mod+Shift+N'], labelKey: 'workspace.addPerson' },
      { keys: ['Enter'], labelKey: 'shortcuts.editSelected' },
      { keys: ['Delete'], labelKey: 'person.delete' },
      { keys: ['Mod+Z'], labelKey: 'common.undo' },
      { keys: ['Mod+Shift+Z', 'Mod+Y'], labelKey: 'common.redo' },
      { keys: ['Escape'], labelKey: 'shortcuts.cancel' }
    ]
  },
  {
    titleKey: 'shortcuts.tree',
    items: [
      { keys: ['↑'], labelKey: 'shortcuts.toParent' },
      { keys: ['↓'], labelKey: 'shortcuts.toChild' },
      { keys: ['←', '→'], labelKey: 'shortcuts.sideways' },
      { keys: ['F'], labelKey: 'tree.fit' },
      { keys: ['+', '−'], labelKey: 'shortcuts.zoom' },
      { keys: ['0'], labelKey: 'tree.resetZoom' }
    ]
  },
  {
    titleKey: 'shortcuts.general',
    items: [
      { keys: ['Mod+F'], labelKey: 'shortcuts.search' },
      { keys: ['?', 'F1'], labelKey: 'shortcuts.thisHelp' }
    ]
  }
]

const MAC_KEYS: Record<string, string> = {
  Mod: '⌘',
  Shift: '⇧',
  Alt: '⌥',
  Ctrl: '⌃',
  Delete: '⌫',
  Escape: 'Esc'
}
const OTHER_KEYS: Record<string, string> = { Mod: 'Ctrl', Delete: 'Del', Escape: 'Esc' }

/**
 * Formats a shortcut for display, e.g. `Mod+Shift+S` → `⌘⇧S` on macOS and `Ctrl+Shift+S`
 * elsewhere. Single keys (`+`, `F1`, `↑`) are shown as they are.
 */
export function formatShortcut(shortcut: string, mac: boolean): string {
  if (shortcut === '+') return shortcut
  const parts = shortcut.split('+')
  if (mac) return parts.map((p) => MAC_KEYS[p] ?? p).join('')
  return parts.map((p) => OTHER_KEYS[p] ?? p).join('+')
}
