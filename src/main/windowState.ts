import { BrowserWindow, screen, type Rectangle } from 'electron'
import { getSettings, updateSettings } from './settings'

const DEFAULT = { width: 1280, height: 820 }

/** Window options restoring the last size/position, if it is still on a connected display. */
export function restoredBounds(): Partial<Rectangle> & { width: number; height: number } {
  const saved = getSettings().windowBounds
  if (!saved) return DEFAULT
  const { width, height, x, y } = saved
  if (x === undefined || y === undefined) return { width, height }
  const visible = screen.getAllDisplays().some(({ workArea: a }) => {
    const overlapX = Math.min(x + width, a.x + a.width) - Math.max(x, a.x)
    const overlapY = Math.min(y + height, a.y + a.height) - Math.max(y, a.y)
    return overlapX > 100 && overlapY > 100
  })
  return visible ? { x, y, width, height } : { width, height }
}

export function wasMaximized(): boolean {
  return getSettings().windowBounds?.maximized === true
}

/** Persists the window's normal bounds (debounced) and maximized state. */
export function trackWindowState(window: BrowserWindow): void {
  let timer: NodeJS.Timeout | undefined
  const save = (): void => {
    if (window.isDestroyed() || window.isMinimized() || window.isFullScreen()) return
    const b = window.getNormalBounds()
    updateSettings({ windowBounds: { ...b, maximized: window.isMaximized() } })
  }
  const schedule = (): void => {
    clearTimeout(timer)
    timer = setTimeout(save, 500)
  }
  window.on('resize', schedule)
  window.on('move', schedule)
  window.on('maximize', save)
  window.on('unmaximize', save)
  window.on('close', () => {
    clearTimeout(timer)
    save()
  })
}
