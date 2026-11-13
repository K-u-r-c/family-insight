import type { FamilyTree, PersonId } from '../model/types'
import type { Layout, LayoutEdge } from './layout'

/**
 * Readability metrics of a finished layout: crossings, lines through cards, lines that run too
 * close to each other, line lengths, distances between children and their parents, and the zoom
 * that "fit to window" needs. Pure, used by tests and by `npm run layout:preview`.
 */

/** The tree canvas inside a 1 440 × 900 app window (people list and toolbars excluded). */
export const CANVAS_1440 = { width: 1159, height: 820 }
/** The tree canvas inside a 1 280 × 800 app window. */
export const CANVAS_1280 = { width: 999, height: 720 }

export interface Segment {
  x1: number
  y1: number
  x2: number
  y2: number
  edge: LayoutEdge
  /** Lines of one parent set (or one partnership) form one group. */
  group: string
}

export interface MetricsOptions {
  /** The home person: their ancestry is the direct line. */
  rootId?: PersonId
  /** Parallel lines of different groups closer than this count as too close (default 16). */
  minLaneDistance?: number
}

export interface LayoutMetrics {
  width: number
  height: number
  /** Points where lines of different groups cross (`edgeA × edgeB @ x,y`). */
  crossings: string[]
  /** Crossings that involve a line of the home person's direct line. */
  directCrossings: string[]
  /** Lines that pass through the card of someone they do not connect. */
  throughCards: string[]
  /** Parallel segments of different groups that overlap and are closer than the minimum. */
  closeParallels: string[]
  /** The longest horizontal segment of a child line. */
  longestHorizontal: number
  /** Sum of the lengths of all child lines. */
  totalChildLength: number
  /** Horizontal distance from each child's centre to its parents' centre. */
  childOffsets: Map<PersonId, number>
  maxChildOffset: number
  /** The longest horizontal run (sum of horizontal segments) of a direct-line child line. */
  directMaxRun: number
  /** Child lines that belong to the direct line. */
  directEdges: string[]
}

const EPS = 0.5

/** The parent set of a child line, or the partnership of a partner line. */
export function edgeGroup(e: LayoutEdge): string {
  return e.type === 'partner' ? `partner:${e.id}` : e.people.slice(0, -1).slice().sort().join('+')
}

export function segmentsOf(e: LayoutEdge): Segment[] {
  const group = edgeGroup(e)
  return e.points.slice(1).map((p, i) => ({
    x1: e.points[i]!.x,
    y1: e.points[i]!.y,
    x2: p.x,
    y2: p.y,
    edge: e,
    group
  }))
}

const horizontal = (s: Segment): boolean => s.y1 === s.y2 && s.x1 !== s.x2
const vertical = (s: Segment): boolean => s.x1 === s.x2 && s.y1 !== s.y2
const span = (a: number, b: number): [number, number] => (a < b ? [a, b] : [b, a])

/** Whether a horizontal and a vertical segment cross at a point inside both. */
export function segmentsCross(h: Segment, v: Segment): boolean {
  const [l, r] = span(h.x1, h.x2)
  const [t, b] = span(v.y1, v.y2)
  return v.x1 > l + EPS && v.x1 < r - EPS && h.y1 > t + EPS && h.y1 < b - EPS
}

/** Ancestors of `id` (not including `id`). */
export function ancestorsOf(tree: FamilyTree, id: PersonId): Set<PersonId> {
  const parents = new Map<PersonId, PersonId[]>()
  for (const r of Object.values(tree.relationships)) {
    if (r.type === 'parent-child')
      parents.set(r.childId, [...(parents.get(r.childId) ?? []), r.parentId])
  }
  const out = new Set<PersonId>()
  const stack = [...(parents.get(id) ?? [])]
  while (stack.length) {
    const p = stack.pop()!
    if (out.has(p)) continue
    out.add(p)
    stack.push(...(parents.get(p) ?? []))
  }
  return out
}

/** The zoom at which the whole layout fits a canvas (as the canvas fits it, without clamping). */
export function fitZoom(
  layout: Pick<Layout, 'width' | 'height'>,
  canvas: { width: number; height: number },
  padding = 64
): number {
  return Math.min(
    1,
    (canvas.width - padding * 2) / Math.max(layout.width, 1),
    (canvas.height - padding * 2) / Math.max(layout.height, 1)
  )
}

