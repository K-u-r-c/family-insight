---
description: Significant technical decisions in Family Insight, with the options considered and the reasons.
---

# Decision log

Significant technical decisions, newest last. Each entry says what was decided, why, and which
alternatives were rejected. Add an entry when you make a decision that future contributors would
otherwise have to rediscover.

## Electron with electron-vite (2026-10, project start)

**Electron** gives one code base with native installers, menus and file associations on Windows,
macOS and Linux, and a mature web UI stack. **electron-vite** builds main, preload and renderer with
Vite (fast HMR, one config). Alternatives: Tauri (smaller binaries, but a second language – Rust – and
WebView differences between platforms make print/PDF and font rendering less predictable).

## A graph, not a tree (2026-10, issue #1)

People and relationships are nodes and edges (`src/core/model/types.ts`), not a nested tree. Real
families have remarriages, half-siblings, adoption and unconnected people, which a parent→children
tree can't express without duplication. Siblings are derived from shared parents instead of being
stored, so they can't contradict the parent links.

## Pure core, immutable data, snapshot undo (2026-10, issues #1, #7)

All domain logic is pure TypeScript in `src/core`, operations return new trees and share unchanged
objects, and undo keeps snapshots of whole trees (`src/core/history.ts`) with coalescing for typing.
Snapshots are simpler and safer than inverse operations (no undo bugs per command) and cheap thanks to
structural sharing. Zustand holds the current snapshot in the renderer.

## Versioned JSON as the native format (2026-10, issue #8)

`.finsight` is readable JSON with `format` and `schemaVersion`, validated by a hand-written shape
check (no runtime schema library) and upgraded by explicit migrations. Photos are embedded as data
URLs so a tree is one file. SQLite was rejected: harder to inspect, back up and e-mail, and not needed
for trees of a few thousand people.

## CSV for spreadsheets (2026-10, issues #18, #19)

CSV export writes UTF-8 **with BOM** and CRLF, with a choice of `,` or `;` and English or Polish
headers, because that is what Excel needs to show Polish letters and split columns correctly in Polish
regional settings. Import is lenient (delimiter and encoding detection incl. Windows-1250, header
aliases, day-first dates) but never silent: problems block the import with row numbers, warnings
explain what happens. GEDCOM is planned separately (issue #34).

## No network access (2026-10)

The app makes no network requests – no telemetry, no update checks, no remote fonts. Family data is
personal, and offline-only is easy to explain and verify. Links open in the user's browser.

## Tree rendering and layout (2026-10, issue #12) {#layout}

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

## Documentation website (2026-10, issue #38)

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

## Generated documentation screenshots (2026-10, issue #40) {#screenshots}

Every screenshot in the documentation is produced from the real app by
`npm run docs:screenshots` (Playwright `_electron`, specs in `docs/.screenshots/`), in both
languages and both themes, into `docs/public/screenshots/<lang>/<theme>/<scene>.webp`, plus a
size manifest (`docs/.vitepress/screenshots.json`) for the `<Screenshot>` component.

- **One app session per screenshot.** Capturing a hidden Electron window (Playwright's
  `page.screenshot` or CDP `Page.captureScreenshot`) permanently stops `requestAnimationFrame` in
  that window, which breaks Playwright's actionability checks and the app's animations. So each
  scene starts a fresh hidden app, gets it into the right state and captures as its very last step.
  `webContents.capturePage` fails for hidden windows, and offscreen rendering would need app changes.
- **WebP straight from Chromium** (`Page.captureScreenshot` with `format: 'webp'`, quality 90): no
  image libraries or system binaries, about 10–100 kB per image.
- **Deterministic:** fixed window size (1280 × 800 at scale 1), fixed time zone, fixed sample data;
  scenes wait for animations to finish instead of disabling them.
- **Annotations** (numbered rings for tutorials) are injected as a top-layer popover, so they are
  drawn above open `<dialog>`s, and removed with the session.
- Screenshots are committed. They are not regenerated in CI because fonts and rendering differ
  between machines; regenerate them locally after UI changes.

## Diagrams in the documentation (2026-10, issue #47)

**Mermaid**, rendered in the browser by a small `<Mermaid>` component (`docs/.vitepress/theme`), fed
by a markdown-it fence rule for ` ```mermaid ` blocks.

- Diagrams stay text in Markdown – reviewable in pull requests and easy to update.
- The component uses the site's colours (Mermaid `base` theme with the app's tokens) and re-renders
  when the reader switches between light and dark mode; Mermaid is loaded only on pages with
  diagrams.
- `vitepress-plugin-mermaid` was not used because it doesn't support Mermaid 12 yet; static SVG
  files were rejected because they can't follow the theme and are harder to edit.

## Adding relatives: step-parents and Polish surnames (2026-10, found while documenting)

- **+ Parent** for someone who already has two biological parents adds a **step-parent** instead of
  failing: biological parents are capped at two by the model, and a step-parent is the most likely
  meaning; the type can be changed in the parent's menu.
- A new father gets the family surname in the **masculine form** for Polish feminine endings
  (`-ska`, `-cka`, `-dzka` → `-ski`, `-cki`, `-dzki`, `masculineSurname` in `src/core/text.ts`).
  Other languages' surnames are unaffected.
- Relatives created from the details panel always open in the editor, even when the surname is
  prefilled – the same as from the card menu.

## Developer documentation in English only (2026-10, issue #38)

The user guide is bilingual, but developer pages are English only, like the code, comments and commit
messages; translating them would double the maintenance for few readers. Polish placeholder pages keep
the language switcher working and link to the English pages.

## Testing the documentation website (2026-10, issue #50)

`npm run docs:test` checks the built site with Playwright driving **Electron** (an offscreen window,
`docs/.test/browser.mjs`) instead of Playwright's own Chromium: Electron is already a dependency, so
nothing else is downloaded locally or in CI. A tiny static server in the test mimics GitHub Pages
(clean URLs, the `/family-insight/` base). The Docs workflow runs it before every deployment.

Findings that changed the site: code blocks use the `github-*-default` Shiki themes on a white (light)
or dark warm background to meet WCAG AA contrast; the search button's “Ctrl K” hint is hidden because
it was visible text missing from the button's accessible name; diagrams fit the column and have a
separate “Enlarge” button.
