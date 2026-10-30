# Architecture

```
src/
├── core/        Pure TypeScript domain logic. No Electron, no React, no DOM.
│   ├── model/   Types (Person, Relationship, FamilyTree) and graph queries/operations
│   ├── date/    FuzzyDate parsing, formatting, plausibility
│   ├── file/    .finsight serialisation, schema, migrations, text decoding
│   ├── io/      Import/export format registry and adapters (CSV, …)
│   └── layout/  Family graph layout engine
├── shared/      Code shared by main + renderer: IPC contract, i18n resources/locales
├── main/        Electron main process: windows, native menu, dialogs, file system, settings
├── preload/     The only bridge: exposes a typed `window.familyInsight` API via contextBridge
└── renderer/    React UI (Vite). Talks to the OS only through `window.familyInsight`.
```

## Principles

1. **Domain logic lives in `src/core`** and is unit-tested with Vitest. UI and main process
   are thin layers on top. This keeps the app easy to extend (e.g. GEDCOM support is a new
   module in `core/io`, not a rewrite).
2. **Security:** `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, strict
   CSP. The renderer never touches the file system; main validates every IPC payload.
3. **IPC contract** is declared once in `src/shared/ipc.ts` (channel names + `FamilyInsightApi` type)
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

## Decision: tree rendering and layout (issue #12)

Options evaluated:

| Option                                  | Multi-partner families                                                                                            | 1 000+ people           | Customisation                       | Bundle / licence         |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------- | ----------------------------------- | ------------------------ |
| `@xyflow/react` + `elkjs`               | ELK layers well but has no notion of couples; partners and "children under the couple" need heavy post-processing | good                    | high, but its own interaction model | ~450 kB (ELK) / MIT, EPL |
| Dedicated family-chart libraries        | built-in couples, but limited/rigid for remarriage, adoption and disconnected groups; styling via their DOM       | varies                  | low–medium                          | varies                   |
| **Custom layout + custom SVG renderer** | designed for couples, remarriage, half-siblings                                                                   | ~30 ms for 1 000 people | full                                | 0 kB / ours              |

**Chosen: custom.** The layout is a pure function `layoutFamily(tree, options)` in
`src/core/layout/layout.ts`, unit-tested on fixtures (nuclear family, remarriage with
half-siblings, adoption, 5-generation pedigree, 1 000 random people).

Algorithm:

1. **Select** people for the view mode (family / ancestors / descendants / hourglass, depth,
   collapsed branches).
2. **Generations** by constraint relaxation: a child is below every parent, partners share a
   row, people without parents are pulled down to just above their highest child.
3. **Units**: partners on the same row form a chain; a person with several partners sits in
   the middle with partners split left/right by marriage date.
4. **Ordering** per row with barycentre sweeps (siblings by birth date); couples are flipped
   so each partner is on the side of their own parents.
5. **Coordinates**: alternating passes pull children under their parents' midpoint and
   couples above their children; each pass solves the row exactly with isotonic regression
   (pool-adjacent-violators), which preserves order and minimum spacing.
6. **Edges**: partner lines between neighbours; child lines leave the middle of the partner
   line (or the parent's bottom), run to a bus halfway between rows and drop to the child.

Disconnected groups are laid out side by side; output is deterministic.

## How to add a file format

Formats are pluggable through `src/core/io/registry.ts`:

1. Implement a `FormatAdapter` in `src/core/io/<format>/` (pure TypeScript):
   - `id` (used over IPC), `extensions` (first one is used when saving), `labelKey` (i18n key
     of the file-dialog label) and `kind` (`native` keeps everything, `interchange` may lose
     information);
   - `import(content, options)` returning `{ tree, errors, warnings }` with i18n issue codes,
     and/or `export(tree, options)` returning the file text.
2. Register it in `registerBuiltInFormats()` (`src/core/io/formats.ts`). The main process
   then accepts the extension, and `openFileDialog(id)` / `saveFileDialog(id, name)` build the
   right filters automatically.
3. Add the label and any issue messages to both locale files, a menu entry if needed, and
   unit tests including a round trip.

## Decision: documentation website (issue #38)

The documentation lives in `docs/` and is built with **VitePress** into a static site that is
deployed to GitHub Pages (<https://k-u-r-c.github.io/family-insight/>).

- **Why VitePress:** Markdown first (docs stay readable on GitHub), built-in i18n with a language
  switcher, local full-text search (no external service), light/dark mode, and a build that fails
  on dead links. It runs on its own bundled Vite, independent of the app's Vite.
- **Languages:** the user guide exists in English (`docs/guide/`) and Polish (`docs/pl/guide/`)
  with identical page slugs, so the language switcher keeps the current page. The developer
  documentation (`docs/developer/`) is English only, like the code; the Polish locale links to it.
- **Branding:** `docs/.vitepress/theme/custom.css` maps the app's colour tokens to VitePress
  variables and uses the app's fonts (Inter, Source Serif 4) and icon.
- **Links to source code** use absolute GitHub URLs, because VitePress only resolves links
  between pages.
- **Legacy paths:** v1.0.0 opens `docs/user-guide.*.md` and `docs/CSV_FORMAT.md` on GitHub from its
  Help menu and CSV dialog, so those files stay as short "moved" pages (excluded from the site).
