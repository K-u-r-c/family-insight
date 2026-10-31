import type { FamilyTree, PersonId, RelationshipId } from '../model/types'

const pairKey = (a: PersonId, b: PersonId): string => (a < b ? `${a}\n${b}` : `${b}\n${a}`)

/**
 * Relationships linking consecutive people of a kinship path (parent-child links and
 * partnerships), so the tree can highlight the lines along it.
 */
export function pathRelationships(
  tree: FamilyTree,
  path: readonly PersonId[]
): Set<RelationshipId> {
  const steps = new Set<string>()
  for (let i = 1; i < path.length; i++) steps.add(pairKey(path[i - 1]!, path[i]!))
  const ids = new Set<RelationshipId>()
  for (const r of Object.values(tree.relationships)) {
    const [a, b] = r.type === 'parent-child' ? [r.parentId, r.childId] : r.partnerIds
    if (steps.has(pairKey(a, b))) ids.add(r.id)
  }
  return ids
}
