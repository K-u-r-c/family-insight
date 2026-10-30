import {
  addParentChild,
  addPartnership,
  addPerson,
  addPersonEvent,
  mergeTrees,
  movePersonEvent,
  removePerson,
  removePersonEvent,
  removeRelationship,
  renameTree,
  setRootPerson,
  updatePerson,
  updatePersonEvent,
  updateRelationship,
  type PersonEventInput,
  type PersonEventPatch,
  type PersonInput,
  type PersonPatch,
  type RelationshipPatch
} from '@core/model/operations'
import {
  addCitation,
  addRepository,
  addSource,
  removeCitation,
  removeRepository,
  removeSource,
  updateCitation,
  updateRepository,
  updateSource,
  type CitationInput,
  type CitationPatch,
  type CitationTarget,
  type RepositoryInput,
  type RepositoryPatch,
  type SourceInput,
  type SourcePatch
} from '@core/model/sources'
import {
  addMedia,
  addPersonMedia,
  mediaUsage,
  movePersonMedia,
  removeMedia,
  removePersonMedia,
  setMediaPeople,
  setPortrait,
  updateMedia,
  type MediaInput,
  type MediaPatch
} from '@core/model/media'
import type {
  Citation,
  CitationId,
  FamilyTree,
  MediaId,
  MediaItem,
  ParentChildKind,
  PartnershipRelationship,
  Person,
  PersonEvent,
  PersonEventId,
  PersonId,
  Relationship,
  RelationshipId,
  Repository,
  RepositoryId,
  Source,
  SourceId
} from '@core/model/types'

/**
 * A document change. `run` must be pure: it receives the current tree and returns the next
 * one (plus an optional result and the person to select afterwards).
 */
export interface Command<R = void> {
  /** i18n key describing the change (e.g. for "Undo …" labels). */
  label: string
  coalesceKey?: string
  run: (tree: FamilyTree) => { tree: FamilyTree; result: R; select?: PersonId | null }
}

export const renameTreeCommand = (name: string): Command => ({
  label: 'history.renameTree',
  coalesceKey: 'meta.name',
  run: (tree) => ({ tree: renameTree(tree, name), result: undefined })
})

export const addPersonCommand = (input: PersonInput): Command<Person> => ({
  label: 'history.addPerson',
  run: (tree) => {
    const { tree: next, person } = addPerson(tree, input)
    return { tree: next, result: person, select: person.id }
  }
})

export const updatePersonCommand = (id: PersonId, patch: PersonPatch): Command => ({
  label: 'history.editPerson',
  coalesceKey: `${id}:${Object.keys(patch).sort().join(',')}`,
  run: (tree) => ({ tree: updatePerson(tree, id, patch), result: undefined })
})

export const addEventCommand = (
  personId: PersonId,
  input: PersonEventInput
): Command<PersonEvent> => ({
  label: 'history.addEvent',
  run: (tree) => {
    const { tree: next, event } = addPersonEvent(tree, personId, input)
    return { tree: next, result: event }
  }
})

export const updateEventCommand = (
  personId: PersonId,
  eventId: PersonEventId,
  patch: PersonEventPatch
): Command => ({
  label: 'history.editEvent',
  coalesceKey: `${personId}:event:${eventId}:${Object.keys(patch).sort().join(',')}`,
  run: (tree) => ({ tree: updatePersonEvent(tree, personId, eventId, patch), result: undefined })
})

export const removeEventCommand = (personId: PersonId, eventId: PersonEventId): Command => ({
  label: 'history.removeEvent',
  run: (tree) => ({ tree: removePersonEvent(tree, personId, eventId), result: undefined })
})

export const moveEventCommand = (
  personId: PersonId,
  eventId: PersonEventId,
  toIndex: number
): Command => ({
  label: 'history.moveEvent',
  run: (tree) => ({ tree: movePersonEvent(tree, personId, eventId, toIndex), result: undefined })
})

export const addSourceCommand = (input: SourceInput): Command<Source> => ({
  label: 'history.addSource',
  run: (tree) => {
    const { tree: next, source } = addSource(tree, input)
    return { tree: next, result: source }
  }
})

