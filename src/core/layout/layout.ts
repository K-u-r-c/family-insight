import { compareFuzzyDates } from '../date/fuzzyDate'
import type {
  FamilyTree,
  ParentChildKind,
  ParentChildRelationship,
  PartnershipRelationship,
  Person,
  PersonId,
  TreeViewMode
} from '../model/types'
import { segmentsCross, segmentsOf } from './metrics'
import { rankGraph, type RankEdge } from './ranking'

/**
 * Family graph layout.
 *
 * Pure and deterministic: the same tree and options always produce the same positions.
 * Pipeline: select people for the view mode → assign generations (rows) → group partners
 * into units → order units per row (barycentre sweeps) → assign x positions (isotonic
 * regression keeps order and spacing while pulling couples above their children and
 * children below their parents) → route edges.
 */

export type ViewMode = TreeViewMode

export interface LayoutOptions {
  mode?: ViewMode
  /** Person the view is centred on (required for every mode except `family`). */
  focusId?: PersonId
  /** Generations to include above/below the focus person (modes other than `family`). */
  depth?: number
  /** People whose descendants are hidden. */
  collapsed?: ReadonlySet<PersonId>
  nodeWidth?: number
  nodeHeight?: number
  /** Horizontal gap between partners. */
  partnerGap?: number
  /** Horizontal gap between siblings (neighbours that share a parent). */
  siblingGap?: number
  /**
   * Horizontal gap between neighbours from different families – cousins (default the larger of
   * 2.5 × `siblingGap` and 0.6 × `nodeWidth`).
   */
  familyGap?: number
  /** Gap between more distant branches or unrelated families (default `nodeWidth`). */
  branchGap?: number
  /** Vertical gap between generations. */
  generationGap?: number
  /** Gap between disconnected groups of people. */
  componentGap?: number
  /**
   * Siblings with no partner and no children (three or more in a row) hang in columns below
   * their family line instead of taking one long row (#115). Off unless set.
   */
  compactSiblings?: boolean
}

export interface Point {
  x: number
  y: number
}

export interface LayoutNode {
  id: PersonId
  /** Top-left corner. */
  x: number
  y: number
  width: number
  height: number
  generation: number
  /** Some children are not shown (collapsed branch or outside the view mode). */
  hasHiddenChildren: boolean
  /** The person has children in the tree (shown or not). */
  hasChildren: boolean
  /** Place in a hanging column of siblings (`compactSiblings`): 0 is the top card. */
  stack?: { index: number; count: number }
  /** Hangs below the gap between its parents, in their row (#117): 0 is the top card. */
  hang?: { index: number; count: number }
}

export interface LayoutEdge {
  id: string
  type: 'partner' | 'child'
  points: Point[]
  /** Parent-child kind (non-biological links are drawn dashed). */
  kind?: ParentChildKind
  /** Partnership that has ended. */
  ended?: boolean
  relationshipIds: string[]
  source: PersonId
  target: PersonId
  /** Everyone the line connects: both partners, or the parent(s) and the child. */
  people: PersonId[]
}

export interface Layout {
  nodes: LayoutNode[]
  edges: LayoutEdge[]
  width: number
  height: number
}

const DEFAULTS = {
  nodeWidth: 188,
  nodeHeight: 68,
  partnerGap: 28,
  siblingGap: 36,
  generationGap: 84,
  componentGap: 120
}

type Sizes = typeof DEFAULTS & { familyGap: number; branchGap: number }

/** Hanging columns of siblings: cards per column, the shortest run stacked, spacing, indent. */
const STACK_MAX = 4
const STACK_MIN_RUN = 3
export const STACK_GAP = 16
export const STACK_INDENT = 24

interface Graph {
  people: Person[]
  ids: Set<PersonId>
  parents: Map<PersonId, ParentChildRelationship[]>
  children: Map<PersonId, ParentChildRelationship[]>
  partners: Map<PersonId, PartnershipRelationship[]>
}

function push<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const list = map.get(key)
  if (list) list.push(value)
  else map.set(key, [value])
}

function byBirthThenId(a: Person, b: Person): number {
  return compareFuzzyDates(a.birth?.date, b.birth?.date) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
}

function buildGraph(tree: FamilyTree, ids: Set<PersonId>): Graph {
  const parents = new Map<PersonId, ParentChildRelationship[]>()
  const children = new Map<PersonId, ParentChildRelationship[]>()
  const partners = new Map<PersonId, PartnershipRelationship[]>()
  const rels = Object.values(tree.relationships).sort((a, b) => (a.id < b.id ? -1 : 1))
  for (const r of rels) {
    if (r.type === 'parent-child') {
      if (!ids.has(r.parentId) || !ids.has(r.childId)) continue
      push(parents, r.childId, r)
      push(children, r.parentId, r)
    } else {
      const [a, b] = r.partnerIds
      if (!ids.has(a) || !ids.has(b)) continue
      push(partners, a, r)
      push(partners, b, r)
    }
  }
  const people = [...ids].map((id) => tree.persons[id]!).sort(byBirthThenId)
  return { people, ids, parents, children, partners }
}

const partnerOf = (r: PartnershipRelationship, id: PersonId): PersonId =>
  r.partnerIds[0] === id ? r.partnerIds[1] : r.partnerIds[0]

/** People visible in a view mode. */
export function selectPeople(tree: FamilyTree, options: LayoutOptions): Set<PersonId> {
  const mode = options.mode ?? 'family'
  const all = Object.keys(tree.persons)
  const collapsed = options.collapsed ?? new Set<PersonId>()
  const full = buildGraph(tree, new Set(all))

  let ids: Set<PersonId>
  const focus = options.focusId && tree.persons[options.focusId] ? options.focusId : undefined
  if (mode === 'family' || !focus) {
    ids = new Set(all)
  } else {
    const depth = options.depth ?? Infinity
    ids = new Set([focus])
    const walk = (
      start: PersonId,
      next: (id: PersonId) => PersonId[],
      withPartners: boolean
    ): void => {
      let frontier = [start]
      for (let level = 0; level < depth && frontier.length; level++) {
        const upcoming: PersonId[] = []
        for (const id of frontier) {
          if (withPartners && collapsed.has(id)) continue
          for (const n of next(id)) {
            if (!ids.has(n)) {
              ids.add(n)
              upcoming.push(n)
            }
          }
        }
        frontier = upcoming
      }
    }
    if (mode === 'ancestors' || mode === 'hourglass') {
      walk(focus, (id) => (full.parents.get(id) ?? []).map((r) => r.parentId), false)
    }
    if (mode === 'descendants' || mode === 'hourglass') {
      const before = new Set(ids)
      walk(focus, (id) => (full.children.get(id) ?? []).map((r) => r.childId), true)
      // Show partners of the focus person and of descendants (the other parents).
      for (const id of [...ids]) {
        if (before.has(id) && id !== focus) continue
        for (const p of full.partners.get(id) ?? []) ids.add(partnerOf(p, id))
      }
    }
  }

  // Hide descendants of collapsed people (unless they are also reachable otherwise as a root).
  if (collapsed.size) {
    const hidden = new Set<PersonId>()
    const stack = [...collapsed].filter((id) => ids.has(id))
    while (stack.length) {
      const id = stack.pop()!
      for (const r of full.children.get(id) ?? []) {
        if (!hidden.has(r.childId) && r.childId !== options.focusId) {
          hidden.add(r.childId)
          stack.push(r.childId)
        }
      }
    }
    // Partners of hidden people that are not otherwise connected disappear too.
    for (const id of hidden) {
      ids.delete(id)
      for (const p of full.partners.get(id) ?? []) {
        const other = partnerOf(p, id)
        const anchored =
          (full.parents.get(other) ?? []).some(
            (r) => ids.has(r.parentId) && !hidden.has(r.parentId)
          ) || collapsed.has(other)
        const otherPartnersVisible = (full.partners.get(other) ?? []).some((q) => {
          const o = partnerOf(q, other)
          return o !== id && ids.has(o) && !hidden.has(o)
        })
        if (!anchored && !otherPartnersVisible && other !== options.focusId) ids.delete(other)
      }
    }
  }
  return ids
}

