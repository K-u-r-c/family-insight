/**
 * Sources, repositories and citations. A citation is stored next to the fact it supports; a
 * `CitationTarget` addresses that fact (the person in general, birth, death, a life event, a
 * relationship or the start/end of a partnership).
 */
import { ModelError } from './errors'
import { newId } from './ids'
import type {
  Citation,
  CitationId,
  FamilyTree,
  LifeEvent,
  Person,
  PersonEventId,
  PersonId,
  Relationship,
  RelationshipId,
  Repository,
  RepositoryId,
  Source,
  SourceId
} from './types'

export type CitationTarget =
  | { kind: 'person'; personId: PersonId }
  | { kind: 'birth'; personId: PersonId }
  | { kind: 'death'; personId: PersonId }
  | { kind: 'event'; personId: PersonId; eventId: PersonEventId }
  | { kind: 'relationship'; relationshipId: RelationshipId }
  | { kind: 'partnership-start'; relationshipId: RelationshipId }
  | { kind: 'partnership-end'; relationshipId: RelationshipId }

export type SourceInput = Omit<Source, 'id'>
export type SourcePatch = Partial<SourceInput>
export type RepositoryInput = Omit<Repository, 'id'>
export type RepositoryPatch = Partial<RepositoryInput>
export type CitationInput = Omit<Citation, 'id'>
export type CitationPatch = Partial<CitationInput>

interface Options {
  id?: string
  now?: Date
}

function compact<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T
}

function touched(tree: FamilyTree, now?: Date): FamilyTree['meta'] {
  return { ...tree.meta, updatedAt: (now ?? new Date()).toISOString() }
}

function withList<T extends { citations?: Citation[] }>(obj: T, list: Citation[]): T {
  const next = { ...obj }
  if (list.length) next.citations = list
  else delete next.citations
  return next
}

// ---------------------------------------------------------------------------------------------
// Reading and writing the citations of one fact

