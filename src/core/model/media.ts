/**
 * Media library: photos and scanned documents of the tree. A `MediaItem` describes one file;
 * its bytes live outside the JSON, content-addressed by SHA-256 (`media/<hash>.<ext>` in the
 * `.finsight` container), so a scan used twice is stored once.
 */
import { ModelError } from './errors'
import { newId } from './ids'
import { mapCitations } from './sources'
import {
  MEDIA_TYPES,
  type FamilyTree,
  type MediaId,
  type MediaItem,
  type MediaMime,
  type Person,
  type PersonId
} from './types'

/** Largest file accepted into the library. */
export const MAX_MEDIA_BYTES = 25 * 1024 * 1024

export type MediaInput = Omit<MediaItem, 'id'>
export type MediaPatch = Partial<Omit<MediaItem, 'id' | 'hash' | 'mime'>>

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

const startsWith = (bytes: Uint8Array, prefix: number[], at = 0): boolean =>
  prefix.every((b, i) => bytes[at + i] === b)

/** Detects the type of a file from its first bytes (never trust the extension). */
export function sniffMime(bytes: Uint8Array): MediaMime | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg'
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png'
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38])) return 'image/gif'
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8))
    return 'image/webp'
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return 'application/pdf'
  return null
}

export const isImage = (mime: string): boolean => mime.startsWith('image/')

const HASH = /^[0-9a-f]{64}$/
export const isMediaHash = (value: unknown): value is string =>
  typeof value === 'string' && HASH.test(value)

/** Name of the media file inside the container. */
export const mediaEntryName = (hash: string, mime: MediaMime): string =>
  `media/${hash}.${MEDIA_TYPES[mime]}`

export function addMedia(
  tree: FamilyTree,
  input: MediaInput,
  options: Options = {}
): { tree: FamilyTree; media: MediaItem } {
  const media: MediaItem = compact({ ...input, id: options.id ?? newId() })
  if (tree.media[media.id]) throw new ModelError('duplicate-id', { id: media.id })
  return {
    media,
    tree: { ...tree, meta: touched(tree, options.now), media: { ...tree.media, [media.id]: media } }
  }
}

export function updateMedia(
  tree: FamilyTree,
  id: MediaId,
  patch: MediaPatch,
  options: Options = {}
): FamilyTree {
  const media = tree.media[id]
  if (!media) throw new ModelError('media-not-found', { id })
  return {
    ...tree,
    meta: touched(tree, options.now),
    media: {
      ...tree.media,
      [id]: compact({ ...media, ...patch, id, hash: media.hash, mime: media.mime })
    }
  }
}

function withoutIds<T extends { mediaIds?: MediaId[] }>(obj: T, drop: (id: MediaId) => boolean): T {
  if (!obj.mediaIds?.some(drop)) return obj
  const next = { ...obj }
  const kept = obj.mediaIds.filter((id) => !drop(id))
  if (kept.length) next.mediaIds = kept
  else delete next.mediaIds
  return next
}

function unlinkPerson(person: Person, drop: (id: MediaId) => boolean): Person {
  let next = withoutIds(person, drop)
  if (next.portraitMediaId && drop(next.portraitMediaId)) {
    next = { ...next }
    delete next.portraitMediaId
  }
  return next
}

/** Removes references for which `drop` is true from people, sources and citations. */
function unlinkMedia(
  tree: FamilyTree,
  drop: (id: MediaId) => boolean
): { tree: FamilyTree; removed: number } {
  let removed = 0
  const count = (before: object, after: object): void => {
    if (before !== after) removed++
  }
  const persons = Object.fromEntries(
    Object.entries(tree.persons).map(([key, p]) => {
      const next = unlinkPerson(p, drop)
      count(p, next)
      return [key, next]
    })
  )
  const sources = Object.fromEntries(
    Object.entries(tree.sources).map(([key, s]) => {
      const next = withoutIds(s, drop)
      count(s, next)
      return [key, next]
    })
  )
  const next = mapCitations({ ...tree, persons, sources }, (c) => {
    const fixed = withoutIds(c, drop)
    count(c, fixed)
    return fixed
  })
  return { tree: next, removed }
}

/** Deletes a media item and every reference to it (gallery, portrait, sources, citations). */
export function removeMedia(tree: FamilyTree, id: MediaId, options: Options = {}): FamilyTree {
  if (!tree.media[id]) throw new ModelError('media-not-found', { id })
  const media = { ...tree.media }
  delete media[id]
  const { tree: next } = unlinkMedia(tree, (m) => m === id)
  return { ...next, media, meta: touched(tree, options.now) }
}