/** Connected components (through any relationship), each sorted deterministically. */
function components(g: Graph): PersonId[][] {
  const seen = new Set<PersonId>()
  const result: PersonId[][] = []
  for (const person of g.people) {
    if (seen.has(person.id)) continue
    const comp: PersonId[] = []
    const stack = [person.id]
    seen.add(person.id)
    while (stack.length) {
      const id = stack.pop()!
      comp.push(id)
      const next = [
        ...(g.parents.get(id) ?? []).map((r) => r.parentId),
        ...(g.children.get(id) ?? []).map((r) => r.childId),
        ...(g.partners.get(id) ?? []).map((r) => partnerOf(r, id))
      ]
      for (const n of next) {
        if (!seen.has(n)) {
          seen.add(n)
          stack.push(n)
        }
      }
    }
    result.push(comp)
  }
  return result
}

/**
 * Rows: partners share a row and every child is below its parents, with parent–child links as
 * short as possible (one row wherever the data allows). Partners are merged into one node and
 * the rows come from an optimal layering (network simplex), so when a marriage puts someone on
 * a lower row, their parents, siblings and their families move with them.
 */
function assignGenerations(g: Graph, comp: PersonId[]): Map<PersonId, number> {
  // Union-find over partnerships: each group of partners shares one row.
  const index = new Map(comp.map((id, i) => [id, i]))
  const root = comp.map((_, i) => i)
  const find = (i: number): number => {
    while (root[i] !== i) i = root[i] = root[root[i]!]!
    return i
  }
  for (const id of comp) {
    for (const r of g.partners.get(id) ?? []) {
      const a = find(index.get(id)!)
      const b = find(index.get(partnerOf(r, id))!)
      if (a !== b) root[Math.max(a, b)] = Math.min(a, b)
    }
  }
  const groupOf = new Map<number, number>()
  const group = comp.map((_, i) => {
    const r = find(i)
    if (!groupOf.has(r)) groupOf.set(r, groupOf.size)
    return groupOf.get(r)!
  })
  const edges: RankEdge[] = []
  for (const id of comp) {
    for (const r of g.parents.get(id) ?? []) {
      edges.push({ from: group[index.get(r.parentId)!]!, to: group[index.get(id)!]!, weight: 1 })
    }
  }
  // A partner who is also a parent (or any cycle) has no valid layering: fall back to relaxation.
  if (edges.some((e) => e.from === e.to)) return relaxGenerations(g, comp)
  const ranks = rankGraph(groupOf.size, edges)
  if (!ranks) return relaxGenerations(g, comp)
  return new Map(comp.map((id, i) => [id, ranks[group[i]!]!]))
}

/** Fallback for malformed data: children below parents, partners on the same row, best effort. */
function relaxGenerations(g: Graph, comp: PersonId[]): Map<PersonId, number> {
  const gen = new Map<PersonId, number>(comp.map((id) => [id, 0]))
  const limit = comp.length * 4 + 10
  for (let iter = 0; iter < limit; iter++) {
    let changed = false
    for (const id of comp) {
      let v = gen.get(id)!
      for (const r of g.parents.get(id) ?? []) v = Math.max(v, gen.get(r.parentId)! + 1)
      for (const r of g.partners.get(id) ?? []) v = Math.max(v, gen.get(partnerOf(r, id))!)
      if (v !== gen.get(id)) {
        gen.set(id, v)
        changed = true
      }
    }
    // People without parents sit directly above their highest child.
    for (const id of comp) {
      if ((g.parents.get(id) ?? []).length) continue
      const kids = (g.children.get(id) ?? []).map((r) => gen.get(r.childId)!)
      if (!kids.length) continue
      const target = Math.min(...kids) - 1
      if (target > gen.get(id)!) {
        gen.set(id, target)
        changed = true
      }
    }
    if (!changed) break
  }
  const min = Math.min(...gen.values())
  for (const [id, v] of gen) gen.set(id, v - min)
  return gen
}

/** Groups partners on the same row into linear chains (a person between their partners). */
function buildUnits(g: Graph, comp: PersonId[], gen: Map<PersonId, number>): PersonId[][] {
  const inUnit = new Set<PersonId>()
  const units: PersonId[][] = []
  const samePartners = (id: PersonId): PersonId[] =>
    (g.partners.get(id) ?? [])
      .slice()
      .sort((a, b) => compareFuzzyDates(a.start?.date, b.start?.date) || (a.id < b.id ? -1 : 1))
      .map((r) => partnerOf(r, id))
      .filter((p) => gen.get(p) === gen.get(id))

  for (const id of comp) {
    if (inUnit.has(id)) continue
    // Collect the partner component on this row.
    const members: PersonId[] = []
    const stack = [id]
    inUnit.add(id)
    while (stack.length) {
      const cur = stack.pop()!
      members.push(cur)
      for (const p of samePartners(cur)) {
        if (!inUnit.has(p)) {
          inUnit.add(p)
          stack.push(p)
        }
      }
    }
    if (members.length === 1) {
      units.push(members)
      continue
    }
    // Hub (most partners) in the middle, partners split left/right by start date.
    const degree = (m: PersonId): number =>
      samePartners(m).filter((p) => members.includes(p)).length
    const sorted = members.slice().sort((a, b) => degree(b) - degree(a) || (a < b ? -1 : 1))
    const hub = sorted[0]!
    const order: PersonId[] = [hub]
    const placed = new Set([hub])
    const hubPartners = samePartners(hub).filter((p) => members.includes(p))
    hubPartners.forEach((p, i) => {
      if (placed.has(p)) return
      placed.add(p)
      if (i % 2 === 0) order.unshift(p)
      else order.push(p)
    })
    // Anyone else (partners of partners) goes next to whoever they are partnered with.
    let guard = members.length * members.length
    while (placed.size < members.length && guard-- > 0) {
      for (const m of members) {
        if (placed.has(m)) continue
        const anchor = samePartners(m).find((p) => placed.has(p))
        if (anchor === undefined) continue
        const idx = order.indexOf(anchor)
        if (idx === 0) order.unshift(m)
        else order.splice(idx + 1, 0, m)
        placed.add(m)
      }
    }
    for (const m of members) if (!placed.has(m)) order.push(m)
    units.push(order)
  }
  return units
}

interface Unit {
  members: PersonId[]
  gen: number
  /** Order key within the row. */
  order: number
  /** Centre x. */
  x: number
  width: number
  /** A hanging column of siblings (top to bottom) instead of partners side by side. */
  stack?: boolean
}

