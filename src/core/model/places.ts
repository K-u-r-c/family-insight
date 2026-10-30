/**
 * Places: people's places stay free text (`LifeEvent.place`, events, partnerships, media); the
 * tree-level gazetteer `tree.places` adds coordinates, keyed by the normalised place name, so
 * "Kraków", "Krakow" and " kraków " share one entry and existing data needs no change.
 */
import { foldText } from '../text'
import type { FamilyTree, LifeEvent, Person, PersonId, Place } from './types'

/** Gazetteer key of a place name: folded case and diacritics, single spaces. */
export function placeKey(name: string): string {
  return foldText(name).replace(/\s+/g, ' ').trim()
}

export const isLatitude = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= -90 && v <= 90
export const isLongitude = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= -180 && v <= 180

/** Where a place name is used. */
export type PlaceUse =
  | { kind: 'birth' | 'death'; personId: PersonId }
  | { kind: 'event'; personId: PersonId; eventId: string }
  | { kind: 'partnership-start' | 'partnership-end'; relationshipId: string }
  | { kind: 'media'; mediaId: string }

/** Every place string in the tree with where it is used. */
export function placeUses(tree: FamilyTree): { name: string; use: PlaceUse }[] {
  const out: { name: string; use: PlaceUse }[] = []
  const push = (name: string | undefined, use: PlaceUse): void => {
    if (name?.trim()) out.push({ name, use })
  }
  for (const p of Object.values(tree.persons)) {
    push(p.birth?.place, { kind: 'birth', personId: p.id })
    push(p.death?.place, { kind: 'death', personId: p.id })
    for (const e of p.events) push(e.place, { kind: 'event', personId: p.id, eventId: e.id })
  }
  for (const r of Object.values(tree.relationships)) {
    if (r.type !== 'partnership') continue
    push(r.start?.place, { kind: 'partnership-start', relationshipId: r.id })
    push(r.end?.place, { kind: 'partnership-end', relationshipId: r.id })
  }
  for (const m of Object.values(tree.media)) push(m.place, { kind: 'media', mediaId: m.id })
  return out
}

export interface PlaceSummary {
  key: string
  /** The most common spelling. */
  name: string
  /** Every spelling in use, most common first. */
  spellings: string[]
  /** Number of facts using it. */
  count: number
  /** People with a fact there. */
  personIds: PersonId[]
  place?: Place
}

/** Distinct places with usage counts and coordinates, most used first. */
export function listPlaces(tree: FamilyTree): PlaceSummary[] {
  const byKey = new Map<
    string,
    { spellings: Map<string, number>; count: number; people: Set<PersonId> }
  >()
  for (const { name, use } of placeUses(tree)) {
    const key = placeKey(name)
    let entry = byKey.get(key)
    if (!entry) byKey.set(key, (entry = { spellings: new Map(), count: 0, people: new Set() }))
    const spelling = name.trim()
    entry.spellings.set(spelling, (entry.spellings.get(spelling) ?? 0) + 1)
    entry.count++
    const personId = 'personId' in use ? use.personId : undefined
    if (personId) entry.people.add(personId)
    if ('relationshipId' in use) {
      const rel = tree.relationships[use.relationshipId]
      if (rel?.type === 'partnership') rel.partnerIds.forEach((id) => entry!.people.add(id))
    }
  }
  return [...byKey]
    .map(([key, e]) => {
      const spellings = [...e.spellings].sort((a, b) => b[1] - a[1]).map(([s]) => s)
      return {
        key,
        name: spellings[0]!,
        spellings,
        count: e.count,
        personIds: [...e.people],
        ...(tree.places[key] ? { place: tree.places[key] } : {})
      }
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

function touched(tree: FamilyTree, now?: Date): FamilyTree['meta'] {
  return { ...tree.meta, updatedAt: (now ?? new Date()).toISOString() }
}

/** Sets (or with `undefined` clears) the coordinates of a place name. */
export function setPlace(
  tree: FamilyTree,
  name: string,
  place: Place | undefined,
  options: { now?: Date } = {}
): FamilyTree {
  const key = placeKey(name)
  const places = { ...tree.places }
  if (place) {
    if (!isLatitude(place.lat) || !isLongitude(place.lon)) throw new RangeError('coordinates')
    places[key] = place
  } else delete places[key]
  return { ...tree, meta: touched(tree, options.now), places }
}

/**
 * Merges places: every fact whose place normalises to one of `names` gets the place `target`
 * (spelled exactly so). Coordinates of the target win; otherwise the first merged place with
 * coordinates is kept.
 */
export function mergePlaces(
  tree: FamilyTree,
  names: string[],
  target: string,
  options: { now?: Date } = {}
): FamilyTree {
  const to = target.trim()
  const keys = new Set([...names, to].map(placeKey))
  const rename = (place: string | undefined): string | undefined =>
    place?.trim() && keys.has(placeKey(place)) ? to : place
  const event = <T extends LifeEvent | undefined>(e: T): T =>
    e?.place && rename(e.place) !== e.place ? ({ ...e, place: rename(e.place) } as T) : e
  const timestamp = (options.now ?? new Date()).toISOString()
  const persons = Object.fromEntries(
    Object.entries(tree.persons).map(([id, p]) => {
      const next: Person = {
        ...p,
        birth: event(p.birth),
        death: event(p.death),
        events: p.events.map((e) =>
          e.place && rename(e.place) !== e.place ? { ...e, place: rename(e.place) } : e
        )
      }
      if (!p.birth) delete next.birth
      if (!p.death) delete next.death
      const changed =
        next.birth !== p.birth ||
        next.death !== p.death ||
        next.events.some((e, i) => e !== p.events[i])
      return [id, changed ? { ...next, updatedAt: timestamp } : p]
    })
  )
  const relationships = Object.fromEntries(
    Object.entries(tree.relationships).map(([id, r]) => {
      if (r.type !== 'partnership') return [id, r]
      const start = event(r.start)
      const end = event(r.end)
      if (start === r.start && end === r.end) return [id, r]
      const next = { ...r, start, end }
      if (!r.start) delete next.start
      if (!r.end) delete next.end
      return [id, next]
    })
  )
  const media = Object.fromEntries(
    Object.entries(tree.media).map(([id, m]) =>
      m.place && rename(m.place) !== m.place ? [id, { ...m, place: rename(m.place) }] : [id, m]
    )
  )
  const toKey = placeKey(to)
  const places = { ...tree.places }
  const kept = places[toKey] ?? [...keys].map((k) => places[k]).find(Boolean)
  for (const k of keys) delete places[k]
  if (kept) places[toKey] = kept
  return { ...tree, meta: touched(tree, options.now), persons, relationships, media, places }
}

/** Re-keys gazetteer entries by `placeKey` (files edited by hand or by other tools). */
export function normalizePlaceKeys(tree: FamilyTree): FamilyTree {
  const entries = Object.entries(tree.places)
  if (entries.every(([key]) => placeKey(key) === key)) return tree
  const places: Record<string, Place> = {}
  for (const [key, place] of entries) {
    const k = placeKey(key)
    if (k && !places[k]) places[k] = place
  }
  return { ...tree, places }
}