export function layoutMetrics(
  tree: FamilyTree,
  layout: Layout,
  options: MetricsOptions = {}
): LayoutMetrics {
  const minLane = options.minLaneDistance ?? 16
  const segs = layout.edges.flatMap(segmentsOf)
  const hs = segs.filter(horizontal)
  const vs = segs.filter(vertical)
  const rootId = options.rootId ?? tree.meta.rootPersonId
  const ancestors = rootId ? ancestorsOf(tree, rootId) : new Set<PersonId>()
  const direct = new Set(
    layout.edges
      .filter(
        (e) =>
          e.type === 'child' &&
          (e.target === rootId || ancestors.has(e.target)) &&
          e.people.slice(0, -1).every((p) => ancestors.has(p))
      )
      .map((e) => e.id)
  )

  const crossings = new Set<string>()
  for (const h of hs) {
    for (const v of vs) {
      if (h.group === v.group) continue
      if (segmentsCross(h, v)) {
        const [a, b] = [h.edge.id, v.edge.id].sort()
        crossings.add(`${a} × ${b} @ ${Math.round(v.x1)},${Math.round(h.y1)}`)
      }
    }
  }
  const directCrossings = [...crossings].filter((c) =>
    c
      .split(' @ ')[0]!
      .split(' × ')
      .some((id) => direct.has(id))
  )

  const closeParallels = new Set<string>()
  const close = (
    list: Segment[],
    fixed: (s: Segment) => number,
    along: (s: Segment) => [number, number]
  ): void => {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i]!
        const b = list[j]!
        if (a.group === b.group) continue
        if (Math.abs(fixed(a) - fixed(b)) >= minLane) continue
        const [a1, a2] = along(a)
        const [b1, b2] = along(b)
        if (Math.min(a2, b2) - Math.max(a1, b1) > 1) {
          const [x, y] = [a.edge.id, b.edge.id].sort()
          closeParallels.add(`${x} ∥ ${y}`)
        }
      }
    }
  }
  close(
    hs,
    (s) => s.y1,
    (s) => span(s.x1, s.x2)
  )
  close(
    vs,
    (s) => s.x1,
    (s) => span(s.y1, s.y2)
  )

  const throughCards: string[] = []
  for (const s of segs) {
    const [x1, x2] = span(s.x1, s.x2)
    const [y1, y2] = span(s.y1, s.y2)
    for (const n of layout.nodes) {
      if (s.edge.people.includes(n.id)) continue
      if (x2 > n.x + EPS && x1 < n.x + n.width - EPS && y2 > n.y + EPS && y1 < n.y + n.height - EPS)
        throughCards.push(`${s.edge.id} through ${n.id}`)
    }
  }

  let longestHorizontal = 0
  let totalChildLength = 0
  let directMaxRun = 0
  for (const e of layout.edges) {
    if (e.type !== 'child') continue
    let run = 0
    for (const s of segmentsOf(e)) {
      const dx = Math.abs(s.x2 - s.x1)
      totalChildLength += dx + Math.abs(s.y2 - s.y1)
      run += dx
      if (s.y1 === s.y2) longestHorizontal = Math.max(longestHorizontal, dx)
    }
    if (direct.has(e.id)) directMaxRun = Math.max(directMaxRun, run)
  }

  const pos = new Map(layout.nodes.map((n) => [n.id, n]))
  const centre = (id: PersonId): number => pos.get(id)!.x + pos.get(id)!.width / 2
  const childOffsets = new Map<PersonId, number>()
  const parentsOf = new Map<PersonId, PersonId[]>()
  for (const r of Object.values(tree.relationships)) {
    if (r.type === 'parent-child' && pos.has(r.parentId) && pos.has(r.childId))
      parentsOf.set(r.childId, [...(parentsOf.get(r.childId) ?? []), r.parentId])
  }
  for (const [child, ps] of parentsOf) {
    const mid = ps.reduce((sum, p) => sum + centre(p), 0) / ps.length
    childOffsets.set(child, Math.abs(centre(child) - mid))
  }

  return {
    width: layout.width,
    height: layout.height,
    crossings: [...crossings].sort(),
    directCrossings: directCrossings.sort(),
    throughCards,
    closeParallels: [...closeParallels].sort(),
    longestHorizontal,
    totalChildLength,
    childOffsets,
    maxChildOffset: Math.max(0, ...childOffsets.values()),
    directMaxRun,
    directEdges: [...direct].sort()
  }
}