/** Pool-adjacent-violators: x_i ≥ x_{i-1} + minDist_i, minimising Σ w_i (x_i - target_i)². */
function placeRow(targets: number[], gaps: number[], weights?: number[]): number[] {
  const n = targets.length
  // Shift into a space where the constraint is y_i ≥ y_{i-1}.
  const offset: number[] = new Array(n)
  let acc = 0
  for (let i = 0; i < n; i++) {
    if (i > 0) acc += gaps[i]!
    offset[i] = acc
  }
  const blocks: { start: number; end: number; sum: number; count: number }[] = []
  for (let i = 0; i < n; i++) {
    const w = weights?.[i] ?? 1
    blocks.push({ start: i, end: i, sum: w * (targets[i]! - offset[i]!), count: w })
    while (blocks.length > 1) {
      const last = blocks[blocks.length - 1]!
      const prev = blocks[blocks.length - 2]!
      if (prev.sum / prev.count <= last.sum / last.count) break
      prev.end = last.end
      prev.sum += last.sum
      prev.count += last.count
      blocks.pop()
    }
  }
  const out: number[] = new Array(n)
  for (const b of blocks) {
    const y = b.sum / b.count
    for (let i = b.start; i <= b.end; i++) out[i] = y + offset[i]!
  }
  return out
}

/**
 * `placeRow` with optional bounds per item (`lo_i ≤ x_i ≤ hi_i`): an item that ends up outside its
 * bound is pinned to it with a heavy weight and the row is solved again.
 */
function placeRowBounded(
  targets: number[],
  gaps: number[],
  weights: number[],
  lo: (number | undefined)[],
  hi: (number | undefined)[]
): number[] {
  const t = targets.slice()
  const w = weights.slice()
  let xs = placeRow(t, gaps, w)
  for (let pass = 0; pass < 8; pass++) {
    let changed = false
    xs.forEach((x, i) => {
      const h = hi[i]
      const l = lo[i]
      if (h !== undefined && x > h + 0.01 && t[i] !== h) {
        t[i] = h
        w[i] = 1e6
        changed = true
      } else if (l !== undefined && x < l - 0.01 && t[i] !== l) {
        t[i] = l
        w[i] = 1e6
        changed = true
      }
    })
    if (!changed) break
    xs = placeRow(t, gaps, w)
  }
  return xs
}

interface ComponentLayout {
  centers: Map<PersonId, number>
  gen: Map<PersonId, number>
  /** People in hanging columns: their place in the column. */
  stacks: Map<PersonId, { index: number; count: number }>
  minX: number
  maxX: number
  maxGen: number
}

interface ComponentExtras {
  focusId?: PersonId
  /** People who may hang in a column (compact siblings); none when not set. */
  stackable?: (id: PersonId) => boolean
  /** The root person and their ancestors: links between them pull harder (#117). */
  direct?: ReadonlySet<PersonId>
}

/** How much harder a direct-line link pulls than any other link. */
const DIRECT_WEIGHT = 3

