import type { Layout, LayoutNode } from './layout'
import type { FamilyTree, PersonId } from '../model/types'

export type Direction = 'up' | 'down' | 'left' | 'right'

const centerX = (n: LayoutNode): number => n.x + n.width / 2

/**
 * Keyboard navigation between relatives on the canvas: ↑ parent, ↓ child, ←/→ the nearest
 * person on the same row (partners and siblings). Picks the candidate closest horizontally.
 */
export function navigate(
  tree: FamilyTree,
  layout: Layout,
  from: PersonId,
  direction: Direction
): PersonId | null {
  const nodes = new Map(layout.nodes.map((n) => [n.id, n]))
  const current = nodes.get(from)
  if (!current) return null
  const closest = (candidates: LayoutNode[]): PersonId | null => {
    let best: LayoutNode | null = null
    for (const c of candidates) {
      if (
        !best ||
        Math.abs(centerX(c) - centerX(current)) < Math.abs(centerX(best) - centerX(current))
      )
        best = c
    }
    return best?.id ?? null
  }
  const rels = Object.values(tree.relationships)
  if (direction === 'up') {
    return closest(
      rels
        .filter((r) => r.type === 'parent-child' && r.childId === from)
        .map((r) => nodes.get((r as { parentId: string }).parentId))
        .filter((n): n is LayoutNode => !!n)
    )
  }
  if (direction === 'down') {
    return closest(
      rels
        .filter((r) => r.type === 'parent-child' && r.parentId === from)
        .map((r) => nodes.get((r as { childId: string }).childId))
        .filter((n): n is LayoutNode => !!n)
    )
  }
  const sameRow = layout.nodes.filter(
    (n) => n.y === current.y && (direction === 'left' ? n.x < current.x : n.x > current.x)
  )
  return closest(sameRow)
}
