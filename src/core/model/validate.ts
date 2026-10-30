import type { Issue } from '../issues'
import { citationTargets, getCitations } from './sources'
import { displayName } from './tree'
import type { FamilyTree, PersonId } from './types'

/**
 * Checks structural integrity of a whole tree (after loading a file or importing).
 * Date-plausibility warnings live in `src/core/date/plausibility.ts`.
 */
export function validateTree(tree: FamilyTree): Issue[] {
  const issues: Issue[] = []
  const exists = (id: PersonId): boolean => id in tree.persons
  const name = (id: PersonId): string => {
    const p = tree.persons[id]
    return p ? displayName(p) || id : id
  }

  for (const [key, person] of Object.entries(tree.persons)) {
    if (person.id !== key)
      issues.push({ severity: 'error', code: 'id-mismatch', params: { id: key } })
  }

  const parentsOf = new Map<PersonId, PersonId[]>()
  const bioCount = new Map<PersonId, number>()
  const seenPairs = new Set<string>()

  for (const [key, rel] of Object.entries(tree.relationships)) {
    if (rel.id !== key) issues.push({ severity: 'error', code: 'id-mismatch', params: { id: key } })
    const ids = rel.type === 'parent-child' ? [rel.parentId, rel.childId] : rel.partnerIds
    const missing = ids.filter((id) => !exists(id))
    if (missing.length) {
      for (const id of missing) {
        issues.push({ severity: 'error', code: 'dangling-reference', params: { id } })
      }
      continue
    }
    if (ids[0] === ids[1]) {
      issues.push({
        severity: 'error',
        code: 'self-relationship',
        personId: ids[0],
        params: { name: name(ids[0]!) }
      })
      continue
    }
    const pairKey = `${rel.type}:${rel.type === 'parent-child' ? ids.join('>') : [...ids].sort().join('|')}`
    if (seenPairs.has(pairKey)) {
      issues.push({ severity: 'error', code: 'duplicate-relationship', params: { id: key } })
    }
    seenPairs.add(pairKey)
    if (rel.type === 'parent-child') {
      parentsOf.set(rel.childId, [...(parentsOf.get(rel.childId) ?? []), rel.parentId])
      if (rel.kind === 'biological') bioCount.set(rel.childId, (bioCount.get(rel.childId) ?? 0) + 1)
    }
  }

  for (const [childId, count] of bioCount) {
    if (count > 2) {
      issues.push({
        severity: 'error',
        code: 'too-many-biological-parents',
        personId: childId,
        params: { name: name(childId) }
      })
    }
  }

  // Cycle detection over parent edges (iterative DFS with colouring).
  const state = new Map<PersonId, 1 | 2>()
  const reported = new Set<PersonId>()
  for (const start of Object.keys(tree.persons)) {
    if (state.has(start)) continue
    const stack: [PersonId, number][] = [[start, 0]]
    state.set(start, 1)
    while (stack.length) {
      const top = stack[stack.length - 1]!
      const parents = parentsOf.get(top[0]) ?? []
      if (top[1] < parents.length) {
        const next = parents[top[1]++]!
        const s = state.get(next)
        if (s === 1) {
          if (!reported.has(next)) {
            reported.add(next)
            issues.push({
              severity: 'error',
              code: 'ancestry-cycle',
              personId: next,
              params: { name: name(next) }
            })
          }
        } else if (s === undefined) {
          state.set(next, 1)
          stack.push([next, 0])
        }
      } else {
        state.set(top[0], 2)
        stack.pop()
      }
    }
  }

  for (const target of citationTargets(tree)) {
    for (const citation of getCitations(tree, target)) {
      if (!tree.sources[citation.sourceId]) {
        issues.push({
          severity: 'error',
          code: 'dangling-citation',
          params: { id: citation.sourceId }
        })
      }
    }
  }
  for (const source of Object.values(tree.sources)) {
    if (source.repositoryId && !tree.repositories[source.repositoryId]) {
      issues.push({
        severity: 'warning',
        code: 'dangling-repository',
        params: { id: source.repositoryId }
      })
    }
  }

  if (tree.meta.rootPersonId && !exists(tree.meta.rootPersonId)) {
    issues.push({
      severity: 'warning',
      code: 'missing-root',
      params: { id: tree.meta.rootPersonId }
    })
  }

  return issues
}