function layoutComponent(
  g: Graph,
  comp: PersonId[],
  o: Sizes,
  { focusId, stackable, direct }: ComponentExtras = {}
): ComponentLayout {
  const gen = assignGenerations(g, comp)
  const unitList = buildUnits(g, comp, gen)
  const unitOf = new Map<PersonId, Unit>()
  const units: Unit[] = unitList.map((members) => {
    const u: Unit = {
      members,
      gen: gen.get(members[0]!)!,
      order: 0,
      x: 0,
      width: members.length * o.nodeWidth + (members.length - 1) * o.partnerGap
    }
    for (const m of members) unitOf.set(m, u)
    return u
  })
  const maxGen = Math.max(...units.map((u) => u.gen))
  const rows: Unit[][] = Array.from({ length: maxGen + 1 }, () => [])
  for (const u of units) rows[u.gen]!.push(u)

  /** A member's card centre relative to the unit centre (stacked cards sit right of the trunk). */
  const memberOffset = (u: Unit, id: PersonId): number =>
    u.stack
      ? STACK_INDENT / 2
      : u.members.indexOf(id) * (o.nodeWidth + o.partnerGap) + o.nodeWidth / 2 - u.width / 2
  /** Where a member's line from the parents comes down, relative to the unit centre. */
  const dropOffset = (u: Unit, id: PersonId): number =>
    u.stack ? STACK_INDENT / 2 - u.width / 2 : memberOffset(u, id)
  const birthRank = new Map(g.people.map((p, i) => [p.id, i]))
  const unitBirth = (u: Unit): number => Math.min(...u.members.map((m) => birthRank.get(m)!))
  const position = (id: PersonId): number => {
    const u = unitOf.get(id)!
    return u.order + u.members.indexOf(id) / (u.members.length + 1)
  }
  /** People linked to `id` as parent or child in the row `dir` (−1 above, +1 below). */
  const linked = (id: PersonId, dir: -1 | 1): PersonId[] => {
    const row = gen.get(id)! + dir
    const ids =
      dir < 0
        ? (g.parents.get(id) ?? []).map((x) => x.parentId)
        : (g.children.get(id) ?? []).map((x) => x.childId)
    return ids.filter((n) => gen.get(n) === row)
  }

  // Initial order: DFS from a start person so families stay together.
  const initialOrder = (startId: PersonId): void => {
    const visit = new Map<PersonId, number>()
    const stack = [startId]
    while (stack.length) {
      const id = stack.pop()!
      if (visit.has(id)) continue
      visit.set(id, visit.size)
      const next = [
        ...(g.partners.get(id) ?? []).map((r) => partnerOf(r, id)),
        ...(g.children.get(id) ?? []).map((r) => r.childId),
        ...(g.parents.get(id) ?? []).map((r) => r.parentId)
      ]
      for (let i = next.length - 1; i >= 0; i--) if (!visit.has(next[i]!)) stack.push(next[i]!)
    }
    for (const row of rows) {
      row.sort(
        (a, b) =>
          Math.min(...a.members.map((m) => visit.get(m)!)) -
          Math.min(...b.members.map((m) => visit.get(m)!))
      )
      row.forEach((u, i) => (u.order = i))
    }
  }

  // Barycentre ordering sweeps (by order index); an odd number so the last one orders children
  // by their parents.
  const sweeps = (): void => {
    for (let sweep = 0; sweep < 7; sweep++) {
      const down = sweep % 2 === 0
      const range = down ? [...rows.keys()].slice(1) : [...rows.keys()].reverse().slice(1)
      for (const r of range) {
        const row = rows[r]!
        const key = new Map<Unit, number>()
        for (const u of row) {
          const neighbours = u.members.flatMap((m) => linked(m, down ? -1 : 1))
          key.set(
            u,
            neighbours.length
              ? neighbours.reduce((s, n) => s + position(n), 0) / neighbours.length
              : u.order
          )
        }
        row.sort((a, b) => key.get(a)! - key.get(b)! || unitBirth(a) - unitBirth(b))
        row.forEach((u, i) => (u.order = i))
        // Flip couples so each partner is on the side of their own parents.
        for (const u of row) {
          if (u.members.length < 2) continue
          const bary = (m: PersonId): number | undefined => {
            const ps = linked(m, -1)
            return ps.length ? ps.reduce((s, n) => s + position(n), 0) / ps.length : undefined
          }
          const first = bary(u.members[0]!)
          const last = bary(u.members[u.members.length - 1]!)
          if (first !== undefined && last !== undefined && first > last) u.members.reverse()
          else if (first !== undefined && last === undefined && first > u.order + 0.5)
            u.members.reverse()
          else if (last !== undefined && first === undefined && last < u.order - 0.5)
            u.members.reverse()
        }
      }
    }
  }

  /** Crossings between the links of two neighbours `a` (left) and `b` (right) of one row. */
  const pairCrossings = (a: Unit, b: Unit): number => {
    let count = 0
    for (const dir of [-1, 1] as const) {
      const pa = a.members.flatMap((m) => linked(m, dir).map(position))
      const pb = b.members.flatMap((m) => linked(m, dir).map(position))
      for (const x of pa) for (const y of pb) if (x > y) count++
    }
    return count
  }
  // Swap neighbours while that removes crossings (the "transpose" step of Sugiyama layouts).
  const transpose = (): void => {
    for (let pass = 0; pass < 6; pass++) {
      let improved = false
      for (const row of rows) {
        for (let i = 0; i + 1 < row.length; i++) {
          const a = row[i]!
          const b = row[i + 1]!
          if (pairCrossings(b, a) < pairCrossings(a, b)) {
            row[i] = b
            row[i + 1] = a
            a.order = i + 1
            b.order = i
            improved = true
          }
        }
      }
      if (!improved) break
    }
  }
  const crossings = (): number => {
    let count = 0
    for (let r = 0; r < maxGen; r++) {
      const links: [number, number][] = []
      for (const u of rows[r]!) {
        for (const m of u.members)
          for (const c of linked(m, 1)) links.push([position(m), position(c)])
      }
      for (let i = 0; i < links.length; i++) {
        for (let j = i + 1; j < links.length; j++) {
          if ((links[i]![0] - links[j]![0]) * (links[i]![1] - links[j]![1]) < 0) count++
        }
      }
    }
    return count
  }

  // Try a few start people (the focus or the oldest person first, then other founders and the
  // youngest generation) and keep the order with the fewest crossings.
  const byGen = comp.slice().sort((a, b) => gen.get(a)! - gen.get(b)!)
  const starts: PersonId[] = []
  const addStart = (id: PersonId | undefined): void => {
    if (id !== undefined && !starts.some((s) => unitOf.get(s) === unitOf.get(id))) starts.push(id)
  }
  addStart(focusId && comp.includes(focusId) ? focusId : byGen[0])
  const tries = comp.length > 400 ? 2 : 8
  for (const id of byGen) if (!(g.parents.get(id) ?? []).length) addStart(id)
  addStart(byGen[byGen.length - 1])
  const originalMembers = new Map(units.map((u) => [u, u.members.slice()]))
  let best: { rows: Unit[][]; members: Map<Unit, PersonId[]>; crossings: number } | undefined
  for (const startId of starts.slice(0, tries)) {
    for (const u of units) u.members = originalMembers.get(u)!.slice()
    initialOrder(startId)
    sweeps()
    transpose()
    const c = crossings()
    if (!best || c < best.crossings) {
      best = {
        rows: rows.map((row) => row.slice()),
        members: new Map(units.map((u) => [u, u.members.slice()])),
        crossings: c
      }
    }
    if (c === 0) break
  }
  for (let r = 0; r < rows.length; r++) {
    rows[r] = best!.rows[r]!
    rows[r]!.forEach((u, i) => (u.order = i))
  }
  for (const u of units) u.members = best!.members.get(u)!

  // Compact siblings (#115): three or more siblings without partners or children hang in
  // balanced columns of up to four cards, in birth order down the columns.
  if (stackable) {
    const parentKey = (id: PersonId): string => linked(id, -1).slice().sort().join('+')
    const leaf = (u: Unit): string | undefined => {
      const id = u.members[0]!
      if (u.members.length !== 1 || id === focusId || !stackable(id)) return undefined
      if ((g.partners.get(id) ?? []).length || (g.children.get(id) ?? []).length) return undefined
      const key = parentKey(id)
      return key || undefined
    }
    let changed = false
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r]!
      // All such siblings of one family form one block, where the first of them stands; siblings
      // with families of their own keep their places.
      const byKey = new Map<string, Unit[]>()
      for (const u of row) {
        const key = leaf(u)
        if (key) byKey.set(key, [...(byKey.get(key) ?? []), u])
      }
      const next: Unit[] = []
      for (const u of row) {
        const key = leaf(u)
        const run = key ? byKey.get(key)! : undefined
        if (!run || run.length < STACK_MIN_RUN) {
          next.push(u)
          continue
        }
        if (run[0] !== u) continue
        // Birth order; people without dates in the order they were added.
        const person = (id: PersonId): Person => g.people[birthRank.get(id)!]!
        const ids = run
          .map((x) => x.members[0]!)
          .sort(
            (a, b) =>
              compareFuzzyDates(person(a).birth?.date, person(b).birth?.date) ||
              (person(a).createdAt < person(b).createdAt
                ? -1
                : person(a).createdAt > person(b).createdAt
                  ? 1
                  : birthRank.get(a)! - birthRank.get(b)!)
          )
        const columns = Math.ceil(ids.length / STACK_MAX)
        let start = 0
        for (let c = 0; c < columns; c++) {
          const size = Math.floor(ids.length / columns) + (c < ids.length % columns ? 1 : 0)
          const members = ids.slice(start, start + size)
          start += size
          const col: Unit = {
            members,
            gen: r,
            order: 0,
            x: 0,
            width: STACK_INDENT + o.nodeWidth,
            stack: true
          }
          for (const m of members) unitOf.set(m, col)
          next.push(col)
        }
        changed = true
      }
      rows[r] = next
      next.forEach((u, k) => (u.order = k))
    }
    if (changed) units.splice(0, units.length, ...rows.flat())
  }

  // Coordinates: start packed, then minimise Σ (child − parent)² over all parent → child links
  // row by row (block coordinate descent, each row solved exactly by isotonic regression).
  // Neighbours from different families get `familyGap`, siblings and partners stay close.
  const parentsOf = new Map<Unit, Set<PersonId>>()
  for (const u of units) {
    const set = new Set<PersonId>()
    for (const m of u.members) {
      for (const r of g.parents.get(m) ?? []) if (gen.get(r.parentId)! < u.gen) set.add(r.parentId)
    }
    parentsOf.set(u, set)
  }
  const related = (a: Unit, b: Unit): boolean => {
    const pa = parentsOf.get(a)!
    for (const p of parentsOf.get(b)!) if (pa.has(p)) return true
    return false
  }
  // How closely two neighbours are related (#116): siblings, cousins (a common ancestor two
  // generations up), or more distant branches and unrelated families.
  const ancestry = new Map<PersonId, Map<PersonId, number>>()
  const ancestorsUp = (id: PersonId): Map<PersonId, number> => {
    let out = ancestry.get(id)
    if (out) return out
    out = new Map()
    let frontier = [id]
    for (let depth = 1; depth <= 2 && frontier.length; depth++) {
      const next: PersonId[] = []
      for (const p of frontier) {
        for (const r of g.parents.get(p) ?? []) {
          if (out.has(r.parentId)) continue
          out.set(r.parentId, depth)
          next.push(r.parentId)
        }
      }
      frontier = next
    }
    ancestry.set(id, out)
    return out
  }
  const cousins = (a: Unit, b: Unit): boolean =>
    a.members.some((x) => {
      const ax = ancestorsUp(x)
      return b.members.some((y) => [...ancestorsUp(y).keys()].some((anc) => ax.has(anc)))
    })
  const gapCache = new Map<Unit, Map<Unit, number>>()
  const gapBetween = (a: Unit, b: Unit): number => {
    let row = gapCache.get(a)
    if (!row) gapCache.set(a, (row = new Map()))
    let gap = row.get(b)
    if (gap === undefined) {
      gap = related(a, b) ? o.siblingGap : cousins(a, b) ? o.familyGap : o.branchGap
      row.set(b, gap)
    }
    return a.width / 2 + b.width / 2 + gap
  }
  for (const row of rows) {
    let x = 0
    row.forEach((u, i) => {
      if (i > 0) x += gapBetween(row[i - 1]!, u)
      u.x = x
    })
  }
  const center = (id: PersonId): number => {
    const u = unitOf.get(id)!
    return u.x + memberOffset(u, id)
  }
  /** Where the unit's links want it (mean over links) and how many links pull. */
  const desired = (u: Unit, up: boolean, down: boolean): [number, number] | undefined => {
    let sum = 0
    let count = 0
    for (const m of u.members) {
      const offset = memberOffset(u, m)
      if (up) {
        for (const r of g.parents.get(m) ?? []) {
          if (gen.get(r.parentId)! >= u.gen) continue
          const w = direct?.has(m) && direct.has(r.parentId) ? DIRECT_WEIGHT : 1
          sum += w * (center(r.parentId) - offset)
          count += w
        }
      }
      if (down) {
        for (const r of g.children.get(m) ?? []) {
          if (gen.get(r.childId)! <= u.gen) continue
          const w = direct?.has(m) && direct.has(r.childId) ? DIRECT_WEIGHT : 1
          sum += w * (center(r.childId) - offset)
          count += w
        }
      }
    }
    return count ? [sum / count, count] : undefined
  }
  // Children of one unit grouped by parent set (#113): a parent alone, or two adjacent partners.
  // Each group's line drops from its own point (the parent's card, or the gap between the
  // partners); a group's children stay between the drop points of the neighbouring groups, so
  // the groups' horizontal lines never overlap or cross.
  interface ChildGroup {
    parents: PersonId[]
    kids: { unit: Unit; member: PersonId }[]
  }
  const groupsOf = new Map<Unit, ChildGroup[]>()
  for (const u of units) {
    const byKey = new Map<string, ChildGroup>()
    for (const m of u.members) {
      for (const c of linked(m, 1)) {
        const ps = linked(c, -1)
        if (!ps.every((p) => unitOf.get(p) === u) || ps.length > 2) continue
        if (
          ps.length === 2 &&
          Math.abs(u.members.indexOf(ps[0]!) - u.members.indexOf(ps[1]!)) !== 1
        )
          continue
        const key = ps.slice().sort().join('+')
        if (byKey.has(key) && byKey.get(key)!.kids.some((k) => k.member === c)) continue
        const group = byKey.get(key) ?? { parents: ps, kids: [] }
        group.kids.push({ unit: unitOf.get(c)!, member: c })
        byKey.set(key, group)
      }
    }
    if (byKey.size > 1) groupsOf.set(u, [...byKey.values()])
  }
  const splitRows = new Set([...groupsOf.keys()].map((u) => u.gen + 1))
  const groupClearance = o.familyGap / 2
  const stemOf = (g: ChildGroup): number =>
    g.parents.reduce((s, p) => s + center(p), 0) / g.parents.length
  /** Bounds on the unit centres of `row` that keep each child group between its neighbours. */
  const boundsFor = (row: Unit[]): [(number | undefined)[], (number | undefined)[]] => {
    const lo = new Map<Unit, number>()
    const hi = new Map<Unit, number>()
    if (splitRows.has(row[0]?.gen ?? -1)) {
      for (const [, groups] of groupsOf) {
        if (groups[0]!.kids[0]!.unit.gen !== row[0]!.gen) continue
        const stems = groups.map(stemOf)
        const order = groups.map((_, i) => i).sort((a, b) => stems[a]! - stems[b]!)
        order.forEach((gi, k) => {
          const g = groups[gi]!
          const left = k > 0 ? stems[order[k - 1]!]! + groupClearance : -Infinity
          const right = k + 1 < order.length ? stems[order[k + 1]!]! - groupClearance : Infinity
          // Skip a group that cannot fit between its neighbours.
          const kidUnits = [...new Set(g.kids.map((x) => x.unit))].sort((a, b) => a.order - b.order)
          let need = 0
          for (let i = 1; i < kidUnits.length; i++)
            need += gapBetween(kidUnits[i - 1]!, kidUnits[i]!)
          if (right - left < need) return
          for (const { unit, member } of g.kids) {
            const off = dropOffset(unit, member)
            if (right < Infinity) hi.set(unit, Math.min(hi.get(unit) ?? Infinity, right - off))
            if (left > -Infinity) lo.set(unit, Math.max(lo.get(unit) ?? -Infinity, left - off))
          }
        })
      }
    }
    if (frame) {
      for (const u of row) {
        lo.set(u, Math.max(lo.get(u) ?? -Infinity, frame.left + u.width / 2))
        hi.set(u, Math.min(hi.get(u) ?? Infinity, frame.right - u.width / 2))
      }
    }
    return [row.map((u) => lo.get(u)), row.map((u) => hi.get(u))]
  }
  /** Once set, every row stays within the span of the widest row (see below). */
  let frame: { left: number; right: number } | undefined
  const relax = (row: Unit[], up: boolean, down: boolean): void => {
    if (!row.length) return
    const targets: number[] = []
    const weights: number[] = []
    for (const u of row) {
      const d = desired(u, up, down)
      targets.push(d ? d[0] : u.x)
      weights.push(d ? d[1] : 0.01)
    }
    const gaps = row.map((u, i) => (i === 0 ? 0 : gapBetween(row[i - 1]!, u)))
    const xs =
      frame || splitRows.has(row[0]!.gen)
        ? placeRowBounded(targets, gaps, weights, ...boundsFor(row))
        : placeRow(targets, gaps, weights)
    row.forEach((u, i) => (u.x = xs[i]!))
  }
  for (let iter = 0; iter < 40; iter++) {
    for (let r = 1; r <= maxGen; r++) relax(rows[r]!, true, true)
    for (let r = maxGen - 1; r >= 0; r--) relax(rows[r]!, true, true)
  }
  // The last sweep moved the parents: settle the rows below them once more.
  if (splitRows.size) {
    const first = Math.min(...splitRows)
    for (let r = first; r <= maxGen; r++) relax(rows[r]!, true, true)
  }
  // Compactness (with compact siblings): the row that needs the most space sets the frame;
  // narrower rows that stick out of it (a couple centred above a child at the end of a full row)
  // are pulled in. The tree is then as wide as its widest row.
  if (stackable && rows.length > 1) {
    const packed = (row: Unit[]): number =>
      row.reduce((sum, u, i) => sum + (i ? gapBetween(row[i - 1]!, u) : 0), 0) +
      (row.length ? (row[0]!.width + row[row.length - 1]!.width) / 2 : 0)
    const widest = rows.reduce((a, b) => (packed(b) > packed(a) ? b : a))
    const left = widest[0]!.x - widest[0]!.width / 2
    const right = widest[widest.length - 1]!.x + widest[widest.length - 1]!.width / 2
    const sticksOut = rows.some(
      (row) =>
        row.length &&
        (row[0]!.x - row[0]!.width / 2 < left - o.siblingGap ||
          row[row.length - 1]!.x + row[row.length - 1]!.width / 2 > right + o.siblingGap)
    )
    if (sticksOut) {
      frame = { left, right }
      for (let iter = 0; iter < 6; iter++) {
        for (let r = 0; r <= maxGen; r++) if (rows[r] !== widest) relax(rows[r]!, true, true)
        for (let r = maxGen; r >= 0; r--) if (rows[r] !== widest) relax(rows[r]!, true, true)
      }
    }
  }

  const centers = new Map<PersonId, number>()
  const stacks = new Map<PersonId, { index: number; count: number }>()
  let minX = Infinity
  let maxX = -Infinity
  for (const u of units) {
    if (u.stack) minX = Math.min(minX, u.x - u.width / 2)
    u.members.forEach((m, index) => {
      const c = center(m)
      centers.set(m, c)
      if (u.stack) stacks.set(m, { index, count: u.members.length })
      minX = Math.min(minX, c - o.nodeWidth / 2)
      maxX = Math.max(maxX, c + o.nodeWidth / 2)
    })
  }
  return { centers, gen, stacks, minX, maxX, maxGen }
}

