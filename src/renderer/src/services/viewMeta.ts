import type { FamilyTree, TreeViewMeta } from '@core/model/types'
import { useTreeView } from '@renderer/store/treeView'

/** The tree as it should be written to disk: content plus the current view settings. */
export function treeForSave(tree: FamilyTree): FamilyTree {
  const { mode, depth, collapsed } = useTreeView.getState()
  const view: TreeViewMeta = {
    mode,
    depth,
    collapsed: [...collapsed].filter((id) => id in tree.persons)
  }
  return { ...tree, meta: { ...tree.meta, view } }
}

/** Restores view settings saved in a file (or defaults for a new tree). */
export function applyViewMeta(tree: FamilyTree): void {
  const view = tree.meta.view
  useTreeView.setState({
    mode: view?.mode ?? 'family',
    depth: view ? Math.min(10, Math.max(1, view.depth)) : 4,
    collapsed: new Set(view?.collapsed ?? []),
    path: null
  })
}
