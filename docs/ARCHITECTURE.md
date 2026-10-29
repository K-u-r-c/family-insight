# Architecture

```
src/
├── core/        Pure TypeScript domain logic. No Electron, no React, no DOM.
│   ├── model/   Types (Person, Relationship, FamilyTree) and graph queries/operations
│   ├── date/    FuzzyDate parsing/formatting               (planned)
│   ├── io/      Import/export format registry, CSV, .ohara  (planned)
│   └── layout/  Tree layout engine                          (planned)
├── shared/      Code shared by main + renderer: IPC contract, i18n resources/locales
├── main/        Electron main process: windows, native menu, dialogs, file system, settings
├── preload/     The only bridge: exposes a typed `window.ohara` API via contextBridge
└── renderer/    React UI (Vite). Talks to the OS only through `window.ohara`.
```

## Principles

1. **Domain logic lives in `src/core`** and is unit-tested with Vitest. UI and main process
   are thin layers on top. This keeps the app easy to extend (e.g. GEDCOM support is a new
   module in `core/io`, not a rewrite).
2. **Security:** `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, strict
   CSP. The renderer never touches the file system; main validates every IPC payload.
3. **IPC contract** is declared once in `src/shared/ipc.ts` (channel names + `OharaApi` type)
   and implemented in `src/main/ipc.ts` and `src/preload/index.ts`.
4. **i18n:** every user-visible string goes through i18next. Locales live in
   `src/shared/locales/{en,pl}.json` and are used by both renderer and the native menu.
   A unit test enforces that both languages have identical keys.
5. **Theming:** components use CSS variables from `src/renderer/src/styles/tokens.css` only.
   Light, dark and "follow system" are supported.
6. **State:** Zustand stores in `src/renderer/src/store`. Document edits go through commands
   so undo/redo is uniform.
7. **Extensibility points:** import/export format registry, view modes of the tree, locales
   (add `xx.json` + register in `src/shared/i18n.ts`).
