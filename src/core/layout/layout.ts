import { compareFuzzyDates } from '../date/fuzzyDate'
import type {
  FamilyTree,
  ParentChildKind,
  ParentChildRelationship,
  PartnershipRelationship,
  Person,
  PersonId
} from '../model/types'

/**
 * Family graph layout.
 *
 * Pure and deterministic: the same tree and options always produce the same positions.
 * Pipeline: select people for the view mode → assign generations (rows) → group partners
 * into units → order units per row (barycentre sweeps) → assign x positions (isotonic
 * regression keeps order and spacing while pulling couples above their children and
 * children below their parents) → route edges.
 */

export type ViewMode = 'family' | 'ancestors' | 'descendants' | 'hourglass'

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
  /** Horizontal gap between unrelated neighbours. */
  siblingGap?: number
  /** Vertical gap between generations. */
  generationGap?: number
  /** Gap between disconnected groups of people. */
  componentGap?: number
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

/** Rows: children below parents, partners on the same row, ancestors pulled down to their children. */
function assignGenerations(g: Graph, comp: PersonId[]): Map<PersonId, number> {
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
}

/** Pool-adjacent-violators: x_i ≥ x_{i-1} + minDist_i, minimising Σ (x_i - target_i)². */
function placeRow(targets: number[], gaps: number[]): number[] {
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
    blocks.push({ start: i, end: i, sum: targets[i]! - offset[i]!, count: 1 })
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

interface ComponentLayout {
  centers: Map<PersonId, number>
  gen: Map<PersonId, number>
  minX: number
  maxX: number
  maxGen: number
}

function layoutComponent(
  g: Graph,
  comp: PersonId[],
  o: typeof DEFAULTS,
  focusId?: PersonId
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

  // Initial order: DFS from the focus (or the oldest person) so families stay together.
  const visit = new Map<PersonId, number>()
  const startId =
    focusId && comp.includes(focusId)
      ? focusId
      : comp.slice().sort((a, b) => gen.get(a)! - gen.get(b)!)[0]!
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

  const memberOffset = (u: Unit, id: PersonId): number =>
    u.members.indexOf(id) * (o.nodeWidth + o.partnerGap) + o.nodeWidth / 2 - u.width / 2
  const birthRank = new Map(g.people.map((p, i) => [p.id, i]))
  const unitBirth = (u: Unit): number => Math.min(...u.members.map((m) => birthRank.get(m)!))

  // Barycentre ordering sweeps (by order index).
  const position = (id: PersonId): number => {
    const u = unitOf.get(id)!
    return u.order + u.members.indexOf(id) / (u.members.length + 1)
  }
  // An odd number of sweeps so the last one orders children by their parents.
  for (let sweep = 0; sweep < 7; sweep++) {
    const down = sweep % 2 === 0
    const range = down ? [...rows.keys()].slice(1) : [...rows.keys()].reverse().slice(1)
    for (const r of range) {
      const row = rows[r]!
      const key = new Map<Unit, number>()
      for (const u of row) {
        const neighbours = u.members
          .flatMap((m) =>
            down
              ? (g.parents.get(m) ?? []).map((x) => x.parentId)
              : (g.children.get(m) ?? []).map((x) => x.childId)
          )
          .filter((n) => gen.get(n) === r + (down ? -1 : 1))
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
          const ps = (g.parents.get(m) ?? [])
            .map((x) => x.parentId)
            .filter((n) => gen.get(n) === u.gen - 1)
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

  // Coordinates: start packed, then alternate pulling towards parents and children.
  const gapBetween = (a: Unit, b: Unit): number => a.width / 2 + b.width / 2 + o.siblingGap
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
  const desiredFromParents = (u: Unit): number | undefined => {
    const wants: number[] = []
    for (const m of u.members) {
      const ps = (g.parents.get(m) ?? []).map((r) => r.parentId).filter((p) => gen.get(p)! < u.gen)
      if (!ps.length) continue
      const anchor = ps.reduce((s, p) => s + center(p), 0) / ps.length
      wants.push(anchor - memberOffset(u, m))
    }
    return wants.length ? wants.reduce((a, b) => a + b, 0) / wants.length : undefined
  }
  const desiredFromChildren = (u: Unit): number | undefined => {
    const wants: number[] = []
    for (const m of u.members) {
      const cs = (g.children.get(m) ?? []).map((r) => r.childId).filter((c) => gen.get(c)! > u.gen)
      if (!cs.length) continue
      const anchor = cs.reduce((s, c) => s + center(c), 0) / cs.length
      wants.push(anchor - memberOffset(u, m))
    }
    return wants.length ? wants.reduce((a, b) => a + b, 0) / wants.length : undefined
  }
  const relax = (row: Unit[], desired: (u: Unit) => number | undefined, weight: number): void => {
    if (!row.length) return
    const targets = row.map((u) => {
      const d = desired(u)
      return d === undefined ? u.x : u.x + (d - u.x) * weight
    })
    const gaps = row.map((u, i) => (i === 0 ? 0 : gapBetween(row[i - 1]!, u)))
    const xs = placeRow(targets, gaps)
    row.forEach((u, i) => (u.x = xs[i]!))
  }
  for (let iter = 0; iter < 24; iter++) {
    for (let r = 1; r <= maxGen; r++) relax(rows[r]!, desiredFromParents, 1)
    for (let r = maxGen - 1; r >= 0; r--) relax(rows[r]!, desiredFromChildren, 1)
  }
  // Final pass: children centred under their parents wherever space allows.
  for (let r = 1; r <= maxGen; r++) relax(rows[r]!, desiredFromParents, 1)

  const centers = new Map<PersonId, number>()
  let minX = Infinity
  let maxX = -Infinity
  for (const u of units) {
    for (const m of u.members) {
      const c = center(m)
      centers.set(m, c)
      minX = Math.min(minX, c - o.nodeWidth / 2)
      maxX = Math.max(maxX, c + o.nodeWidth / 2)
    }
  }
  return { centers, gen, minX, maxX, maxGen }
}

/** Computes positions for every visible person and routes the connecting lines. */
export function layoutFamily(tree: FamilyTree, options: LayoutOptions = {}): Layout {
  const o = {
    ...DEFAULTS,
    ...Object.fromEntries(Object.entries(options).filter(([, v]) => typeof v === 'number'))
  }
  const ids = selectPeople(tree, options)
  if (!ids.size) return { nodes: [], edges: [], width: 0, height: 0 }
  const g = buildGraph(tree, ids)
  const full = buildGraph(tree, new Set(Object.keys(tree.persons)))
  const rowHeight = o.nodeHeight + o.generationGap

  // Components: the focus person's group first, then by size and age.
  const comps = components(g).sort((a, b) => {
    const fa = options.focusId && a.includes(options.focusId) ? 0 : 1
    const fb = options.focusId && b.includes(options.focusId) ? 0 : 1
    return fa - fb || b.length - a.length
  })

  const nodes: LayoutNode[] = []
  const pos = new Map<PersonId, LayoutNode>()
  let offsetX = 0
  let maxY = 0
  for (const comp of comps) {
    const c = layoutComponent(g, comp, o, options.focusId)
    const shift = offsetX - c.minX
    for (const id of comp) {
      const generation = c.gen.get(id)!
      const node: LayoutNode = {
        id,
        x: Math.round(c.centers.get(id)! + shift - o.nodeWidth / 2),
        y: generation * rowHeight,
        width: o.nodeWidth,
        height: o.nodeHeight,
        generation,
        hasHiddenChildren: (full.children.get(id) ?? []).some((r) => !ids.has(r.childId))
      }
      nodes.push(node)
      pos.set(id, node)
      maxY = Math.max(maxY, node.y + node.height)
    }
    offsetX += c.maxX - c.minX + o.componentGap
  }
  nodes.sort((a, b) => (a.id < b.id ? -1 : 1))

  const edges: LayoutEdge[] = []
  // Partner lines between neighbours on the same row.
  for (const r of Object.values(tree.relationships).sort((a, b) => (a.id < b.id ? -1 : 1))) {
    if (r.type !== 'partnership') continue
    const a = pos.get(r.partnerIds[0])
    const b = pos.get(r.partnerIds[1])
    if (!a || !b) continue
    const [left, right] = a.x <= b.x ? [a, b] : [b, a]
    const y = left.y + o.nodeHeight / 2
    const points =
      left.y === right.y
        ? [
            { x: left.x + left.width, y },
            { x: right.x, y }
          ]
        : [
            { x: left.x + left.width, y },
            { x: right.x + right.width / 2, y },
            { x: right.x + right.width / 2, y: right.y }
          ]
    edges.push({
      id: r.id,
      type: 'partner',
      points,
      ended: !!r.end,
      relationshipIds: [r.id],
      source: left.id,
      target: right.id
    })
  }

  // Child lines: from the couple's midpoint (adjacent partners) or the parent's bottom.
  for (const child of nodes) {
    const links = (g.parents.get(child.id) ?? []).filter((r) => pos.has(r.parentId))
    if (!links.length) continue
    const parents = links.map((r) => pos.get(r.parentId)!)
    const busY = child.y - o.generationGap / 2
    const top = { x: child.x + child.width / 2, y: child.y }
    const kind = links.some((r) => r.kind === 'biological') ? 'biological' : links[0]!.kind
    const adjacentCouple =
      parents.length === 2 &&
      parents[0]!.y === parents[1]!.y &&
      Math.abs(parents[0]!.x - parents[1]!.x) <= o.nodeWidth + o.partnerGap + 1 &&
      (g.partners.get(parents[0]!.id) ?? []).some(
        (p) => partnerOf(p, parents[0]!.id) === parents[1]!.id
      )
    if (adjacentCouple) {
      const [l, r] =
        parents[0]!.x < parents[1]!.x ? [parents[0]!, parents[1]!] : [parents[1]!, parents[0]!]
      const sx = (l.x + l.width + r.x) / 2
      const sy = l.y + o.nodeHeight / 2
      edges.push({
        id: `c:${links.map((x) => x.id).join('+')}`,
        type: 'child',
        points: [{ x: sx, y: sy }, { x: sx, y: busY }, { x: top.x, y: busY }, top],
        kind,
        relationshipIds: links.map((x) => x.id),
        source: l.id,
        target: child.id
      })
    } else {
      for (const [i, p] of parents.entries()) {
        const sx = p.x + p.width / 2
        const sy = p.y + p.height
        edges.push({
          id: `c:${links[i]!.id}`,
          type: 'child',
          points: [{ x: sx, y: sy }, { x: sx, y: busY }, { x: top.x, y: busY }, top],
          kind: links[i]!.kind,
          relationshipIds: [links[i]!.id],
          source: p.id,
          target: child.id
        })
      }
    }
  }

  const width = Math.max(...nodes.map((n) => n.x + n.width)) - Math.min(...nodes.map((n) => n.x))
  return { nodes, edges, width, height: maxY }
}