/** The citations stored for a fact (empty when the fact or its citations don't exist). */
export function getCitations(tree: FamilyTree, target: CitationTarget): Citation[] {
  switch (target.kind) {
    case 'person':
      return tree.persons[target.personId]?.citations ?? []
    case 'birth':
      return tree.persons[target.personId]?.birth?.citations ?? []
    case 'death':
      return tree.persons[target.personId]?.death?.citations ?? []
    case 'event':
      return (
        tree.persons[target.personId]?.events.find((e) => e.id === target.eventId)?.citations ?? []
      )
    case 'relationship':
      return tree.relationships[target.relationshipId]?.citations ?? []
    case 'partnership-start':
    case 'partnership-end': {
      const rel = tree.relationships[target.relationshipId]
      if (rel?.type !== 'partnership') return []
      return (target.kind === 'partnership-start' ? rel.start : rel.end)?.citations ?? []
    }
  }
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

function eventWith(event: LifeEvent | undefined, list: Citation[]): LifeEvent | undefined {
  const next = withList(event ?? {}, list)
  return Object.keys(next).length ? next : undefined
}

/** Replaces the citations of a fact (an empty list removes the field). */
function setCitations(tree: FamilyTree, target: CitationTarget, list: Citation[]): FamilyTree {
  const persons = { ...tree.persons }
  const relationships = { ...tree.relationships }
  switch (target.kind) {
    case 'person':
    case 'birth':
    case 'death':
    case 'event': {
      const person = requirePerson(tree, target.personId)
      let next: Person
      if (target.kind === 'person') next = withList(person, list)
      else if (target.kind === 'event') {
        const index = person.events.findIndex((e) => e.id === target.eventId)
        if (index < 0) throw new ModelError('event-not-found', { id: target.eventId })
        const events = [...person.events]
        events[index] = withList(events[index]!, list)
        next = { ...person, events }
      } else {
        next = compact({ ...person, [target.kind]: eventWith(person[target.kind], list) })
      }
      persons[person.id] = next
      break
    }
    case 'relationship': {
      const rel = requireRelationship(tree, target.relationshipId)
      relationships[rel.id] = withList(rel, list)
      break
    }
    case 'partnership-start':
    case 'partnership-end': {
      const rel = requireRelationship(tree, target.relationshipId)
      if (rel.type !== 'partnership') throw new ModelError('relationship-not-found', { id: rel.id })
      const key = target.kind === 'partnership-start' ? 'start' : 'end'
      relationships[rel.id] = compact({ ...rel, [key]: eventWith(rel[key], list) })
      break
    }
  }
  return { ...tree, persons, relationships }
}

export function addCitation(
  tree: FamilyTree,
  target: CitationTarget,
  input: CitationInput,
  options: Options = {}
): { tree: FamilyTree; citation: Citation } {
  if (!tree.sources[input.sourceId]) {
    throw new ModelError('source-not-found', { id: input.sourceId })
  }
  const citation: Citation = compact({ ...input, id: options.id ?? newId() })
  const next = setCitations(tree, target, [...getCitations(tree, target), citation])
  return { citation, tree: { ...next, meta: touched(tree, options.now) } }
}

export function updateCitation(
  tree: FamilyTree,
  target: CitationTarget,
  citationId: CitationId,
  patch: CitationPatch,
  options: Options = {}
): FamilyTree {
  const list = getCitations(tree, target)
  const index = list.findIndex((c) => c.id === citationId)
  if (index < 0) throw new ModelError('citation-not-found', { id: citationId })
  if (patch.sourceId !== undefined && !tree.sources[patch.sourceId]) {
    throw new ModelError('source-not-found', { id: patch.sourceId })
  }
  const next = [...list]
  next[index] = compact({ ...next[index]!, ...patch, id: citationId })
  return { ...setCitations(tree, target, next), meta: touched(tree, options.now) }
}

export function removeCitation(
  tree: FamilyTree,
  target: CitationTarget,
  citationId: CitationId,
  options: Options = {}
): FamilyTree {
  const list = getCitations(tree, target)
  if (!list.some((c) => c.id === citationId)) {
    throw new ModelError('citation-not-found', { id: citationId })
  }
  const next = list.filter((c) => c.id !== citationId)
  return { ...setCitations(tree, target, next), meta: touched(tree, options.now) }
}

// ---------------------------------------------------------------------------------------------
// Visiting every citation

/** Every place in the tree that can hold citations. */
export function citationTargets(tree: FamilyTree): CitationTarget[] {
  const targets: CitationTarget[] = []
  for (const person of Object.values(tree.persons)) {
    targets.push({ kind: 'person', personId: person.id })
    targets.push({ kind: 'birth', personId: person.id })
    targets.push({ kind: 'death', personId: person.id })
    for (const event of person.events) {
      targets.push({ kind: 'event', personId: person.id, eventId: event.id })
    }
  }
  for (const rel of Object.values(tree.relationships)) {
    targets.push({ kind: 'relationship', relationshipId: rel.id })
    if (rel.type === 'partnership') {
      targets.push({ kind: 'partnership-start', relationshipId: rel.id })
      targets.push({ kind: 'partnership-end', relationshipId: rel.id })
    }
  }
  return targets
}

/** Keeps only the citations for which `keep` returns true, everywhere in the tree. */
function filterCitations(
  tree: FamilyTree,
  keep: (citation: Citation) => boolean
): { tree: FamilyTree; removed: number } {
  let next = tree
  let removed = 0
  for (const target of citationTargets(tree)) {
    const list = getCitations(next, target)
    const kept = list.filter(keep)
    if (kept.length !== list.length) {
      removed += list.length - kept.length
      next = setCitations(next, target, kept)
    }
  }
  return { tree: next, removed }
}

/** All citations of a source, with the fact each one supports. */
export function getCitationsForSource(
  tree: FamilyTree,
  sourceId: SourceId
): { target: CitationTarget; citation: Citation }[] {
  return citationTargets(tree).flatMap((target) =>
    getCitations(tree, target)
      .filter((c) => c.sourceId === sourceId)
      .map((citation) => ({ target, citation }))
  )
}

/** Recorded facts (birth, death, life events, relationships) that cite no source. */
export function factsWithoutSource(tree: FamilyTree): CitationTarget[] {
  return citationTargets(tree).filter((target) => {
    if (getCitations(tree, target).length) return false
    switch (target.kind) {
      case 'person':
        return false
      case 'birth':
      case 'death': {
        const fact = tree.persons[target.personId]?.[target.kind]
        return !!(fact?.date || fact?.place)
      }
      case 'event':
      case 'relationship':
        return true
      case 'partnership-start':
      case 'partnership-end': {
        const rel = tree.relationships[target.relationshipId]
        if (rel?.type !== 'partnership') return false
        const fact = target.kind === 'partnership-start' ? rel.start : rel.end
        return !!(fact?.date || fact?.place)
      }
    }
  })
}

/** Source ids cited anywhere for a person (their own facts and their relationships). */
export function sourcesOfPerson(tree: FamilyTree, personId: PersonId): Set<SourceId> {
  const ids = new Set<SourceId>()
  const person = tree.persons[personId]
  if (!person) return ids
  const add = (list?: Citation[]): void => list?.forEach((c) => ids.add(c.sourceId))
  add(person.citations)
  add(person.birth?.citations)
  add(person.death?.citations)
  person.events.forEach((e) => add(e.citations))
  for (const rel of Object.values(tree.relationships)) {
    const involved =
      rel.type === 'parent-child'
        ? rel.parentId === personId || rel.childId === personId
        : rel.partnerIds.includes(personId)
    if (!involved) continue
    add(rel.citations)
    if (rel.type === 'partnership') {
      add(rel.start?.citations)
      add(rel.end?.citations)
    }
  }
  return ids
}

// ---------------------------------------------------------------------------------------------
// Sources and repositories

export function addSource(
  tree: FamilyTree,
  input: SourceInput,
  options: Options = {}
): { tree: FamilyTree; source: Source } {
  const source: Source = compact({ ...input, id: options.id ?? newId() })
  if (tree.sources[source.id]) throw new ModelError('duplicate-id', { id: source.id })
  if (source.repositoryId && !tree.repositories[source.repositoryId]) {
    throw new ModelError('repository-not-found', { id: source.repositoryId })
  }
  return {
    source,
    tree: {
      ...tree,
      meta: touched(tree, options.now),
      sources: { ...tree.sources, [source.id]: source }
    }
  }
}

export function updateSource(
  tree: FamilyTree,
  id: SourceId,
  patch: SourcePatch,
  options: Options = {}
): FamilyTree {
  const source = tree.sources[id]
  if (!source) throw new ModelError('source-not-found', { id })
  if (patch.repositoryId && !tree.repositories[patch.repositoryId]) {
    throw new ModelError('repository-not-found', { id: patch.repositoryId })
  }
  return {
    ...tree,
    meta: touched(tree, options.now),
    sources: { ...tree.sources, [id]: compact({ ...source, ...patch, id }) }
  }
}

/** Deletes a source together with every citation of it. */
export function removeSource(tree: FamilyTree, id: SourceId, options: Options = {}): FamilyTree {
  if (!tree.sources[id]) throw new ModelError('source-not-found', { id })
  const sources = { ...tree.sources }
  delete sources[id]
  const { tree: next } = filterCitations(tree, (c) => c.sourceId !== id)
  return { ...next, sources, meta: touched(tree, options.now) }
}

export function addRepository(
  tree: FamilyTree,
  input: RepositoryInput,
  options: Options = {}
): { tree: FamilyTree; repository: Repository } {
  const repository: Repository = compact({ ...input, id: options.id ?? newId() })
  if (tree.repositories[repository.id]) throw new ModelError('duplicate-id', { id: repository.id })
  return {
    repository,
    tree: {
      ...tree,
      meta: touched(tree, options.now),
      repositories: { ...tree.repositories, [repository.id]: repository }
    }
  }
}

export function updateRepository(
  tree: FamilyTree,
  id: RepositoryId,
  patch: RepositoryPatch,
  options: Options = {}
): FamilyTree {
  const repository = tree.repositories[id]
  if (!repository) throw new ModelError('repository-not-found', { id })
  return {
    ...tree,
    meta: touched(tree, options.now),
    repositories: { ...tree.repositories, [id]: compact({ ...repository, ...patch, id }) }
  }
}

/** Deletes a repository; sources kept there lose their repository link. */
export function removeRepository(
  tree: FamilyTree,
  id: RepositoryId,
  options: Options = {}
): FamilyTree {
  if (!tree.repositories[id]) throw new ModelError('repository-not-found', { id })
  const repositories = { ...tree.repositories }
  delete repositories[id]
  const sources = Object.fromEntries(
    Object.entries(tree.sources).map(([key, s]) => {
      if (s.repositoryId !== id) return [key, s]
      const next = { ...s }
      delete next.repositoryId
      return [key, next]
    })
  )
  return { ...tree, repositories, sources, meta: touched(tree, options.now) }
}

/**
 * Repairs references after loading a file: drops citations of sources that don't exist and
 * repository links to missing repositories. Returns how many citations were dropped.
 */
export function repairSourceReferences(tree: FamilyTree): {
  tree: FamilyTree
  removedCitations: number
} {
  const { tree: next, removed } = filterCitations(tree, (c) => !!tree.sources[c.sourceId])
  const sources = Object.fromEntries(
    Object.entries(next.sources).map(([key, s]) => {
      if (!s.repositoryId || next.repositories[s.repositoryId]) return [key, s]
      const fixed = { ...s }
      delete fixed.repositoryId
      return [key, fixed]
    })
  )
  return { tree: { ...next, sources }, removedCitations: removed }
}