export const updateSourceCommand = (id: SourceId, patch: SourcePatch): Command => ({
  label: 'history.editSource',
  coalesceKey: `source:${id}:${Object.keys(patch).sort().join(',')}`,
  run: (tree) => ({ tree: updateSource(tree, id, patch), result: undefined })
})

/** Deletes a source and all its citations in one undoable step. */
export const removeSourceCommand = (id: SourceId): Command => ({
  label: 'history.removeSource',
  run: (tree) => ({ tree: removeSource(tree, id), result: undefined })
})

export const addRepositoryCommand = (input: RepositoryInput): Command<Repository> => ({
  label: 'history.addRepository',
  run: (tree) => {
    const { tree: next, repository } = addRepository(tree, input)
    return { tree: next, result: repository }
  }
})

export const updateRepositoryCommand = (id: RepositoryId, patch: RepositoryPatch): Command => ({
  label: 'history.editRepository',
  coalesceKey: `repository:${id}:${Object.keys(patch).sort().join(',')}`,
  run: (tree) => ({ tree: updateRepository(tree, id, patch), result: undefined })
})

export const removeRepositoryCommand = (id: RepositoryId): Command => ({
  label: 'history.removeRepository',
  run: (tree) => ({ tree: removeRepository(tree, id), result: undefined })
})

export const addCitationCommand = (
  target: CitationTarget,
  input: CitationInput
): Command<Citation> => ({
  label: 'history.addCitation',
  run: (tree) => {
    const { tree: next, citation } = addCitation(tree, target, input)
    return { tree: next, result: citation }
  }
})

export const updateCitationCommand = (
  target: CitationTarget,
  citationId: CitationId,
  patch: CitationPatch
): Command => ({
  label: 'history.editCitation',
  coalesceKey: `citation:${citationId}:${Object.keys(patch).sort().join(',')}`,
  run: (tree) => ({ tree: updateCitation(tree, target, citationId, patch), result: undefined })
})

export const removeCitationCommand = (target: CitationTarget, citationId: CitationId): Command => ({
  label: 'history.removeCitation',
  run: (tree) => ({ tree: removeCitation(tree, target, citationId), result: undefined })
})

export const removePersonCommand = (id: PersonId): Command => ({
  label: 'history.deletePerson',
  run: (tree) => ({ tree: removePerson(tree, id), result: undefined, select: null })
})

export const addParentChildCommand = (
  parentId: PersonId,
  childId: PersonId,
  kind: ParentChildKind = 'biological'
): Command<Relationship> => ({
  label: 'history.addRelationship',
  run: (tree) => {
    const { tree: next, relationship } = addParentChild(tree, parentId, childId, kind)
    return { tree: next, result: relationship }
  }
})

export const addPartnershipCommand = (
  a: PersonId,
  b: PersonId,
  details: Partial<Omit<PartnershipRelationship, 'id' | 'type' | 'partnerIds'>> = {}
): Command<Relationship> => ({
  label: 'history.addRelationship',
  run: (tree) => {
    const { tree: next, relationship } = addPartnership(tree, a, b, details)
    return { tree: next, result: relationship }
  }
})

export const updateRelationshipCommand = (
  id: RelationshipId,
  patch: RelationshipPatch
): Command => ({
  label: 'history.editRelationship',
  coalesceKey: `${id}:${Object.keys(patch).sort().join(',')}`,
  run: (tree) => ({ tree: updateRelationship(tree, id, patch), result: undefined })
})

export const removeRelationshipCommand = (id: RelationshipId): Command => ({
  label: 'history.removeRelationship',
  run: (tree) => ({ tree: removeRelationship(tree, id), result: undefined })
})

export const mergeTreeCommand = (other: FamilyTree): Command => ({
  label: 'history.importCsv',
  run: (tree) => ({ tree: mergeTrees(tree, other), result: undefined })
})

export const setRootCommand = (id: PersonId | undefined): Command => ({
  label: 'history.setRoot',
  run: (tree) => ({ tree: setRootPerson(tree, id), result: undefined })
})

