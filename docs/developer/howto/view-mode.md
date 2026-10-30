---
description: Add a view mode to the Family Insight tree – type, layout selection, toolbar, menu, file format and tests.
---

# Add a view mode

View modes decide **who is shown**; the layout engine then arranges whoever is selected. The example
adds a **close family** mode: the focus person with their parents, partners, children and siblings.

## 1. The type – `src/core/model/types.ts`

```ts
export type TreeViewMode = 'family' | 'ancestors' | 'descendants' | 'hourglass' | 'close'
```

The mode is saved in `meta.view.mode`, so also add `'close'` to the allowed values in
`checkTreeShape` (`src/core/file/schema.ts`). Older versions of the app would reject a file saved in
the new mode, so follow the [versioning policy](../reference/file-format#versioning-and-migrations):
increment `SCHEMA_VERSION` and add a migration (here a no-op: `1: (doc) => doc`), so older versions
show “update the app” instead of “invalid data”.

## 2. Selection – `selectPeople` in `src/core/layout/layout.ts`

`selectPeople(tree, options)` returns the set of people to lay out. Add a branch for the new mode,
using the graph `full` that is already built there:

```ts
if (mode === 'close') {
  const parents = (full.parents.get(focus) ?? []).map((r) => r.parentId)
  const children = (full.children.get(focus) ?? []).map((r) => r.childId)
  const partners = (full.partners.get(focus) ?? []).map((r) =>
    r.partnerIds[0] === focus ? r.partnerIds[1] : r.partnerIds[0]
  )
  const siblings = parents.flatMap((p) => (full.children.get(p) ?? []).map((r) => r.childId))
  ids = new Set([focus, ...parents, ...children, ...partners, ...siblings])
}
```

Everything after selection – generations, ordering, coordinates, edges – works unchanged. Add a test
in `src/core/layout/layout.test.ts` with a small `TreeBuilder` tree that checks exactly who is
selected.

## 3. Toolbar – `src/renderer/src/features/tree/ViewModeControls.tsx`

Add the mode with a [lucide](https://lucide.dev/icons/) icon to `MODES`:

```ts
const MODES: { value: ViewMode; icon: typeof Network }[] = [
  // …
  { value: 'hourglass', icon: Hourglass },
  { value: 'close', icon: Users }
]
```

The control shows `view.close` as the label (on wide windows) and `view.closeHint` as the tooltip, and
offers the generations list for every mode except `family` – hide it for modes where depth means
nothing.

## 4. Menu and IPC

- `src/main/menu.ts`: add `'close'` to the list that builds the **View** radio items and
  `'mode-close'` to `DOCUMENT_ITEMS`.
- `src/shared/ipc.ts`: add `'view:mode-close'` to `MenuAction` and `'close'` to `MenuState.viewMode`.
- `src/main/ipc.ts`: add it to the allowed modes in the `menu:set-state` handler (it validates the
  value).
- `src/renderer/src/App.tsx`: `'view:mode-close': () => useTreeView.getState().setMode('close')`.

## 5. Text, docs and tests

- `view.close` and `view.closeHint` in both locale files.
- An E2E check that the mode shows the expected cards (see `e2e/tree.spec.ts`).
- The [View modes](/guide/view-modes) page in both languages, with a new screenshot scene
  (`docs/.screenshots/scenes.spec.ts`).
