import type { FamilyTree, ParentChildKind, PartnershipKind, PersonId, Sex } from '../model/types'

/**
 * How person `b` is related to person `a` ("b is a's …"), as structured data that the
 * per-language namers (`terms/`) turn into words. Distances count generations: `up` from `a` to
 * the common ancestor, `down` from there to `b` – a parent is up 1, a sibling up 1 down 1, a first
 * cousin up 2 down 2, a nephew up 1 down 2.
 */
export type Kinship = SelfKinship | BloodKinship | PartnerKinship | StepKinship | InLawKinship

/** How the line was formed: through birth, adoption, fostering or a step link in the data. */
export type Lineage = 'biological' | 'adoptive' | 'foster' | 'step'
export type Side = 'paternal' | 'maternal'

interface Base {
  /** The people from `a` to `b` (both included), for highlighting in the tree. */
  path: PersonId[]
  sexA: Sex
  sexB: Sex
}

export interface SelfKinship extends Base {
  kind: 'self'
}

/** Related by descent: `direct` (one is the ancestor of the other) or `collateral`. */
export interface BloodKinship extends Base {
  kind: 'direct' | 'collateral'
  up: number
  down: number
  /** Siblings, cousins … through only one of a couple (half-brother, half-cousin). */
  half: boolean
  /** The common ancestor(s) the relationship goes through – a couple, or one person. */
  commonAncestors: PersonId[]
  /** Father's or mother's side of `a` (when `up` ≥ 1 and the parent's sex is known). */
  side?: Side
  /**
   * Sex of the person on `b`'s line just below the common ancestor(s) – for a nephew the
   * sibling, for a cousin the aunt or uncle (Polish bratanek/siostrzeniec, stryjeczny/wujeczny).
   */
  branchSex?: Sex
  lineage: Lineage
}

export interface PartnerKinship extends Base {
  kind: 'partner'
  partnership: PartnershipKind
  /** The partnership ended (divorce, separation, death …). */
  ended: boolean
}

/**
 * Through a partner of a parent or of a child-side person: step-parent (up 1), step-grandparent
 * (up 2), stepchild (down 1), step-grandchild (down 2), step-sibling (up 1, down 1).
 */
export interface StepKinship extends Base {
  kind: 'step'
  up: number
  down: number
  /** The partner the step relationship goes through. */
  via: PersonId
  side?: Side
}

/**
 * Through one partnership: a relative of `a`'s partner (`partner-of-a`: parent-in-law,
 * sibling-in-law …), the partner of `a`'s relative (`partner-of-b`: child-in-law, sibling-in-law
 * …), or the partner of `a`'s partner's sibling (`both`: co-sibling-in-law).
 */
export interface InLawKinship extends Base {
  kind: 'in-law'
  via: 'partner-of-a' | 'partner-of-b' | 'both'
  /** The blood relationship between the two ends of the partnership(s). */
  up: number
  down: number
  half: boolean
  /** The partner(s) the relationship goes through (`a`'s, then `b`'s). */
  partners: PersonId[]
  /** Sex of the partner on `a`'s side (`partner-of-a`, `both`) or of `b`'s partner. */
  partnerSex: Sex
  /** As for blood relationships, of the blood relationship inside. */
  side?: Side
  branchSex?: Sex
}

export interface KinshipOptions {
  /** Generations to search upwards (default 15). */
  maxDepth?: number
}

/** Cousin degree (1 = first cousin) and times removed of a collateral relationship. */
export function cousinDegree(k: { up: number; down: number }): { degree: number; removed: number } {
  return { degree: Math.min(k.up, k.down) - 1, removed: Math.abs(k.up - k.down) }
}

/** Generations between the two people: positive when `b` is in an older generation. */
export const generationDifference = (k: { up: number; down: number }): number => k.up - k.down

interface Link {
  parent: PersonId
  child: PersonId
  kind: ParentChildKind
}

/** Parent and partner lookups built once per tree. */
class Index {
  readonly parents = new Map<PersonId, Link[]>()
  readonly children = new Map<PersonId, Link[]>()
  readonly partners = new Map<PersonId, { id: PersonId; kind: PartnershipKind; ended: boolean }[]>()

  constructor(readonly tree: FamilyTree) {
    for (const r of Object.values(tree.relationships)) {
      if (r.type === 'parent-child') {
        if (!tree.persons[r.parentId] || !tree.persons[r.childId]) continue
        const link = { parent: r.parentId, child: r.childId, kind: r.kind }
        push(this.parents, r.childId, link)
        push(this.children, r.parentId, link)
      } else {
        const [x, y] = r.partnerIds
        if (!tree.persons[x] || !tree.persons[y] || x === y) continue
        const ended = r.end !== undefined
        push(this.partners, x, { id: y, kind: r.kind, ended })
        push(this.partners, y, { id: x, kind: r.kind, ended })
      }
    }
  }

  sex(id: PersonId): Sex {
    return this.tree.persons[id]?.sex ?? 'unknown'
  }
}

function push<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const list = map.get(key)
  if (list) list.push(value)
  else map.set(key, [value])
}

