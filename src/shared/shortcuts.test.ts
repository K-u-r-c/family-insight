import { describe, expect, it } from 'vitest'
import en from './locales/en.json'
import pl from './locales/pl.json'
import { formatShortcut, SHORTCUT_GROUPS } from './shortcuts'

function lookup(dict: unknown, key: string): unknown {
  return key
    .split('.')
    .reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], dict)
}

describe('shortcuts', () => {
  it('has a translation for every group and label', () => {
    const keys = SHORTCUT_GROUPS.flatMap((g) => [g.titleKey, ...g.items.map((i) => i.labelKey)])
    for (const key of keys) {
      expect(typeof lookup(en, key), `en:${key}`).toBe('string')
      expect(typeof lookup(pl, key), `pl:${key}`).toBe('string')
    }
  })

  it('formats shortcuts for each platform', () => {
    expect(formatShortcut('Mod+Shift+S', false)).toBe('Ctrl+Shift+S')
    expect(formatShortcut('Mod+Shift+S', true)).toBe('⌘⇧S')
    expect(formatShortcut('Delete', false)).toBe('Del')
    expect(formatShortcut('Delete', true)).toBe('⌫')
    expect(formatShortcut('Escape', true)).toBe('Esc')
    expect(formatShortcut('+', false)).toBe('+')
    expect(formatShortcut('F1', true)).toBe('F1')
  })
})
