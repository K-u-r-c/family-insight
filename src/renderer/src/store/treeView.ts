import { create } from 'zustand'
import type { ViewMode } from '@core/layout/layout'
import type { PersonId } from '@core/model/types'

export interface Viewport {
  /** Translation in screen px and zoom factor: screen = world * k + (x, y). */
  x: number
  y: number
  k: number
}

export const MIN_ZOOM = 0.15
export const MAX_ZOOM = 2.5

interface TreeViewState {
  viewport: Viewport
  /** Size of the canvas element in px. */
  size: { width: number; height: number }
  /** Animate the next viewport change (programmatic moves only). */
  animate: boolean
  mode: ViewMode
  depth: number
  collapsed: ReadonlySet<PersonId>
  /** A relationship path highlighted on the tree (people from one to the other), if any. */
  path: readonly PersonId[] | null
  setViewport: (viewport: Viewport, animate?: boolean) => void
  setSize: (width: number, height: number) => void
  setMode: (mode: ViewMode) => void
  setDepth: (depth: number) => void
  toggleCollapsed: (id: PersonId) => void
  /** Expands the given people (branches collapsed under them become visible again). */
  expand: (ids: Iterable<PersonId>) => void
  setPath: (path: readonly PersonId[] | null) => void
  reset: () => void
}

const initial = {
  viewport: { x: 0, y: 0, k: 1 },
  size: { width: 0, height: 0 },
  animate: false,
  mode: 'family' as ViewMode,
  depth: 4,
  collapsed: new Set<PersonId>(),
  path: null
}

/** View state of the tree canvas (per session, not part of the document). */
export const useTreeView = create<TreeViewState>((set) => ({
  ...initial,
  setViewport: (viewport, animate = false) =>
    set({
      viewport: { ...viewport, k: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, viewport.k)) },
      animate
    }),
  setSize: (width, height) => set({ size: { width, height } }),
  setMode: (mode) => set({ mode }),
  setDepth: (depth) => set({ depth }),
  toggleCollapsed: (id) =>
    set((s) => {
      const next = new Set(s.collapsed)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { collapsed: next }
    }),
  expand: (ids) =>
    set((s) => {
      const next = new Set(s.collapsed)
      for (const id of ids) next.delete(id)
      return { collapsed: next }
    }),
  setPath: (path) => set({ path }),
  reset: () => set({ ...initial, collapsed: new Set() })
}))

/** Last viewport per file during this session (restored when a file is reopened). */
export const savedViewports = new Map<string, Viewport>()

/** Viewport that shows `rect` (world coordinates) centred, with padding. */
export function fitViewport(
  rect: { x: number; y: number; width: number; height: number },
  size: { width: number; height: number },
  padding = 64,
  maxZoom = 1
): Viewport {
  const k = Math.max(
    MIN_ZOOM,
    Math.min(
      maxZoom,
      (size.width - padding * 2) / Math.max(rect.width, 1),
      (size.height - padding * 2) / Math.max(rect.height, 1)
    )
  )
  return {
    k,
    x: size.width / 2 - (rect.x + rect.width / 2) * k,
    y: size.height / 2 - (rect.y + rect.height / 2) * k
  }
}

/** Viewport keeping the zoom but centring a world point. */
export function centerViewport(
  point: { x: number; y: number },
  viewport: Viewport,
  size: { width: number; height: number }
): Viewport {
  return {
    k: viewport.k,
    x: size.width / 2 - point.x * viewport.k,
    y: size.height / 2 - point.y * viewport.k
  }
}

/** Zooms by `factor` keeping the screen point `anchor` fixed. */
export function zoomViewport(
  viewport: Viewport,
  factor: number,
  anchor: { x: number; y: number }
): Viewport {
  const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, viewport.k * factor))
  const f = k / viewport.k
  return { k, x: anchor.x - (anchor.x - viewport.x) * f, y: anchor.y - (anchor.y - viewport.y) * f }
}