interface Ancestry {
  depth: number
  /** Links from the start person up to this ancestor (start first). */
  links: Link[]
}

const LINEAGE_RANK: Record<Lineage, number> = { biological: 0, step: 1, foster: 2, adoptive: 3 }

function lineageOf(links: Link[]): Lineage {
  let worst: Lineage = 'biological'
  for (const l of links) {
    const lineage = l.kind as Lineage
    if (LINEAGE_RANK[lineage] > LINEAGE_RANK[worst]) worst = lineage
  }
  return worst
}

/**
 * Every ancestor of `start` (and `start` itself at depth 0) with its shortest path, preferring
 * biological links. Breadth-first, so cycles in malformed data end at `maxDepth` or at a person
 * already seen.
 */
function ancestry(index: Index, start: PersonId, maxDepth: number): Map<PersonId, Ancestry> {
  const seen = new Map<PersonId, Ancestry>([[start, { depth: 0, links: [] }]])
  let frontier = [start]
  for (let depth = 1; depth <= maxDepth && frontier.length; depth++) {
    const next: PersonId[] = []
    for (const id of frontier) {
      const base = seen.get(id)!
      const links = [...(index.parents.get(id) ?? [])].sort(
        (x, y) => LINEAGE_RANK[x.kind as Lineage] - LINEAGE_RANK[y.kind as Lineage]
      )
      for (const link of links) {
        if (seen.has(link.parent)) continue
        seen.set(link.parent, { depth, links: [...base.links, link] })
        next.push(link.parent)
      }
    }
    frontier = next
  }
  return seen
}

function sideOf(index: Index, links: Link[]): Side | undefined {
  const first = links[0]
  if (!first) return undefined
  const sex = index.sex(first.parent)
  return sex === 'male' ? 'paternal' : sex === 'female' ? 'maternal' : undefined
}

/** Blood relationships between `a` and `b` (what `b` is to `a`), one per line of descent. */
function bloodRelations(
  index: Index,
  a: PersonId,
  b: PersonId,
  maxDepth: number
): Omit<BloodKinship, 'sexA' | 'sexB'>[] {
  if (a === b) return []
  const fromA = ancestry(index, a, maxDepth)
  const fromB = ancestry(index, b, maxDepth)
  const common = [...fromA.keys()].filter((id) => fromB.has(id))
  if (!common.length) return []
  const commonSet = new Set(common)
  // Lowest common ancestors: none of their children is a common ancestor too.
  let lowest = common.filter(
    (id) => !(index.children.get(id) ?? []).some((l) => commonSet.has(l.child))
  )
  if (!lowest.length) {
    // Only in malformed data with a cycle of parents: take the nearest common ancestor.
    const depth = (id: PersonId): number => fromA.get(id)!.depth + fromB.get(id)!.depth
    lowest = [common.reduce((best, id) => (depth(id) < depth(best) ? id : best))]
  }
  // One relationship per line: ancestors reached through the same children on both sides (a
  // couple) belong together.
  const groups = new Map<string, PersonId[]>()
  for (const id of lowest) {
    const ua = fromA.get(id)!
    const ub = fromB.get(id)!
    const childA = ua.links.at(-1)?.child ?? ''
    const childB = ub.links.at(-1)?.child ?? ''
    const key = `${childA}|${childB}|${ua.depth}|${ub.depth}`
    groups.set(key, [...(groups.get(key) ?? []), id])
  }
  const result: Omit<BloodKinship, 'sexA' | 'sexB'>[] = []
  for (const ancestors of groups.values()) {
    const first = ancestors[0]!
    const ua = fromA.get(first)!
    const ub = fromB.get(first)!
    const up = ua.depth
    const down = ub.depth
    const pathUp = [a, ...ua.links.map((l) => l.parent)]
    const pathDown = ub.links.map((l) => l.child).reverse()
    const kind = up === 0 || down === 0 ? 'direct' : 'collateral'
    // Half: only one of the couple is shared, and the other parent of a child on the line is
    // known to be someone else (an unknown other parent doesn't make a relationship "half").
    let half = false
    if (kind === 'collateral' && ancestors.length === 1) {
      const childA = ua.links.at(-1)!.child
      const childB = ub.links.at(-1)!.child
      const others = (child: PersonId): PersonId[] =>
        (index.parents.get(child) ?? []).map((l) => l.parent).filter((p) => p !== first)
      const otherA = others(childA)
      const otherB = others(childB)
      half = otherA.length > 0 && otherB.length > 0 && !otherA.some((p) => otherB.includes(p))
    }
    result.push({
      kind,
      up,
      down,
      half,
      commonAncestors: [...ancestors].sort(),
      side: up > 0 ? sideOf(index, ua.links) : undefined,
      branchSex: kind === 'collateral' ? index.sex(ub.links.at(-1)!.child) : undefined,
      lineage: lineageOf([...ua.links, ...ub.links]),
      path: [...pathUp, ...pathDown]
    })
  }
  return result
}

const distance = (k: Kinship): number =>
  k.kind === 'self'
    ? 0
    : k.kind === 'partner'
      ? 1
      : k.kind === 'in-law'
        ? k.up + k.down + (k.via === 'both' ? 2 : 1)
        : k.up + k.down

