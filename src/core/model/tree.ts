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
    relationships: {}
  }
}

function parentChildLinks(tree: FamilyTree): ParentChildRelationship[] {
  return Object.values(tree.relationships).filter(
    (r): r is ParentChildRelationship => r.type === 'parent-child'
  )
}

function partnerships(tree: FamilyTree): PartnershipRelationship[] {
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

export function getParents(tree: FamilyTree, personId: PersonId): Person[] {
  return resolve(
    tree,
    parentChildLinks(tree)
      .filter((r) => r.childId === personId)
      .map((r) => r.parentId)
  )
}

export function getChildren(tree: FamilyTree, personId: PersonId): Person[] {
  return resolve(
    tree,
    parentChildLinks(tree)
      .filter((r) => r.parentId === personId)
      .map((r) => r.childId)
  )
}

export function getPartners(tree: FamilyTree, personId: PersonId): Person[] {
  return resolve(
    tree,
    partnerships(tree)
      .filter((r) => r.partnerIds.includes(personId))
      .map((r) => (r.partnerIds[0] === personId ? r.partnerIds[1] : r.partnerIds[0]))
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
