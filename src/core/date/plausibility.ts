import type { Issue } from '../issues'
import { displayName, parentChildLinks } from '../model/tree'
import type { FamilyTree, Person } from '../model/types'
import { ageAt, compareFuzzyDates, yearOf } from './fuzzyDate'

export const MAX_PLAUSIBLE_AGE = 120

/** Soft warnings for a single person (shown in the editor; never blocking). */
export function checkPersonDates(person: Person, now: Date = new Date()): Issue[] {
  const issues: Issue[] = []
  const name = displayName(person)
  const birth = person.birth?.date
  const death = person.death?.date
  if (birth && death && compareFuzzyDates(death, birth) < 0 && yearOf(death)! <= yearOf(birth)!) {
    issues.push({
      severity: 'warning',
      code: 'death-before-birth',
      personId: person.id,
      params: { name }
    })
  }
  // Without a death date we can only judge people who are (possibly) still alive.
  const end = death ?? (person.living === false ? undefined : now)
  const age = end ? ageAt(birth, end) : undefined
  if (age && age.years > MAX_PLAUSIBLE_AGE) {
    issues.push({
      severity: 'warning',
      code: 'unrealistic-age',
      personId: person.id,
      params: { name, years: age.years }
    })
  }
  return issues
}

/** Soft date warnings across the whole tree. */
export function checkTreeDates(tree: FamilyTree, now: Date = new Date()): Issue[] {
  const issues = Object.values(tree.persons).flatMap((p) => checkPersonDates(p, now))
  for (const rel of parentChildLinks(tree)) {
    if (rel.kind !== 'biological') continue
    const parent = tree.persons[rel.parentId]
    const child = tree.persons[rel.childId]
    const pb = yearOf(parent?.birth?.date)
    const cb = yearOf(child?.birth?.date)
    if (parent && child && pb !== undefined && cb !== undefined && pb >= cb) {
      issues.push({
        severity: 'warning',
        code: 'parent-younger-than-child',
        personId: child.id,
        params: { parent: displayName(parent), child: displayName(child) }
      })
    }
  }
  return issues
}
