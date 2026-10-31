import { selectPeople } from '@core/layout/layout'
import { getParentLinks } from '@core/model/tree'
import type { PersonId } from '@core/model/types'
import { layoutOptions } from '@renderer/features/tree/TreeCanvas'
import { useDocument } from '@renderer/store/document'
import { useTreeView } from '@renderer/store/treeView'
import { useWorkspaceUi } from '@renderer/store/workspaceUi'

/**
 * Highlights a relationship path on the tree. People the current view hides are brought back
 * first (the whole family instead of an ancestors/descendants view, collapsed branches above
 * them expanded); the canvas then fits the path into view.
 */
export function showPathOnTree(path: readonly PersonId[]): void {
  const tree = useDocument.getState().tree
  const options = layoutOptions()
  if (!tree || !options || !path.length) return
  const view = useTreeView.getState()
  if (path.some((id) => !selectPeople(tree, options).has(id))) {
    if (view.mode !== 'family') view.setMode('family')
    const family = { ...options, mode: 'family' as const }
    if (path.some((id) => !selectPeople(tree, family).has(id))) {
      // Expand everyone collapsed above a hidden person on the path.
      const above = new Set<PersonId>()
      const stack = [...path]
      while (stack.length) {
        for (const link of getParentLinks(tree, stack.pop()!)) {
          if (above.has(link.parentId)) continue
          above.add(link.parentId)
          stack.push(link.parentId)
        }
      }
      view.expand([...view.collapsed].filter((id) => above.has(id) || path.includes(id)))
    }
  }
  view.setPath(path)
  useWorkspaceUi.getState().setView('tree')
  // Focus the tree (after the calculator has given focus back to its trigger), so Esc hides the
  // path and the arrow keys move from there.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-tree-canvas]')?.focus())
  )
}