/** Sets (or with `undefined` clears) the portrait of a person. */
export function setPortrait(
  tree: FamilyTree,
  personId: PersonId,
  mediaId: MediaId | undefined,
  options: Options = {}
): FamilyTree {
  const person = tree.persons[personId]
  if (!person) throw new ModelError('person-not-found', { id: personId })
  if (mediaId && !tree.media[mediaId]) throw new ModelError('media-not-found', { id: mediaId })
  const next: Person = { ...person, updatedAt: (options.now ?? new Date()).toISOString() }
  if (mediaId) next.portraitMediaId = mediaId
  else delete next.portraitMediaId
  return {
    ...tree,
    meta: touched(tree, options.now),
    persons: { ...tree.persons, [personId]: next }
  }
}

/** How many places refer to a media item (portraits, galleries, sources, citations). */
export function mediaUsage(tree: FamilyTree, id: MediaId): number {
  return unlinkMedia(tree, (m) => m === id).removed
}

/** The portrait media item of a person, if any. */
export function portraitOf(tree: FamilyTree, person: Person): MediaItem | undefined {
  return person.portraitMediaId ? tree.media[person.portraitMediaId] : undefined
}

/** Hashes of all files the tree needs: everything else is garbage-collected on save. */
export function referencedHashes(tree: FamilyTree): Set<string> {
  return new Set(Object.values(tree.media).map((m) => m.hash))
}

/**
 * Repairs media references after loading: drops ids of media items that don't exist.
 * Returns how many objects had dangling references.
 */
export function repairMediaReferences(tree: FamilyTree): { tree: FamilyTree; removed: number } {
  return unlinkMedia(tree, (id) => !tree.media[id])
}

function requirePerson(tree: FamilyTree, id: PersonId): Person {
  const person = tree.persons[id]
  if (!person) throw new ModelError('person-not-found', { id })
  return person
}

function withPersonMedia(
  tree: FamilyTree,
  person: Person,
  mediaIds: MediaId[],
  now?: Date
): FamilyTree {
  const next: Person = { ...person, updatedAt: (now ?? new Date()).toISOString() }
  if (mediaIds.length) next.mediaIds = mediaIds
  else delete next.mediaIds
  return { ...tree, meta: touched(tree, now), persons: { ...tree.persons, [person.id]: next } }
}

/** Appends media items to a person's gallery (items already there stay where they are). */
export function addPersonMedia(
  tree: FamilyTree,
  personId: PersonId,
  mediaIds: MediaId[],
  options: Options = {}
): FamilyTree {
  const person = requirePerson(tree, personId)
  for (const id of mediaIds) {
    if (!tree.media[id]) throw new ModelError('media-not-found', { id })
  }
  const list = [...(person.mediaIds ?? [])]
  for (const id of mediaIds) if (!list.includes(id)) list.push(id)
  return withPersonMedia(tree, person, list, options.now)
}

/** Takes a media item out of a person's gallery (the item itself stays in the library). */
export function removePersonMedia(
  tree: FamilyTree,
  personId: PersonId,
  mediaId: MediaId,
  options: Options = {}
): FamilyTree {
  const person = requirePerson(tree, personId)
  const list = (person.mediaIds ?? []).filter((id) => id !== mediaId)
  return withPersonMedia(tree, person, list, options.now)
}

/** Moves a media item to position `toIndex` of a person's gallery. */
export function movePersonMedia(
  tree: FamilyTree,
  personId: PersonId,
  mediaId: MediaId,
  toIndex: number,
  options: Options = {}
): FamilyTree {
  const person = requirePerson(tree, personId)
  const list = [...(person.mediaIds ?? [])]
  const from = list.indexOf(mediaId)
  if (from < 0) throw new ModelError('media-not-found', { id: mediaId })
  const to = Math.max(0, Math.min(list.length - 1, toIndex))
  if (from === to) return tree
  list.splice(to, 0, ...list.splice(from, 1))
  return withPersonMedia(tree, person, list, options.now)
}

/** People whose gallery shows a media item, in tree order. */
export function peopleOfMedia(tree: FamilyTree, mediaId: MediaId): Person[] {
  return Object.values(tree.persons).filter((p) => p.mediaIds?.includes(mediaId))
}

/** Shows a media item in exactly these people's galleries (e.g. a family photo). */
export function setMediaPeople(
  tree: FamilyTree,
  mediaId: MediaId,
  personIds: PersonId[],
  options: Options = {}
): FamilyTree {
  if (!tree.media[mediaId]) throw new ModelError('media-not-found', { id: mediaId })
  for (const id of personIds) requirePerson(tree, id)
  let next = tree
  for (const person of peopleOfMedia(tree, mediaId)) {
    if (!personIds.includes(person.id)) next = removePersonMedia(next, person.id, mediaId, options)
  }
  for (const id of personIds) {
    if (!next.persons[id]!.mediaIds?.includes(mediaId)) {
      next = addPersonMedia(next, id, [mediaId], options)
    }
  }
  return next
}
