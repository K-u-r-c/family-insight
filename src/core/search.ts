import { yearOf } from './date/fuzzyDate'
import { sourcesOfPerson } from './model/sources'
import type { FamilyTree, Person } from './model/types'
import { foldText } from './text'

/**
 * Text a person can be found by: names, birth surname, places, years, life events and – with the
 * tree – the titles of sources cited for the person.
 */
export function searchableText(person: Person, tree?: FamilyTree): string {
  const sources = tree
    ? [...sourcesOfPerson(tree, person.id)].map((id) => tree.sources[id]?.title)
    : []
  return foldText(
    [
      person.givenNames,
      person.surname,
      person.birthSurname,
      person.birth?.place,
      person.death?.place,
      yearOf(person.birth?.date),
      yearOf(person.death?.date),
      ...person.events.flatMap((e) => [e.place, e.description, e.customType]),
      ...sources
    ]
      .filter((v) => v !== undefined && v !== '')
      .join(' ')
  )
}

/**
 * Finds people matching every word of the query, ignoring case and diacritics
 * (`lodz` finds `Łódź`). Results keep tree order; an empty query matches everyone.
 */
export function searchPersons(tree: FamilyTree, query: string): Person[] {
  const words = foldText(query).split(/\s+/).filter(Boolean)
  const people = Object.values(tree.persons)
  if (!words.length) return people
  return people.filter((p) => {
    const text = searchableText(p, tree)
    return words.every((w) => text.includes(w))
  })
}

/** Character ranges in `text` matching the query words (for highlighting). */
export function matchRanges(text: string, query: string): [number, number][] {
  const words = foldText(query).split(/\s+/).filter(Boolean)
  if (!words.length) return []
  // foldText keeps string length for Latin text with diacritics (1 char → 1 char after NFD strip).
  const folded = foldText(text)
  if (folded.length !== text.length) return []
  const ranges: [number, number][] = []
  for (const w of words) {
    let from = 0
    let i: number
    while ((i = folded.indexOf(w, from)) !== -1) {
      ranges.push([i, i + w.length])
      from = i + w.length
    }
  }
  ranges.sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = []
  for (const r of ranges) {
    const last = merged[merged.length - 1]
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1])
    else merged.push([...r])
  }
  return merged
}
