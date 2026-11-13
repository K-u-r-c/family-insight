import { compareFuzzyDates } from '../date/fuzzyDate'
import { getPartnerships, otherPartner } from './tree'
import type { FamilyTree, PersonId } from './types'

/**
 * Children linked to only one parent while that parent has a partner – usually because the
 * children were entered before the partner (#114). Pure helpers for the details panel, the
 * add-partner flow and the data check.
 */

/** A suggestion: `candidates` could also be the parent of `childIds` (children of `parentId`). */
export interface SecondParentSuggestion {
  parentId: PersonId
  /** Partners of `parentId` who could be the other parent (one, or several to choose from). */
  candidates: PersonId[]
  childIds: PersonId[]
}

function descendantsOf(tree: FamilyTree, id: PersonId): Set<PersonId> {
  const children = new Map<PersonId, PersonId[]>()
  for (const r of Object.values(tree.relationships)) {
    if (r.type === 'parent-child')
      children.set(r.parentId, [...(children.get(r.parentId) ?? []), r.childId])
  }
  const out = new Set<PersonId>()
  const stack = [...(children.get(id) ?? [])]
  while (stack.length) {
    const c = stack.pop()!
    if (out.has(c)) continue
    out.add(c)
    stack.push(...(children.get(c) ?? []))
  }
  return out
}

/**
 * Children of `parentId` that `partnerId` could also be the parent of: linked biologically to
 * `parentId` only, not born before the partnership started (a later partner is likely a
 * step-parent), and not the partner or one of the partner's ancestors.
 */
export function childrenWithoutSecondParent(
  tree: FamilyTree,
  parentId: PersonId,
  partnerId: PersonId
): PersonId[] {
  const links = new Map<PersonId, { parentId: PersonId; biological: boolean }[]>()
  for (const r of Object.values(tree.relationships)) {
    if (r.type === 'parent-child')
      links.set(r.childId, [
        ...(links.get(r.childId) ?? []),
        { parentId: r.parentId, biological: r.kind === 'biological' }
      ])
  }
  const partnership = getPartnerships(tree, parentId).find(
    (r) => otherPartner(r, parentId) === partnerId
  )
  if (!partnership) return []
  const partnerDescendants = descendantsOf(tree, partnerId)
  const ancestorsOfPartner = new Set<PersonId>()
  {
    const stack = (links.get(partnerId) ?? []).map((l) => l.parentId)
    while (stack.length) {
      const p = stack.pop()!
      if (ancestorsOfPartner.has(p)) continue
      ancestorsOfPartner.add(p)
      stack.push(...(links.get(p) ?? []).map((l) => l.parentId))
    }
  }
  const out: PersonId[] = []
  for (const [childId, ls] of links) {
    if (ls.length !== 1 || ls[0]!.parentId !== parentId || !ls[0]!.biological) continue
    if (childId === partnerId || ancestorsOfPartner.has(childId)) continue
    if (partnerDescendants.has(childId)) continue
    const birth = tree.persons[childId]?.birth?.date
    const start = partnership.start?.date
    if (birth && start && compareFuzzyDates(start, birth) > 0) continue
    out.push(childId)
  }
  return out.sort((a, b) =>
    compareFuzzyDates(tree.persons[a]?.birth?.date, tree.persons[b]?.birth?.date)
  )
}

/**
 * Suggestions for the details panel of `personId`: their own children without a second parent
 * (with every partner who could be it), and their partners' children who could be theirs (when
 * that partner has no other partner).
 */
export function secondParentSuggestions(
  tree: FamilyTree,
  personId: PersonId
): SecondParentSuggestion[] {
  const partners = getPartnerships(tree, personId).map((r) => otherPartner(r, personId))
  const out: SecondParentSuggestion[] = []
  const own = new Map<PersonId, PersonId[]>()
  for (const p of partners) {
    for (const c of childrenWithoutSecondParent(tree, personId, p))
      own.set(c, [...(own.get(c) ?? []), p])
  }
  if (own.size) {
    const candidates = [...new Set([...own.values()].flat())]
    const byBirth = (a: PersonId, b: PersonId): number =>
      compareFuzzyDates(tree.persons[a]?.birth?.date, tree.persons[b]?.birth?.date)
    out.push({ parentId: personId, candidates, childIds: [...own.keys()].sort(byBirth) })
  }
  for (const p of partners) {
    if (getPartnerships(tree, p).length !== 1) continue
    const childIds = childrenWithoutSecondParent(tree, p, personId)
    if (childIds.length) out.push({ parentId: p, candidates: [personId], childIds })
  }
  return out
}
