import {
  SCHEMA_VERSION,
  type FamilyTree,
  type Person,
  type PersonId,
  type ParentChildRelationship,
  type PartnershipRelationship
} from './types'

export function createEmptyTree(name: string, now: Date = new Date()): FamilyTree {
  const timestamp = now.toISOString()
  return {
    schemaVersion: SCHEMA_VERSION,
    meta: { name, createdAt: timestamp, updatedAt: timestamp },
    persons: {},
    relationships: {},
    sources: {},
    repositories: {},
    media: {}
  }
}

export function parentChildLinks(tree: FamilyTree): ParentChildRelationship[] {
  return Object.values(tree.relationships).filter(
    (r): r is ParentChildRelationship => r.type === 'parent-child'
  )
}

export function partnerships(tree: FamilyTree): PartnershipRelationship[] {
  return Object.values(tree.relationships).filter(
    (r): r is PartnershipRelationship => r.type === 'partnership'
  )
}

function resolve(tree: FamilyTree, ids: Iterable<PersonId>): Person[] {
  const result: Person[] = []
  for (const id of new Set(ids)) {
    const person = tree.persons[id]
    if (person) result.push(person)
  }
  return result
}

export function getParentLinks(tree: FamilyTree, personId: PersonId): ParentChildRelationship[] {
  return parentChildLinks(tree).filter((r) => r.childId === personId)
}

export function getChildLinks(tree: FamilyTree, personId: PersonId): ParentChildRelationship[] {
  return parentChildLinks(tree).filter((r) => r.parentId === personId)
}

export function getPartnerships(tree: FamilyTree, personId: PersonId): PartnershipRelationship[] {
  return partnerships(tree).filter((r) => r.partnerIds.includes(personId))
}

export function otherPartner(rel: PartnershipRelationship, personId: PersonId): PersonId {
  return rel.partnerIds[0] === personId ? rel.partnerIds[1] : rel.partnerIds[0]
}

export function getParents(tree: FamilyTree, personId: PersonId): Person[] {
  return resolve(
    tree,
    getParentLinks(tree, personId).map((r) => r.parentId)
  )
}

export function getChildren(tree: FamilyTree, personId: PersonId): Person[] {
  return resolve(
    tree,
    getChildLinks(tree, personId).map((r) => r.childId)
  )
}

export function getPartners(tree: FamilyTree, personId: PersonId): Person[] {
  return resolve(
    tree,
    getPartnerships(tree, personId).map((r) => otherPartner(r, personId))
  )
}

/** People sharing at least one parent with `personId` (includes half-siblings). */
export function getSiblings(tree: FamilyTree, personId: PersonId): Person[] {
  const parentIds = new Set(getParents(tree, personId).map((p) => p.id))
  return resolve(
    tree,
    parentChildLinks(tree)
      .filter((r) => parentIds.has(r.parentId) && r.childId !== personId)
      .map((r) => r.childId)
  )
}

export interface SiblingGroups {
  /** Share every known parent (and the same number of parents). */
  full: Person[]
  /** Share at least one, but not all, parents. */
  half: Person[]
}

export function getSiblingGroups(tree: FamilyTree, personId: PersonId): SiblingGroups {
  const mine = new Set(getParents(tree, personId).map((p) => p.id))
  const full: Person[] = []
  const half: Person[] = []
  for (const sibling of getSiblings(tree, personId)) {
    const theirs = new Set(getParents(tree, sibling.id).map((p) => p.id))
    const same = theirs.size === mine.size && [...mine].every((id) => theirs.has(id))
    ;(same ? full : half).push(sibling)
  }
  return { full, half }
}

function walk(
  tree: FamilyTree,
  start: PersonId,
  next: (id: PersonId) => PersonId[],
  depth: number
): Person[] {
  const seen = new Set<PersonId>([start])
  const order: PersonId[] = []
  let frontier = [start]
  for (let level = 0; level < depth && frontier.length > 0; level++) {
    const upcoming: PersonId[] = []
    for (const id of frontier) {
      for (const n of next(id)) {
        if (seen.has(n)) continue
        seen.add(n)
        order.push(n)
        upcoming.push(n)
      }
    }
    frontier = upcoming
  }
  return resolve(tree, order)
}

/** Ancestors breadth-first (parents, then grandparents …), up to `depth` generations. */
export function getAncestors(tree: FamilyTree, personId: PersonId, depth = Infinity): Person[] {
  return walk(tree, personId, (id) => getParentLinks(tree, id).map((r) => r.parentId), depth)
}

/** Descendants breadth-first, up to `depth` generations. */
export function getDescendants(tree: FamilyTree, personId: PersonId, depth = Infinity): Person[] {
  return walk(tree, personId, (id) => getChildLinks(tree, id).map((r) => r.childId), depth)
}

export function getPartnershipBetween(
  tree: FamilyTree,
  a: PersonId,
  b: PersonId
): PartnershipRelationship | undefined {
  return partnerships(tree).find((r) => r.partnerIds.includes(a) && r.partnerIds.includes(b))
}

/** `true`/`false` when known; inferred as deceased when any death data exists. */
export function isLiving(person: Person): boolean | undefined {
  if (person.living !== undefined) return person.living
  if (person.death?.date || person.death?.place) return false
  return undefined
}

export function displayName(person: Pick<Person, 'givenNames' | 'surname'>): string {
  return [person.givenNames, person.surname]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' ')
}
