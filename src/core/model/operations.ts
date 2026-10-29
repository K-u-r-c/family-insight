import { ModelError } from './errors'
import { newId } from './ids'
import { getAncestors, getParentLinks } from './tree'
import type {
  FamilyTree,
  ParentChildKind,
  ParentChildRelationship,
  PartnershipRelationship,
  Person,
  PersonId,
  Relationship,
  RelationshipId
} from './types'

/**
 * Pure, immutable operations on a FamilyTree. Every function returns a new tree
 * and throws `ModelError` when an invariant would be violated.
 */

export interface OpOptions {
  now?: Date
  id?: string
}

export type PersonInput = Omit<Person, 'id' | 'createdAt' | 'updatedAt'>
export type PersonPatch = Partial<Omit<Person, 'id' | 'createdAt' | 'updatedAt'>>

function touch(tree: FamilyTree, timestamp: string): FamilyTree['meta'] {
  return { ...tree.meta, updatedAt: timestamp }
}

function requirePerson(tree: FamilyTree, id: PersonId): Person {
  const person = tree.persons[id]
  if (!person) throw new ModelError('person-not-found', { id })
  return person
}

function requireRelationship(tree: FamilyTree, id: RelationshipId): Relationship {
  const rel = tree.relationships[id]
  if (!rel) throw new ModelError('relationship-not-found', { id })
  return rel
}

/** Removes keys whose value is `undefined`, so patches can clear optional fields. */
function compact<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T
}

export function addPerson(
  tree: FamilyTree,
  input: PersonInput,
  options: OpOptions = {}
): { tree: FamilyTree; person: Person } {
  const timestamp = (options.now ?? new Date()).toISOString()
  const person: Person = compact({
    ...input,
    id: options.id ?? newId(),
    createdAt: timestamp,
    updatedAt: timestamp
  })
  if (tree.persons[person.id]) throw new ModelError('duplicate-id', { id: person.id })
  return {
    person,
    tree: {
      ...tree,
      meta: touch(tree, timestamp),
      persons: { ...tree.persons, [person.id]: person }
    }
  }
}

/** Applies a patch; keys explicitly set to `undefined` are removed. */
export function updatePerson(
  tree: FamilyTree,
  id: PersonId,
  patch: PersonPatch,
  options: OpOptions = {}
): FamilyTree {
  const current = requirePerson(tree, id)
  const timestamp = (options.now ?? new Date()).toISOString()
  const updated: Person = compact({ ...current, ...patch, id, updatedAt: timestamp })
  return { ...tree, meta: touch(tree, timestamp), persons: { ...tree.persons, [id]: updated } }
}

/** Removes a person together with every relationship that references them. */
export function removePerson(tree: FamilyTree, id: PersonId, options: OpOptions = {}): FamilyTree {
  requirePerson(tree, id)
  const timestamp = (options.now ?? new Date()).toISOString()
  const persons = { ...tree.persons }
  delete persons[id]
  const relationships = Object.fromEntries(
    Object.entries(tree.relationships).filter(([, r]) => !involves(r, id))
  )
  const meta = touch(tree, timestamp)
  if (meta.rootPersonId === id) delete meta.rootPersonId
  return { ...tree, meta, persons, relationships }
}

export function involves(rel: Relationship, personId: PersonId): boolean {
  return rel.type === 'parent-child'
    ? rel.parentId === personId || rel.childId === personId
    : rel.partnerIds.includes(personId)
}

function assertParentChildAllowed(
  tree: FamilyTree,
  rel: Omit<ParentChildRelationship, 'id' | 'type'>,
  ignoreId?: RelationshipId
): void {
  requirePerson(tree, rel.parentId)
  requirePerson(tree, rel.childId)
  if (rel.parentId === rel.childId) throw new ModelError('self-relationship')
  const existing = getParentLinks(tree, rel.childId).filter((r) => r.id !== ignoreId)
  if (existing.some((r) => r.parentId === rel.parentId)) {
    throw new ModelError('duplicate-relationship')
  }
  if (rel.kind === 'biological' && existing.filter((r) => r.kind === 'biological').length >= 2) {
    throw new ModelError('too-many-biological-parents')
  }
  // The child must not already be an ancestor of the parent.
  if (getAncestors(tree, rel.parentId).some((p) => p.id === rel.childId)) {
    throw new ModelError('ancestry-cycle')
  }
}