const ORDER: Record<Kinship['kind'], number> = {
  self: 0,
  partner: 1,
  direct: 2,
  collateral: 2,
  step: 3,
  'in-law': 4
}

/**
 * All relationships between `a` and `b` – what `b` is to `a` – shortest first: blood relations
 * (one per line of descent, so double cousins appear twice), partnership, step relations and
 * in-laws through one partnership. Empty when they are unrelated.
 */
export function findRelationships(
  tree: FamilyTree,
  a: PersonId,
  b: PersonId,
  options: KinshipOptions = {}
): Kinship[] {
  if (!tree.persons[a] || !tree.persons[b]) return []
  const index = new Index(tree)
  const maxDepth = options.maxDepth ?? 15
  const sexes = { sexA: index.sex(a), sexB: index.sex(b) }
  if (a === b) return [{ kind: 'self', path: [a], ...sexes }]

  const out: Kinship[] = []
  const blood = bloodRelations(index, a, b, maxDepth)
  out.push(...blood.map((k) => ({ ...k, ...sexes })))
  const isAncestorOf = (x: PersonId, y: PersonId): boolean =>
    x !== y && ancestry(index, y, maxDepth).has(x)

  for (const p of index.partners.get(a) ?? []) {
    if (p.id === b) {
      out.push({ kind: 'partner', partnership: p.kind, ended: p.ended, path: [a, b], ...sexes })
    }
  }

  const partnersOfA = (index.partners.get(a) ?? []).map((p) => p.id).filter((id) => id !== b)
  const partnersOfB = (index.partners.get(b) ?? []).map((p) => p.id).filter((id) => id !== a)

  // b is related to a's partner P.
  for (const p of partnersOfA) {
    for (const r of bloodRelations(index, p, b, maxDepth)) {
      if (r.up === 0) {
        // A descendant of the partner: a stepchild unless also a's own descendant.
        if (isAncestorOf(a, b)) continue
        out.push({ kind: 'step', up: 0, down: r.down, via: p, path: [a, ...r.path], ...sexes })
      } else {
        out.push({
          kind: 'in-law',
          via: 'partner-of-a',
          up: r.up,
          down: r.down,
          half: r.half,
          partners: [p],
          partnerSex: index.sex(p),
          side: r.side,
          branchSex: r.branchSex,
          path: [a, ...r.path],
          ...sexes
        })
      }
    }
  }

  // b is the partner of a's relative Q.
  for (const q of partnersOfB) {
    for (const r of bloodRelations(index, a, q, maxDepth)) {
      if (r.down === 0) {
        // The partner of an ancestor: a step-parent unless also a's own ancestor.
        if (isAncestorOf(b, a)) continue
        out.push({
          kind: 'step',
          up: r.up,
          down: 0,
          via: q,
          side: r.side,
          path: [...r.path, b],
          ...sexes
        })
      } else {
        out.push({
          kind: 'in-law',
          via: 'partner-of-b',
          up: r.up,
          down: r.down,
          half: r.half,
          partners: [q],
          partnerSex: index.sex(q),
          side: r.side,
          branchSex: r.branchSex,
          path: [...r.path, b],
          ...sexes
        })
      }
    }
  }

  // Step-siblings: b is a child of a parent's partner, sharing no parent with a.
  const parentsOfA = (index.parents.get(a) ?? []).map((l) => l.parent)
  const parentsOfB = new Set((index.parents.get(b) ?? []).map((l) => l.parent))
  if (!parentsOfA.some((p) => parentsOfB.has(p))) {
    for (const parent of parentsOfA) {
      for (const partner of index.partners.get(parent) ?? []) {
        if (parentsOfA.includes(partner.id) || !parentsOfB.has(partner.id)) continue
        out.push({
          kind: 'step',
          up: 1,
          down: 1,
          via: partner.id,
          side: sideOf(index, [{ parent, child: a, kind: 'biological' }]),
          path: [a, parent, partner.id, b],
          ...sexes
        })
      }
    }
  }

  // Co-siblings-in-law: the partner of a's partner's sibling.
  for (const p of partnersOfA) {
    for (const q of partnersOfB) {
      if (p === q) continue
      for (const r of bloodRelations(index, p, q, Math.min(maxDepth, 1))) {
        if (r.up !== 1 || r.down !== 1) continue
        out.push({
          kind: 'in-law',
          via: 'both',
          up: 1,
          down: 1,
          half: r.half,
          partners: [p, q],
          partnerSex: index.sex(p),
          path: [a, ...r.path, b],
          ...sexes
        })
      }
    }
  }

  return dedupe(out).sort((x, y) => distance(x) - distance(y) || ORDER[x.kind] - ORDER[y.kind])
}

/** Drops relationships described twice (e.g. a step-sibling found through both parents). */
function dedupe(list: Kinship[]): Kinship[] {
  const seen = new Set<string>()
  return list.filter((k) => {
    const key = JSON.stringify({ ...k, path: undefined, via: undefined, side: undefined })
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
