import { ageAt } from './date/fuzzyDate'
import { getParentLinks, isLiving } from './model/tree'
import type { FamilyTree, Person, PersonId } from './model/types'
import { compareText } from './text'
import { factsWithoutSource, recordedFacts } from './model/sources'

export interface CountItem {
  label: string
  count: number
  personIds: PersonId[]
}

export interface TreeStats {
  people: number
  living: number
  deceased: number
  unknownStatus: number
  female: number
  male: number
  /** Longest chain of parent → child links (1 = nobody has parents in the tree). */
  generations: number
  /** Mean age at death of people with exact enough birth and death years. */
  averageLifespan: number | null
  longestLived: { personId: PersonId; years: number } | null
  givenNames: CountItem[]
  surnames: CountItem[]
  birthPlaces: CountItem[]
  /** People missing important data, for a "to do" list. */
  missingDates: PersonId[]
  missingParents: PersonId[]
  /** Most common life event types (label = `EventType`) and event places. */
  eventTypes: CountItem[]
  eventPlaces: CountItem[]
  /** People without any life event besides birth and death. */
  withoutEvents: PersonId[]
  /** Recorded facts and how many of them cite at least one source. */
  facts: number
  sourcedFacts: number
}

function top(items: Map<string, PersonId[]>, limit: number, language: string): CountItem[] {
  return [...items.entries()]
    .map(([label, personIds]) => ({ label, count: personIds.length, personIds }))
    .sort((a, b) => b.count - a.count || compareText(a.label, b.label, language))
    .slice(0, limit)
}

function add(map: Map<string, PersonId[]>, key: string | undefined, id: PersonId): void {
  const k = key?.trim()
  if (!k) return
  map.set(k, [...(map.get(k) ?? []), id])
}

/** Summary numbers about a tree (pure). */
export function computeStats(
  tree: FamilyTree,
  options: { limit?: number; language?: string } = {}
): TreeStats {
  const limit = options.limit ?? 5
  const language = options.language ?? 'en'
  const people = Object.values(tree.persons)
  const givenNames = new Map<string, PersonId[]>()
  const surnames = new Map<string, PersonId[]>()
  const places = new Map<string, PersonId[]>()
  const eventTypes = new Map<string, PersonId[]>()
  const eventPlaces = new Map<string, PersonId[]>()
  const ages: { personId: PersonId; years: number }[] = []
  let living = 0
  let deceased = 0
  let female = 0
  let male = 0

  for (const p of people) {
    const status = isLiving(p)
    if (status === true) living++
    else if (status === false) deceased++
    if (p.sex === 'female') female++
    if (p.sex === 'male') male++
    add(givenNames, p.givenNames.split(/\s+/)[0], p.id)
    add(surnames, p.birthSurname || p.surname, p.id)
    add(places, p.birth?.place, p.id)
    for (const e of p.events) {
      add(eventTypes, e.type, p.id)
      add(eventPlaces, e.place, p.id)
    }
    if (status === false && p.birth?.date && p.death?.date) {
      const age = ageAt(p.birth.date, p.death.date)
      if (age) ages.push({ personId: p.id, years: age.years })
    }
  }

  const facts = recordedFacts(tree)

  // Generations: longest descent chain, memoised over parent links.
  const depth = new Map<PersonId, number>()
  const visiting = new Set<PersonId>()
  const generationOf = (id: PersonId): number => {
    const known = depth.get(id)
    if (known !== undefined) return known
    if (visiting.has(id)) return 1
    visiting.add(id)
    const parents = getParentLinks(tree, id).map((r) => r.parentId)
    const value = 1 + Math.max(0, ...parents.map(generationOf))
    visiting.delete(id)
    depth.set(id, value)
    return value
  }

  const hasDates = (p: Person): boolean => !!(p.birth?.date || p.death?.date)
  const longest = ages.reduce<{ personId: PersonId; years: number } | null>(
    (best, a) => (!best || a.years > best.years ? a : best),
    null
  )
  return {
    people: people.length,
    living,
    deceased,
    unknownStatus: people.length - living - deceased,
    female,
    male,
    generations: people.length ? Math.max(...people.map((p) => generationOf(p.id))) : 0,
    averageLifespan: ages.length
      ? Math.round(ages.reduce((s, a) => s + a.years, 0) / ages.length)
      : null,
    longestLived: longest,
    givenNames: top(givenNames, limit, language),
    surnames: top(surnames, limit, language),
    birthPlaces: top(places, limit, language),
    missingDates: people.filter((p) => !hasDates(p)).map((p) => p.id),
    missingParents: people.filter((p) => getParentLinks(tree, p.id).length === 0).map((p) => p.id),
    eventTypes: top(eventTypes, limit, language),
    eventPlaces: top(eventPlaces, limit, language),
    withoutEvents: people.filter((p) => p.events.length === 0).map((p) => p.id),
    facts: facts.length,
    sourcedFacts: facts.length - factsWithoutSource(tree).length
  }
}