/** Computes positions for every visible person and routes the connecting lines. */
export function layoutFamily(tree: FamilyTree, options: LayoutOptions = {}): Layout {
  const sized = {
    ...DEFAULTS,
    ...Object.fromEntries(Object.entries(options).filter(([, v]) => typeof v === 'number'))
  }
  const familyGap =
    options.familyGap ??
    Math.max(Math.round(sized.siblingGap * 2.5), Math.round(sized.nodeWidth * 0.6))
  const o: Sizes = {
    ...sized,
    familyGap,
    branchGap: Math.max(familyGap, options.branchGap ?? sized.nodeWidth)
  }
  const ids = selectPeople(tree, options)
  if (!ids.size) return { nodes: [], edges: [], width: 0, height: 0 }
  const g = buildGraph(tree, ids)
  const full = buildGraph(tree, new Set(Object.keys(tree.persons)))

  // Components: the focus person's group first, then by size and age.
  const comps = components(g).sort((a, b) => {
    const fa = options.focusId && a.includes(options.focusId) ? 0 : 1
    const fb = options.focusId && b.includes(options.focusId) ? 0 : 1
    return fa - fb || b.length - a.length
  })

  // The direct line (#117): the focus or root person and their ancestors.
  const root = options.focusId ?? tree.meta.rootPersonId
  const direct = new Set<PersonId>()
  if (root && ids.has(root)) {
    const stack = [root]
    while (stack.length) {
      const id = stack.pop()!
      if (direct.has(id)) continue
      direct.add(id)
      for (const r of g.parents.get(id) ?? []) stack.push(r.parentId)
    }
  }
  const stackable = options.compactSiblings
    ? (id: PersonId): boolean =>
        !(full.children.get(id) ?? []).length && id !== tree.meta.rootPersonId
    : undefined

  const place = (hung: ReadonlySet<PersonId>): Layout => {
    // Hung children (#117) are left out of the layout and placed below their parents.
    const gl = hung.size ? buildGraph(tree, new Set([...ids].filter((id) => !hung.has(id)))) : g
    const nodes: LayoutNode[] = []
    const pos = new Map<PersonId, LayoutNode>()
    let offsetX = 0
    for (const all of comps) {
      const comp = all.filter((id) => !hung.has(id))
      const c = layoutComponent(gl, comp, o, { focusId: options.focusId, stackable, direct })
      const shift = offsetX - c.minX
      const node = (id: PersonId, center: number, generation: number): LayoutNode => ({
        id,
        x: Math.round(center + shift - o.nodeWidth / 2),
        y: 0,
        width: o.nodeWidth,
        height: o.nodeHeight,
        generation,
        hasHiddenChildren: (full.children.get(id) ?? []).some((r) => !ids.has(r.childId)),
        hasChildren: (full.children.get(id) ?? []).length > 0,
        ...(c.stacks.has(id) ? { stack: c.stacks.get(id)! } : {})
      })
      for (const id of comp) {
        const n = node(id, c.centers.get(id)!, c.gen.get(id)!)
        nodes.push(n)
        pos.set(id, n)
      }
      // Below the gap between the parents, right of a short trunk, oldest first.
      const byStem = new Map<string, PersonId[]>()
      for (const id of all.filter((x) => hung.has(x))) {
        const key = (g.parents.get(id) ?? [])
          .map((r) => r.parentId)
          .sort()
          .join('+')
        byStem.set(key, [...(byStem.get(key) ?? []), id])
      }
      for (const [key, kids] of byStem) {
        const parents = key.split('+')
        const stem = parents.reduce((sum, p) => sum + c.centers.get(p)!, 0) / parents.length
        kids.sort((a, b) => byBirthThenId(tree.persons[a]!, tree.persons[b]!))
        kids.forEach((id, index) => {
          const n = node(id, stem + STACK_INDENT / 2 + o.nodeWidth / 2, c.gen.get(parents[0]!)! + 1)
          n.hang = { index, count: kids.length }
          nodes.push(n)
          pos.set(id, n)
        })
      }
      offsetX += c.maxX - c.minX + o.componentGap
    }
    nodes.sort((a, b) => (a.id < b.id ? -1 : 1))
    const edges = routeEdges(tree, g, nodes, pos, o)
    const maxY = Math.max(...nodes.map((n) => n.y + n.height))
    const width = Math.max(...nodes.map((n) => n.x + n.width)) - Math.min(...nodes.map((n) => n.x))
    return { nodes, edges, width, height: maxY }
  }

  let layout = place(new Set())
  if (!options.compactSiblings || !direct.size) return layout
  // A child without a family of their own whose line would cross the direct line hangs below
  // their parents instead (a crossing there cannot be avoided with the child on its own row).
  const hung = new Set<PersonId>()
  for (let pass = 0; pass < 3; pass++) {
    const pos = new Map(layout.nodes.map((n) => [n.id, n]))
    const before = hung.size
    // Lines that cross a direct-line link (only those segments are compared).
    const isDirect = (e: LayoutEdge): boolean =>
      e.type === 'child' &&
      direct.has(e.target) &&
      e.people.slice(0, -1).every((p) => direct.has(p))
    const directSegs = layout.edges.filter(isDirect).flatMap(segmentsOf)
    const crossing = new Set<LayoutEdge>()
    for (const e of layout.edges) {
      if (e.type !== 'child' || isDirect(e)) continue
      for (const s of segmentsOf(e)) {
        for (const d of directSegs) {
          if (d.group === s.group) continue
          const h = s.y1 === s.y2 ? s : d
          const v = h === s ? d : s
          if (h.y1 === h.y2 && v.x1 === v.x2 && segmentsCross(h, v)) crossing.add(e)
        }
      }
    }
    for (const e of crossing) {
      if (direct.has(e.target) || hung.has(e.target)) continue
      const child = e.target
      const parents = (g.parents.get(child) ?? []).map((r) => pos.get(r.parentId))
      const [a, b] = parents
      const adjacentCouple =
        parents.length === 2 &&
        a &&
        b &&
        a.y === b.y &&
        Math.abs(a.x - b.x) <= o.nodeWidth + o.partnerGap + 1 &&
        (g.partners.get(a.id) ?? []).some((r) => partnerOf(r, a.id) === b.id)
      if (
        adjacentCouple &&
        stackable!(child) &&
        !(g.partners.get(child) ?? []).length &&
        child !== options.focusId
      )
        hung.add(child)
    }
    if (hung.size === before) break
    layout = place(hung)
  }
  return layout
}