export function addParentChild(
  tree: FamilyTree,
  parentId: PersonId,
  childId: PersonId,
  kind: ParentChildKind = 'biological',
  options: OpOptions = {}
): { tree: FamilyTree; relationship: ParentChildRelationship } {
  assertParentChildAllowed(tree, { parentId, childId, kind })
  const timestamp = (options.now ?? new Date()).toISOString()
  const relationship: ParentChildRelationship = {
    id: options.id ?? newId(),
    type: 'parent-child',
    parentId,
    childId,
    kind
  }
  return {
    relationship,
    tree: {
      ...tree,
      meta: touch(tree, timestamp),
      relationships: { ...tree.relationships, [relationship.id]: relationship }
    }
  }
}

function assertPartnershipAllowed(
  tree: FamilyTree,
  a: PersonId,
  b: PersonId,
  ignoreId?: RelationshipId
): void {
  requirePerson(tree, a)
  requirePerson(tree, b)
  if (a === b) throw new ModelError('self-relationship')
  const duplicate = Object.values(tree.relationships).some(
    (r) =>
      r.id !== ignoreId &&
      r.type === 'partnership' &&
      r.partnerIds.includes(a) &&
      r.partnerIds.includes(b)
  )
  if (duplicate) throw new ModelError('duplicate-relationship')
}

export function addPartnership(
  tree: FamilyTree,
  a: PersonId,
  b: PersonId,
  details: Partial<Omit<PartnershipRelationship, 'id' | 'type' | 'partnerIds'>> = {},
  options: OpOptions = {}
): { tree: FamilyTree; relationship: PartnershipRelationship } {
  assertPartnershipAllowed(tree, a, b)
  const timestamp = (options.now ?? new Date()).toISOString()
  const relationship: PartnershipRelationship = compact({
    kind: 'marriage',
    ...details,
    id: options.id ?? newId(),
    type: 'partnership',
    partnerIds: [a, b]
  })
  return {
    relationship,
    tree: {
      ...tree,
      meta: touch(tree, timestamp),
      relationships: { ...tree.relationships, [relationship.id]: relationship }
    }
  }
}

export type RelationshipPatch =
  | Partial<Omit<ParentChildRelationship, 'id' | 'type'>>
  | Partial<Omit<PartnershipRelationship, 'id' | 'type'>>

export function updateRelationship(
  tree: FamilyTree,
  id: RelationshipId,
  patch: RelationshipPatch,
  options: OpOptions = {}
): FamilyTree {
  const current = requireRelationship(tree, id)
  const updated = compact({ ...current, ...patch, id, type: current.type }) as Relationship
  if (updated.type === 'parent-child') {
    assertParentChildAllowed(tree, updated, id)
  } else {
    assertPartnershipAllowed(tree, updated.partnerIds[0], updated.partnerIds[1], id)
  }
  const timestamp = (options.now ?? new Date()).toISOString()
  return {
    ...tree,
    meta: touch(tree, timestamp),
    relationships: { ...tree.relationships, [id]: updated }
  }
}

export function removeRelationship(
  tree: FamilyTree,
  id: RelationshipId,
  options: OpOptions = {}
): FamilyTree {
  requireRelationship(tree, id)
  const timestamp = (options.now ?? new Date()).toISOString()
  const relationships = { ...tree.relationships }
  delete relationships[id]
  return { ...tree, meta: touch(tree, timestamp), relationships }
}

export function setRootPerson(tree: FamilyTree, id: PersonId | undefined): FamilyTree {
  if (id !== undefined) requirePerson(tree, id)
  const meta = { ...tree.meta }
  if (id === undefined) delete meta.rootPersonId
  else meta.rootPersonId = id
  return { ...tree, meta }
}

export function renameTree(tree: FamilyTree, name: string, options: OpOptions = {}): FamilyTree {
  const timestamp = (options.now ?? new Date()).toISOString()
  return { ...tree, meta: { ...touch(tree, timestamp), name } }
}
