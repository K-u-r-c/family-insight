import type { LayoutEdge, Point } from './layout'
import { edgeGroup, segmentsCross, segmentsOf, type Segment } from './metrics'

/**
 * Line decorations (#118), pure so the canvas and the exports draw the same:
 * - junction dots where the lines of one parent group branch (three or more directions meet),
 *   never at a plain corner;
 * - jumps: a short gap in a vertical line where it has to cross another family's line, so the
 *   two never look joined.
 */

export interface Junction extends Point {
  /** Everyone the branching lines connect (the parents and their children here). */
  people: string[]
  /** The lines that branch here. */
  edgeIds: string[]
}

export interface Jump extends Point {
  /** The line that is interrupted (its vertical segment). */
  edgeId: string
}

type Dir = 'up' | 'down' | 'left' | 'right'
const key = (x: number, y: number): string => `${Math.round(x * 2) / 2},${Math.round(y * 2) / 2}`

/** Directions in which the segment leaves the point (both ways when it passes through it). */
function directionsAt(s: Segment, p: Point): Dir[] {
  const eq = (a: number, b: number): boolean => Math.abs(a - b) < 0.5
  if (eq(s.y1, s.y2) && eq(s.y1, p.y)) {
    const [l, r] = s.x1 < s.x2 ? [s.x1, s.x2] : [s.x2, s.x1]
    if (p.x < l - 0.5 || p.x > r + 0.5) return []
    const out: Dir[] = []
    if (p.x > l + 0.5) out.push('left')
    if (p.x < r - 0.5) out.push('right')
    return out
  }
  if (eq(s.x1, s.x2) && eq(s.x1, p.x)) {
    const [t, b] = s.y1 < s.y2 ? [s.y1, s.y2] : [s.y2, s.y1]
    if (p.y < t - 0.5 || p.y > b + 0.5) return []
    const out: Dir[] = []
    if (p.y > t + 0.5) out.push('up')
    if (p.y < b - 0.5) out.push('down')
    return out
  }
  return []
}

export function junctions(edges: readonly LayoutEdge[]): Junction[] {
  const groups = new Map<string, LayoutEdge[]>()
  for (const e of edges) {
    if (e.type !== 'child') continue
    const g = edgeGroup(e)
    groups.set(g, [...(groups.get(g) ?? []), e])
  }
  const out: Junction[] = []
  for (const group of groups.values()) {
    if (group.length < 2) continue
    const segs = group.flatMap(segmentsOf)
    const seen = new Set<string>()
    const people = [...new Set(group.flatMap((e) => e.people))]
    const edgeIds = group.map((e) => e.id)
    for (const e of group) {
      for (const p of e.points) {
        const k = key(p.x, p.y)
        if (seen.has(k)) continue
        seen.add(k)
        const dirs = new Set<Dir>()
        for (const s of segs) for (const d of directionsAt(s, p)) dirs.add(d)
        if (dirs.size >= 3) out.push({ x: p.x, y: p.y, people, edgeIds })
      }
    }
  }
  return out
}

/** Where a vertical line crosses a horizontal line of another group. */
export function jumps(edges: readonly LayoutEdge[]): Jump[] {
  const segs = edges.flatMap(segmentsOf)
  const hs = segs.filter((s) => s.y1 === s.y2 && s.x1 !== s.x2)
  const vs = segs.filter((s) => s.x1 === s.x2 && s.y1 !== s.y2)
  const out: Jump[] = []
  const seen = new Set<string>()
  for (const v of vs) {
    for (const h of hs) {
      if (h.group === v.group || !segmentsCross(h, v)) continue
      const k = `${v.edge.id}@${key(v.x1, h.y1)}`
      if (seen.has(k)) continue
      seen.add(k)
      out.push({ x: v.x1, y: h.y1, edgeId: v.edge.id })
    }
  }
  return out
}

/** The line's points split into pieces, leaving a gap of `gap` on each side of every jump. */
export function splitAtJumps(points: readonly Point[], at: readonly Jump[], gap = 5): Point[][] {
  if (!at.length) return [points.slice()]
  const pieces: Point[][] = [[points[0]!]]
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!
    const b = points[i]!
    if (a.x === b.x) {
      const down = b.y > a.y
      const hits = at
        .filter(
          (j) =>
            Math.abs(j.x - a.x) < 0.5 && (down ? j.y > a.y && j.y < b.y : j.y < a.y && j.y > b.y)
        )
        .sort((p, q) => (down ? p.y - q.y : q.y - p.y))
      for (const j of hits) {
        const before = down ? j.y - gap : j.y + gap
        const after = down ? j.y + gap : j.y - gap
        pieces[pieces.length - 1]!.push({ x: a.x, y: before })
        pieces.push([{ x: a.x, y: after }])
      }
    }
    pieces[pieces.length - 1]!.push(b)
  }
  return pieces.filter((p) => p.length > 1)
}