/** Vertical distance between lanes, and the clearance between the outer lanes and the cards. */
const LANE_STEP = 16
const LANE_MARGIN = 24

interface Hop {
  /** Band above this row (between `row - 1` and `row`). */
  row: number
  left: number
  right: number
  /** Lines with the same key belong to one parent group and share a lane. */
  key: string
  /** Where a vertical line comes down into this segment, and where one leaves it downwards. */
  up: number
  down: number
  lane?: number
}

/**
 * Sets every node's `y` and draws the lines. Child lines run down from the parents to a
 * horizontal segment in the gap above the child's row; each parent group gets its own lane there,
 * so lines of different families never overlap, and a gap that needs more lanes than fit grows.
 */
function routeEdges(
  tree: FamilyTree,
  g: Graph,
  nodes: LayoutNode[],
  pos: Map<PersonId, LayoutNode>,
  o: Sizes
): LayoutEdge[] {
  const maxGen = Math.max(...nodes.map((n) => n.generation))
  const rowCards: LayoutNode[][] = Array.from({ length: maxGen + 1 }, () => [])
  // A hung child stands in its parents' row.
  const rowOf = (n: LayoutNode): number => (n.hang ? n.generation - 1 : n.generation)
  for (const n of nodes) rowCards[rowOf(n)]!.push(n)
  for (const row of rowCards) row.sort((a, b) => a.x - b.x)
  const centerX = (n: LayoutNode): number => n.x + n.width / 2

  /** An x where a vertical line passes rows `from…to` without touching a card. */
  const channel = (from: number, to: number, near: number, alsoNear: number): number => {
    const free = (x: number): boolean => {
      for (let r = from; r <= to; r++) {
        for (const n of rowCards[r] ?? []) if (x > n.x - 8 && x < n.x + n.width + 8) return false
      }
      return true
    }
    if (free(near)) return near
    const candidates: number[] = []
    for (let r = from; r <= to; r++) {
      const row = rowCards[r] ?? []
      row.forEach((n, i) => {
        candidates.push(n.x - 20, n.x + n.width + 20)
        const next = row[i + 1]
        if (next) candidates.push((n.x + n.width + next.x) / 2)
      })
    }
    const cost = (x: number): number => Math.abs(x - near) + Math.abs(x - alsoNear)
    return candidates.filter(free).sort((a, b) => cost(a) - cost(b) || a - b)[0] ?? near
  }

  // 1. Child links, grouped by the parent (or couple) they come from.
  interface ChildLine {
    links: ParentChildRelationship[]
    parents: LayoutNode[]
    child: LayoutNode
    sx: number
    /** From between two adjacent partners (else from the bottom of the single parent's card). */
    couple: boolean
    hops: Hop[]
    /** Vertical channel of a line that spans several rows. */
    via?: number
  }
  const lines: ChildLine[] = []
  for (const child of nodes) {
    const links = (g.parents.get(child.id) ?? []).filter((r) => pos.has(r.parentId))
    if (!links.length) continue
    const parents = links.map((r) => pos.get(r.parentId)!)
    const adjacentCouple =
      parents.length === 2 &&
      parents[0]!.generation === parents[1]!.generation &&
      Math.abs(parents[0]!.x - parents[1]!.x) <= o.nodeWidth + o.partnerGap + 1 &&
      (g.partners.get(parents[0]!.id) ?? []).some(
        (p) => partnerOf(p, parents[0]!.id) === parents[1]!.id
      )
    const groups: [ParentChildRelationship[], LayoutNode[]][] = adjacentCouple
      ? [[links, parents]]
      : links.map((r, i) => [[r], [parents[i]!]])
    for (const [ls, ps] of groups) {
      const [l, r] = ps.length === 2 && ps[1]!.x < ps[0]!.x ? [ps[1]!, ps[0]!] : [ps[0]!, ps[1]]
      if (child.hang && r) {
        // Straight down from the gap between the parents (no lane).
        lines.push({
          links: ls,
          parents: ps,
          child,
          sx: (l.x + l.width + r.x) / 2,
          couple: true,
          hops: []
        })
        continue
      }
      const sx = r ? (l.x + l.width + r.x) / 2 : centerX(l)
      const key = ps
        .map((p) => p.id)
        .sort()
        .join('+')
      // A card in a hanging column is reached by the column's trunk, left of the cards.
      const top = child.stack ? child.x - STACK_INDENT / 2 : centerX(child)
      const line: ChildLine = { links: ls, parents: ps, child, sx, couple: !!r, hops: [] }
      const from = l.generation
      if (from === child.generation - 1) {
        line.hops.push({
          row: child.generation,
          left: Math.min(sx, top),
          right: Math.max(sx, top),
          key,
          up: sx,
          down: top
        })
      } else if (from < child.generation - 1) {
        // Several rows down: across in the first gap, down a free channel, across to the child.
        const via = channel(from + 1, child.generation - 1, top, sx)
        line.via = via
        const own = `${key}>${child.id}`
        line.hops.push({
          row: from + 1,
          left: Math.min(sx, via),
          right: Math.max(sx, via),
          key: own,
          up: sx,
          down: via
        })
        line.hops.push({
          row: child.generation,
          left: Math.min(via, top),
          right: Math.max(via, top),
          key: own,
          up: via,
          down: top
        })
      }
      lines.push(line)
    }
  }

  // 2. Lanes: interval colouring of the hops in each gap.
  const byKey = new Map<string, Hop[]>()
  for (const line of lines) {
    for (const h of line.hops)
      byKey.set(`${h.row}|${h.key}`, [...(byKey.get(`${h.row}|${h.key}`) ?? []), h])
  }
  const lanes = new Array<number>(maxGen + 1).fill(1)
  const bands = new Map<number, { left: number; right: number; hops: Hop[] }[]>()
  for (const [k, hs] of byKey) {
    const row = Number(k.split('|')[0])
    const span = {
      left: Math.min(...hs.map((h) => h.left)),
      right: Math.max(...hs.map((h) => h.right)),
      hops: hs
    }
    bands.set(row, [...(bands.get(row) ?? []), span])
  }
  const parentsOfKey = (key: string): string[] => key.split('>')[0]!.split('+')
  for (const [row, spans] of bands) {
    spans.sort((a, b) => a.left - b.left || a.right - b.right)
    const info = spans.map((span) => ({
      span,
      parents: parentsOfKey(span.hops[0]!.key),
      ups: span.hops.map((h) => h.up),
      downs: span.hops.map((h) => h.down)
    }))
    // Lines of different parent groups that would share a lane must end a family gap apart, so
    // they never read as one line (#116).
    const sameParent = (a: (typeof info)[number], b: (typeof info)[number]): boolean =>
      a.parents.some((p) => b.parents.includes(p))
    const meet = (a: (typeof info)[number], b: (typeof info)[number]): boolean =>
      a.span.left < b.span.right + o.familyGap && b.span.left < a.span.right + o.familyGap
    const inside = (xs: number[], s: { left: number; right: number }): boolean =>
      xs.some((x) => x > s.left + 0.5 && x < s.right - 0.5)
    /** `a` on a higher lane than `b` crosses nothing: a's drops miss b, b's stems miss a. */
    const canAbove = (a: (typeof info)[number], b: (typeof info)[number]): boolean =>
      !inside(a.downs, b.span) && !inside(b.ups, a.span)
    // Segments that meet get an order when only one of the two avoids a crossing; lanes are then
    // given in that order (lowest free lane below everything that must be above).
    const above: number[][] = info.map(() => [])
    for (let i = 0; i < info.length; i++) {
      for (let j = i + 1; j < info.length; j++) {
        if (!meet(info[i]!, info[j]!)) continue
        const ij = canAbove(info[i]!, info[j]!)
        const ji = canAbove(info[j]!, info[i]!)
        if (ij && !ji) {
          above[j]!.push(i)
        } else if (ji && !ij) {
          above[i]!.push(j)
        }
      }
    }
    const laneOf = new Array<number>(info.length).fill(-1)
    const used: number[][] = []
    const done = new Set<number>()
    while (done.size < info.length) {
      let next = -1
      for (let i = 0; i < info.length; i++) {
        if (done.has(i)) continue
        if (above[i]!.every((p) => done.has(p))) {
          next = i
          break
        }
      }
      // A cycle (no order avoids every crossing): take the leftmost remaining segment.
      if (next < 0) next = [...info.keys()].find((i) => !done.has(i))!
      let lane = Math.max(-1, ...above[next]!.filter((p) => done.has(p)).map((p) => laneOf[p]!)) + 1
      // Lines of one parent that run side by side keep a free lane between them, so they never
      // look merged.
      const taken = (l: number): boolean =>
        (used[l] ?? []).some((k) => meet(info[k]!, info[next]!)) ||
        [l - 1, l + 1].some((n) =>
          (used[n] ?? []).some(
            (k) => sameParent(info[k]!, info[next]!) && meet(info[k]!, info[next]!)
          )
        )
      while (taken(lane)) lane++
      laneOf[next] = lane
      ;(used[lane] ??= []).push(next)
      for (let l = 0; l < lane; l++) used[l] ??= []
      done.add(next)
      for (const h of info[next]!.span.hops) h.lane = lane
    }
    lanes[row] = Math.max(1, used.length)
  }

  // 3. Rows: a gap grows when it needs more lanes than fit.
  const fit = Math.max(1, Math.floor((o.generationGap - 2 * LANE_MARGIN) / LANE_STEP) + 1)
  const gapOf = (row: number): number =>
    o.generationGap + Math.max(0, lanes[row]! - fit) * LANE_STEP
  // A row with hanging columns is as tall as its tallest column.
  const stackStep = o.nodeHeight + STACK_GAP
  const rowHeight = new Array<number>(maxGen + 1).fill(o.nodeHeight)
  for (const n of nodes) {
    if (n.stack)
      rowHeight[n.generation] = Math.max(
        rowHeight[n.generation]!,
        o.nodeHeight + (n.stack.count - 1) * stackStep
      )
    if (n.hang)
      rowHeight[n.generation - 1] = Math.max(
        rowHeight[n.generation - 1]!,
        o.nodeHeight + n.hang.count * stackStep
      )
  }
  const rowY: number[] = [0]
  for (let r = 1; r <= maxGen; r++) rowY.push(rowY[r - 1]! + rowHeight[r - 1]! + gapOf(r))
  for (const n of nodes) {
    n.y = n.hang
      ? rowY[n.generation - 1]! + (n.hang.index + 1) * stackStep
      : rowY[n.generation]! + (n.stack?.index ?? 0) * stackStep
  }
  const laneY = (h: Hop): number => {
    const mid = rowY[h.row]! - gapOf(h.row) / 2
    return mid + ((h.lane ?? 0) - (lanes[h.row]! - 1) / 2) * LANE_STEP
  }

  const edges: LayoutEdge[] = []
  // 4. Partner lines: straight between neighbours, over the cards between partners who are not.
  for (const r of Object.values(tree.relationships).sort((a, b) => (a.id < b.id ? -1 : 1))) {
    if (r.type !== 'partnership') continue
    const a = pos.get(r.partnerIds[0])
    const b = pos.get(r.partnerIds[1])
    if (!a || !b) continue
    const [left, right] = a.x <= b.x ? [a, b] : [b, a]
    const y = left.y + o.nodeHeight / 2
    let points: Point[]
    if (left.y !== right.y) {
      points = [
        { x: left.x + left.width, y },
        { x: centerX(right), y },
        { x: centerX(right), y: right.y }
      ]
    } else if (right.x - (left.x + left.width) <= o.partnerGap + 1) {
      points = [
        { x: left.x + left.width, y },
        { x: right.x, y }
      ]
    } else {
      // A quarter card towards each other, clear of the lines from their parents (#118).
      const above = left.y - (LANE_MARGIN - LANE_STEP)
      const lx = centerX(left) + o.nodeWidth / 4
      const rx = centerX(right) - o.nodeWidth / 4
      points = [
        { x: lx, y: left.y },
        { x: lx, y: above },
        { x: rx, y: above },
        { x: rx, y: right.y }
      ]
    }
    edges.push({
      id: r.id,
      type: 'partner',
      points,
      ended: !!r.end,
      relationshipIds: [r.id],
      source: left.id,
      target: right.id,
      people: [left.id, right.id]
    })
  }

  // 5. Child lines.
  for (const line of lines) {
    const { links, parents, child } = line
    const [l] =
      parents.length === 2 && parents[1]!.x < parents[0]!.x ? [parents[1]!] : [parents[0]!]
    const sy = line.couple ? l.y + o.nodeHeight / 2 : l.y + l.height
    const top = { x: centerX(child), y: child.y }
    // Into a hanging column: down the trunk, then a short branch into the card's side.
    const trunk = child.stack ? child.x - STACK_INDENT / 2 : undefined
    const end = (y: number): Point[] =>
      trunk === undefined
        ? [{ x: top.x, y }, top]
        : [
            { x: trunk, y },
            { x: trunk, y: child.y + o.nodeHeight / 2 },
            { x: child.x, y: child.y + o.nodeHeight / 2 }
          ]
    let points: Point[]
    if (child.hang) {
      const mid = child.y + o.nodeHeight / 2
      points = [
        { x: line.sx, y: sy },
        { x: line.sx, y: mid },
        { x: child.x, y: mid }
      ]
    } else if (line.hops.length === 1) {
      const y = laneY(line.hops[0]!)
      points = [{ x: line.sx, y: sy }, { x: line.sx, y }, ...end(y)]
    } else if (line.hops.length === 2) {
      const y1 = laneY(line.hops[0]!)
      const y2 = laneY(line.hops[1]!)
      const via = line.via!
      points = [
        { x: line.sx, y: sy },
        { x: line.sx, y: y1 },
        { x: via, y: y1 },
        { x: via, y: y2 },
        ...end(y2)
      ]
    } else {
      // Malformed data (a parent on or below the child's row): a plain line.
      const y = child.y - o.generationGap / 2
      points = [{ x: line.sx, y: sy }, { x: line.sx, y }, { x: top.x, y }, top]
    }
    const kind =
      links.length > 1 && links.some((r) => r.kind === 'biological') ? 'biological' : links[0]!.kind
    edges.push({
      id: links.length > 1 ? `c:${links.map((x) => x.id).join('+')}` : `c:${links[0]!.id}`,
      type: 'child',
      points: dedupe(points),
      kind,
      relationshipIds: links.map((x) => x.id),
      source: l.id,
      target: child.id,
      people: [...parents.map((p) => p.id), child.id]
    })
  }
  return edges
}

/** Drops repeated points (zero-length segments). */
function dedupe(points: Point[]): Point[] {
  return points.filter((p, i) => i === 0 || p.x !== points[i - 1]!.x || p.y !== points[i - 1]!.y)
}
