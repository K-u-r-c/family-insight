/**
 * Data for the map view: facts with a located place (birth, death, marriage, life events),
 * filtering by kind and period, grouping into one marker per place, a person's migration path
 * and generations for colouring. Pure; the map library only draws the result.
 */
import { listPlaces, placeKey, type PlaceSummary } from './model/places'
import { getChildren, getParents, getPartners } from './model/tree'
import type { EventType, FamilyTree, FuzzyDate, PersonId } from './model/types'

export const MAP_KINDS = ['birth', 'death', 'marriage', 'event'] as const
export type MapKind = (typeof MAP_KINDS)[number]

export interface MapFact {
  personId: PersonId
  kind: MapKind
  eventType?: EventType
  eventId?: string
  date?: FuzzyDate
  year?: number
  placeKey: string
  placeName: string
  lat: number
  lon: number
}

const yearOf = (date: FuzzyDate | undefined): number | undefined =>
  date ? Number(date.value.slice(0, 4)) : undefined

/** Every fact of the tree whose place has coordinates. */
export function mapFacts(tree: FamilyTree): MapFact[] {
  const facts: MapFact[] = []
  const add = (
    personId: PersonId,
    kind: MapKind,
    place: string | undefined,
    date: FuzzyDate | undefined,
    extra: Partial<MapFact> = {}
  ): void => {
    if (!place?.trim()) return
    const key = placeKey(place)
    const located = tree.places[key]
    if (!located) return
    facts.push({
      personId,
      kind,
      date,
      year: yearOf(date),
      placeKey: key,
      placeName: place.trim(),
      lat: located.lat,
      lon: located.lon,
      ...extra
    })
  }
  for (const p of Object.values(tree.persons)) {
    add(p.id, 'birth', p.birth?.place, p.birth?.date)
    add(p.id, 'death', p.death?.place, p.death?.date)
    for (const e of p.events) {
      add(p.id, 'event', e.place, e.date, { eventType: e.type, eventId: e.id })
    }
  }
  for (const r of Object.values(tree.relationships)) {
    if (r.type !== 'partnership') continue
    for (const id of r.partnerIds) add(id, 'marriage', r.start?.place, r.start?.date)
  }
  return facts
}

/** Places used in the tree that have no coordinates yet. */
export function unlocatedPlaces(tree: FamilyTree): PlaceSummary[] {
  return listPlaces(tree).filter((p) => !p.place)
}

export interface MapFilter {
  kinds: ReadonlySet<MapKind>
  /** Year range; facts without a date are shown only when the range is not restricted. */
  from?: number
  to?: number
}

export function filterFacts(facts: MapFact[], filter: MapFilter): MapFact[] {
  const restricted = filter.from !== undefined || filter.to !== undefined
  return facts.filter((f) => {
    if (!filter.kinds.has(f.kind)) return false
    if (!restricted) return true
    if (f.year === undefined) return false
    return (filter.from ?? -Infinity) <= f.year && f.year <= (filter.to ?? Infinity)
  })
}

/** Earliest and latest year among the facts (for the period slider). */
export function yearRange(facts: MapFact[]): { min: number; max: number } | null {
  const years = facts.map((f) => f.year).filter((y): y is number => y !== undefined)
  if (!years.length) return null
  return { min: Math.min(...years), max: Math.max(...years) }
}

export interface MapMarker {
  key: string
  /** The most common spelling of the place among the facts. */
  name: string
  lat: number
  lon: number
  facts: MapFact[]
  personIds: PersonId[]
}

/** One marker per place, the busiest first. */
export function groupByPlace(facts: MapFact[]): MapMarker[] {
  const byKey = new Map<string, MapFact[]>()
  for (const f of facts) {
    const list = byKey.get(f.placeKey)
    if (list) list.push(f)
    else byKey.set(f.placeKey, [f])
  }
  return [...byKey]
    .map(([key, list]) => {
      const counts = new Map<string, number>()
      for (const f of list) counts.set(f.placeName, (counts.get(f.placeName) ?? 0) + 1)
      const name = [...counts].sort((a, b) => b[1] - a[1])[0]![0]
      return {
        key,
        name,
        lat: list[0]!.lat,
        lon: list[0]!.lon,
        facts: list,
        personIds: [...new Set(list.map((f) => f.personId))]
      }
    })
    .sort((a, b) => b.facts.length - a.facts.length || a.name.localeCompare(b.name))
}

const RANK: Record<MapKind, number> = { birth: 0, event: 1, marriage: 1, death: 2 }

/**
 * Where a person lived, in order: birth first, death last, other facts by date (undated ones
 * keep their order). Consecutive stays at the same place count once.
 */
export function migrationPath(facts: MapFact[], personId: PersonId): MapFact[] {
  const own = facts
    .filter((f) => f.personId === personId)
    .map((f, i) => ({ f, i }))
    .sort((a, b) => {
      const rank = RANK[a.f.kind] - RANK[b.f.kind]
      if (rank) return rank
      const da = a.f.date?.value
      const db = b.f.date?.value
      if (da && db && da !== db) return da < db ? -1 : 1
      return a.i - b.i
    })
    .map(({ f }) => f)
  return own.filter((f, i) => i === 0 || f.placeKey !== own[i - 1]!.placeKey)
}

/**
 * Generation of every person relative to `rootId` (0; parents −1, children +1, partners the
 * same), by breadth-first search. People not connected to the root are missing.
 */
export function generations(tree: FamilyTree, rootId: PersonId | undefined): Map<PersonId, number> {
  const out = new Map<PersonId, number>()
  if (!rootId || !tree.persons[rootId]) return out
  out.set(rootId, 0)
  const queue = [rootId]
  while (queue.length) {
    const id = queue.shift()!
    const g = out.get(id)!
    const visit = (other: PersonId, gen: number): void => {
      if (out.has(other)) return
      out.set(other, gen)
      queue.push(other)
    }
    for (const p of getParents(tree, id)) visit(p.id, g - 1)
    for (const c of getChildren(tree, id)) visit(c.id, g + 1)
    for (const p of getPartners(tree, id)) visit(p.id, g)
  }
  return out
}

/** The generation most people of a marker belong to (`undefined` if none is connected). */
export function markerGeneration(
  marker: MapMarker,
  gens: Map<PersonId, number>
): number | undefined {
  const counts = new Map<number, number>()
  for (const id of marker.personIds) {
    const g = gens.get(id)
    if (g !== undefined) counts.set(g, (counts.get(g) ?? 0) + 1)
  }
  return [...counts].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0]
}