export const addMediaCommand = (input: MediaInput): Command<MediaItem> => ({
  label: 'history.addMedia',
  run: (tree) => {
    const { tree: next, media } = addMedia(tree, input)
    return { tree: next, result: media }
  }
})

export const updateMediaCommand = (id: MediaId, patch: MediaPatch): Command => ({
  label: 'history.editMedia',
  coalesceKey: `media:${id}:${Object.keys(patch).sort().join(',')}`,
  run: (tree) => ({ tree: updateMedia(tree, id, patch), result: undefined })
})

/** Deletes a media item only if nothing refers to it any more (after detaching it). */
export const removeMediaIfUnusedCommand = (id: MediaId): Command => ({
  label: 'history.removeMedia',
  run: (tree) => ({
    tree: tree.media[id] && mediaUsage(tree, id) === 0 ? removeMedia(tree, id) : tree,
    result: undefined
  })
})

export const removeMediaCommand = (id: MediaId): Command => ({
  label: 'history.removeMedia',
  run: (tree) => ({ tree: removeMedia(tree, id), result: undefined })
})

/**
 * Sets a person's portrait to a new media item (`null` removes it). The previous portrait
 * leaves the library when nothing else uses it.
 */
export const setPortraitCommand = (personId: PersonId, input: MediaInput | null): Command => ({
  label: input ? 'history.setPortrait' : 'history.removePortrait',
  run: (initial) => {
    let tree = initial
    const previous = tree.persons[personId]?.portraitMediaId
    let mediaId: MediaId | undefined
    if (input) {
      const added = addMedia(tree, input)
      tree = added.tree
      mediaId = added.media.id
    }
    tree = setPortrait(tree, personId, mediaId)
    if (previous && tree.media[previous] && mediaUsage(tree, previous) === 0) {
      tree = removeMedia(tree, previous)
    }
    return { tree, result: undefined }
  }
})

/** Adds new media items (already in the library) to a person's gallery as one step. */
export const addPersonMediaCommand = (
  personId: PersonId,
  inputs: MediaInput[]
): Command<MediaItem[]> => ({
  label: 'history.addMedia',
  run: (initial) => {
    let tree = initial
    const items: MediaItem[] = []
    for (const input of inputs) {
      const added = addMedia(tree, input)
      tree = added.tree
      items.push(added.media)
    }
    tree = addPersonMedia(
      tree,
      personId,
      items.map((m) => m.id)
    )
    return { tree, result: items }
  }
})

/**
 * Takes a media item out of a person's gallery; when nothing else uses it any more it leaves
 * the library too.
 */
export const removePersonMediaCommand = (personId: PersonId, mediaId: MediaId): Command => ({
  label: 'history.removeMedia',
  run: (initial) => {
    let tree = removePersonMedia(initial, personId, mediaId)
    if (tree.media[mediaId] && mediaUsage(tree, mediaId) === 0) tree = removeMedia(tree, mediaId)
    return { tree, result: undefined }
  }
})

export const movePersonMediaCommand = (
  personId: PersonId,
  mediaId: MediaId,
  toIndex: number
): Command => ({
  label: 'history.moveMedia',
  run: (tree) => ({ tree: movePersonMedia(tree, personId, mediaId, toIndex), result: undefined })
})

export const setMediaPeopleCommand = (mediaId: MediaId, personIds: PersonId[]): Command => ({
  label: 'history.editMedia',
  run: (tree) => ({ tree: setMediaPeople(tree, mediaId, personIds), result: undefined })
})

/** Runs several steps as a single undoable command (e.g. "add father" = person + link). */
export function composeCommands<R>(
  label: string,
  build: (tree: FamilyTree, run: <T>(cmd: Command<T>) => T) => R
): Command<R> {
  return {
    label,
    run: (initial) => {
      let tree = initial
      let select: PersonId | null | undefined
      const run = <T>(cmd: Command<T>): T => {
        const out = cmd.run(tree)
        tree = out.tree
        if (out.select !== undefined) select = out.select
        return out.result
      }
      const result = build(initial, run)
      return { tree, result, select }
    }
  }
}
