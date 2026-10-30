import { ModelError } from './errors'
import { newId } from './ids'
import { getAncestors, getChildren, getParentLinks, getParents, getPartners } from './tree'
import type {
  FamilyTree,
  ParentChildKind,
  ParentChildRelationship,
  PartnershipRelationship,
  Person,
  PersonEvent,
  PersonEventId,
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

/** New person data; `events` defaults to an empty list. */
export type PersonInput = Omit<Person, 'id' | 'createdAt' | 'updatedAt' | 'events'> & {
  events?: PersonEvent[]
}
/** Events are changed with the event operations below, not through a person patch. */
export type PersonPatch = Partial<Omit<Person, 'id' | 'createdAt' | 'updatedAt' | 'events'>>
/** New event data (the id is generated). */
export type PersonEventInput = Omit<PersonEvent, 'id'>
export type PersonEventPatch = Partial<Omit<PersonEvent, 'id'>>

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
    events: input.events ?? [],
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

/**
 * Removes a person together with every relationship that references them. If they were the
 * root person, the closest relative (partner, child, parent) or any remaining person becomes root.
 */
export function removePerson(tree: FamilyTree, id: PersonId, options: OpOptions = {}): FamilyTree {
  requirePerson(tree, id)
  const timestamp = (options.now ?? new Date()).toISOString()
  const successor =
    tree.meta.rootPersonId === id
      ? [
          ...getPartners(tree, id),
          ...getChildren(tree, id),
          ...getParents(tree, id),
          ...Object.values(tree.persons).filter((p) => p.id !== id)
        ][0]?.id
      : undefined
  const persons = { ...tree.persons }
  delete persons[id]
  const relationships = Object.fromEntries(
    Object.entries(tree.relationships).filter(([, r]) => !involves(r, id))
  )
  const meta = touch(tree, timestamp)
  if (meta.rootPersonId === id) {
    if (successor) meta.rootPersonId = successor
    else delete meta.rootPersonId
  }
  return { ...tree, meta, persons, relationships }
}

/** Number of relationships that reference a person. */
export function relationshipCount(tree: FamilyTree, id: PersonId): number {
  return Object.values(tree.relationships).filter((r) => involves(r, id)).length
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
  // The child must not already be an ancestor of the parent.
  if (getAncestors(tree, rel.parentId).some((p) => p.id === rel.childId)) {
    throw new ModelError('ancestry-cycle')
  }
  if (rel.kind === 'biological' && existing.filter((r) => r.kind === 'biological').length >= 2) {
    throw new ModelError('too-many-biological-parents')
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

/** Adds every person and relationship of `other` (ids must not clash) to `tree`. */
export function mergeTrees(
  tree: FamilyTree,
  other: FamilyTree,
  options: OpOptions = {}
): FamilyTree {
  const timestamp = (options.now ?? new Date()).toISOString()
  for (const id of [
    ...Object.keys(other.persons),
    ...Object.keys(other.relationships),
    ...Object.keys(other.sources),
    ...Object.keys(other.repositories),
    ...Object.keys(other.media)
  ]) {
    if (
      tree.persons[id] ||
      tree.relationships[id] ||
      tree.sources[id] ||
      tree.repositories[id] ||
      tree.media[id]
    ) {
      throw new ModelError('duplicate-id', { id })
    }
  }
  return {
    ...tree,
    meta: touch(tree, timestamp),
    persons: { ...tree.persons, ...other.persons },
    relationships: { ...tree.relationships, ...other.relationships },
    sources: { ...tree.sources, ...other.sources },
    repositories: { ...tree.repositories, ...other.repositories },
    media: { ...tree.media, ...other.media }
  }
}

export function renameTree(tree: FamilyTree, name: string, options: OpOptions = {}): FamilyTree {
  const timestamp = (options.now ?? new Date()).toISOString()
  return { ...tree, meta: { ...touch(tree, timestamp), name } }
}

function requireEvent(person: Person, eventId: PersonEventId): number {
  const index = person.events.findIndex((e) => e.id === eventId)
  if (index < 0) throw new ModelError('event-not-found', { id: eventId })
  return index
}

function withEvents(
  tree: FamilyTree,
  personId: PersonId,
  events: PersonEvent[],
  timestamp: string
): FamilyTree {
  const person = requirePerson(tree, personId)
  return {
    ...tree,
    meta: touch(tree, timestamp),
    persons: { ...tree.persons, [personId]: { ...person, events, updatedAt: timestamp } }
  }
}

/** Adds a life event at the end of the person's list. */
export function addPersonEvent(
  tree: FamilyTree,
  personId: PersonId,
  input: PersonEventInput,
  options: OpOptions = {}
): { tree: FamilyTree; event: PersonEvent } {
  const person = requirePerson(tree, personId)
  const timestamp = (options.now ?? new Date()).toISOString()
  const event: PersonEvent = compact({ ...input, id: options.id ?? newId() })
  if (person.events.some((e) => e.id === event.id)) {
    throw new ModelError('duplicate-id', { id: event.id })
  }
  return { event, tree: withEvents(tree, personId, [...person.events, event], timestamp) }
}

/** Applies a patch to an event; keys explicitly set to `undefined` are removed. */
export function updatePersonEvent(
  tree: FamilyTree,
  personId: PersonId,
  eventId: PersonEventId,
  patch: PersonEventPatch,
  options: OpOptions = {}
): FamilyTree {
  const person = requirePerson(tree, personId)
  const index = requireEvent(person, eventId)
  const events = [...person.events]
  events[index] = compact({ ...events[index]!, ...patch, id: eventId })
  return withEvents(tree, personId, events, (options.now ?? new Date()).toISOString())
}

export function removePersonEvent(
  tree: FamilyTree,
  personId: PersonId,
  eventId: PersonEventId,
  options: OpOptions = {}
): FamilyTree {
  const person = requirePerson(tree, personId)
  requireEvent(person, eventId)
  const events = person.events.filter((e) => e.id !== eventId)
  return withEvents(tree, personId, events, (options.now ?? new Date()).toISOString())
}

/** Moves an event to another position in the person's list (clamped to the list). */
export function movePersonEvent(
  tree: FamilyTree,
  personId: PersonId,
  eventId: PersonEventId,
  toIndex: number,
  options: OpOptions = {}
): FamilyTree {
  const person = requirePerson(tree, personId)
  const from = requireEvent(person, eventId)
  const to = Math.max(0, Math.min(person.events.length - 1, toIndex))
  if (from === to) return tree
  const events = [...person.events]
  const [event] = events.splice(from, 1)
  events.splice(to, 0, event!)
  return withEvents(tree, personId, events, (options.now ?? new Date()).toISOString())
}
