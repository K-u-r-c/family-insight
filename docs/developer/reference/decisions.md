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

## Life events and schema v2 (2026-10, issue #52)

People get `events: PersonEvent[]` – a typed list (`EVENT_TYPES` plus `custom`) with optional date,
end date, place, description and notes – while **birth and death stay separate fields**: the layout,
lifespans, statistics and CSV depend on them, and keeping them avoids touching all of that.

- `events` is required in the stored model (always an array), so code never checks for `undefined`;
  `addPerson` defaults it to `[]`. Events change only through dedicated operations/commands, so each
  add, edit, delete or reorder is one undo step (edits of the same field coalesce while typing).
- It is the first real migration: **schema 2**, `1 → 2` adds `events: []`. A new required field and
  new values mean older apps must not open the file – they already refuse newer `schemaVersion`s
  with a clear message (see the file format's forward-compatibility rule).
- Plausibility checks only warn when dates certainly contradict each other (an earlier year, or both
  at least month-precise), so `1890` baptism vs `1890-05` birth is no warning.
- CSV stays one row per person; events are carried by GEDCOM (#60–#63).

## Sources and citations folded into schema v2 (2026-10, issue #54)

Sources, repositories and citations were added to **schema 2** instead of introducing schema 3,
because schema 2 hadn't been released yet (no user has a version-2 file); one migration `1 → 2`
covers both features. Development files of schema 2 without `sources` are normalised on load.

- Citations live **next to the fact** they support (optional `citations` lists) rather than in a
  central table with fact paths: moving or deleting a fact can't leave orphaned citations, and the
  editor shows them where the fact is.
- `CitationTarget` addresses a fact uniformly, so one set of operations and UI components handles
  person, birth, death, life events, relationships and partnership start/end.
- A dangling `sourceId` is an error for `validateTree`, but the loader repairs it (drops the citation
  with a warning, marks the document changed) instead of refusing the file – losing one reference is
  better than not being able to open a tree.

## Citation UI (2026-10, issue #55)

One `CitationsDialog` edits the citations of any fact, opened from a small `CiteButton` (with the
number of sources) next to name, birth, death, events, in the relationship menus and in the
partnership dialog; the open target lives in the workspace UI store, so any component can open it.
In the details view a fact's superscript count opens the same dialog instead of a hover popover –
it works with keyboard and touch the same way. The sources manager is a dialog reachable from
**☰** and **Edit → Sources…**.

## Media library in a zip container, schema 3 (2026-10, issue #56)

Photos and scanned documents (many per person, PDFs, 25 MB each) don't fit into the JSON file as
data URLs: base64 adds a third, and every autosave would rewrite and re-encode all of them. Options:

| Option                                          | Verdict                                                                                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| (a) JSON with a deduplicated base64 media table | Simple, but files grow by a third, parsing and saving a 200 MB JSON string is slow, and limits would have to be tiny.     |
| **(b) zip container** (`tree.json` + `media/`)  | **Chosen.** Still one file to copy, mail or open on a phone; media stored once by SHA-256; saving writes bytes it has.    |
| (c) sidecar folder next to the file             | Easy to break: copying only the `.finsight` file loses the photos; awkward with mobile document pickers and share sheets. |

Details:

- **Own minimal zip writer/reader** (`src/core/file/zip.ts`) with fflate only for deflate. fflate's
  `zipSync` recomputes every CRC and concatenates everything into one buffer – about 400 ms for
  200 MB on every autosave. Our writer reuses each file's CRC (read from the zip or computed once) and
  returns chunks that main writes without copying: a tree with 500 photos (205 MB) where one person
  changed saves in **~95 ms** through the real save path (pack, temporary file, `fsync`, rename;
  NVMe, Linux), with backup rotation ~90 ms, of which packing is ~10 ms. Writing is bound by the
  disk: GitHub's Linux runners need ~1.3 s for the same 205 MB (~160 MB/s virtual disk).
  `src/main/documentWriter.test.ts` asserts packing < 250 ms everywhere and the whole save < 1 s
  (< 5 s on CI runners). Media are stored, `tree.json` is deflated. No zip64, timestamps fixed to 1980
  (reproducible files).
- **Backups are hard links** (`.bak1` links to the previous file, which the atomic rename replaces)
  instead of copies, so rotating them costs nothing even for large trees; file systems without hard
  links (FAT/exFAT, some network shares) fall back to copying.
- **Bytes live in the main process** per open document (a "library" addressed by id); the renderer
  sends only JSON when saving and holds only thumbnail object URLs. Garbage collection happens when
  writing the container, never in the library, so undo can bring a deleted item back.
- **Hashing:** SHA-256 via `@noble/hashes` (audited, synchronous, pure JS) – the load pipeline and
  migrations are synchronous and must also run without Node (mobile, #82+). ~175 MB/s is plenty for
  25 MB files.
- **Thumbnails** are generated in the renderer (`createImageBitmap` + canvas → WebP 256 px):
  Electron's `nativeImage` decodes only PNG/JPEG and can't render PDFs on Linux, while the canvas
  path handles JPEG/PNG/WebP/GIF everywhere, including a Capacitor webview. PDFs get an icon.
- **Type by content:** files are accepted by their magic bytes (JPEG, PNG, GIF, WebP, PDF), never by
  extension; at most 25 MB per file.
- **Schema 3** rather than folding into the unreleased schema 2 (as #54 did): the migration moves
  bytes out of the JSON (portrait data URLs become media items and container entries via a migration
  context), which is easier to test and reason about as its own step. Both ship in 1.1.
- **Portraits** are media items (`portraitMediaId`), the cropped 512 px image added to the library.
  Replacing or removing a portrait deletes the old item when nothing else uses it.
- **Crash recovery** writes media files once per snapshot (`<id>.media/<hash>`) instead of a full
  container each time, so a 2-second autosave of an untitled tree doesn't rewrite all photos.
- **Compatibility:** 1.0.x can't read containers (it reports a damaged file). Accepted: the
  "newer version" message can't be retrofitted into released versions.

## Gallery, viewer and media linking (2026-10, issue #57)

- **Portraits stay crops.** "Use as portrait" opens the existing cropper on the full image and
  stores the 512 px crop as a new media item, so the card shows a well-framed face while the gallery
  keeps the original. The gallery therefore marks no item as "the portrait".
- **One item, many people:** a family photo is one media item listed in several people's `mediaIds`
  (`setMediaPeople`), not a copy per person. Removing it from a gallery deletes the item only when
  nothing else uses it (people, sources, citations); the details dialog doesn't let the last
  reference go, because the item would become unreachable – **Delete from the tree** is explicit.
- **PDFs** use Chromium's built-in viewer in an `<iframe>` of a `blob:` URL (it works in the
  sandboxed renderer; the CSP allows `frame-src blob:` only). "Open in another app" writes a
  temporary copy whose extension follows the detected type. Mobile (#89) will need its own path.
- **Viewer** is a native `<dialog>` with CSS-transform zoom/pan (wheel around the cursor,
  double-click, drag, +/−/0 keys) and ←/→ for the list it was opened from.
- **Performance:** cards only ever show thumbnails, and the canvas renders only visible cards. With
  1 022 people with portraits, zoomed out to 15 % (≈200 cards on screen), panning keeps 60 fps
  (p95 frame 16.7 ms, worst 17.7 ms) on the development machine – `npm run test:perf`.

## Places: gazetteer and opt-in lookup (2026-10, issue #58)

- **Places stay free text.** Coordinates live in a tree-level gazetteer `places`, keyed by
  `placeKey(name)` (case, spaces and diacritics folded – the same folding as search), so existing
  facts need no change and "Kraków"/"Krakow" share a location. Merging spellings rewrites the
  strings (one undoable command) and keeps one entry. Folded into the unreleased **schema 3**;
  development files of schema 3 without `places` are normalised on load.
- **Geocoder: OpenStreetMap Nominatim**, called by the main process (`src/main/geocoder.ts`), never
  by the renderer, so the CSP doesn't change. Its usage policy is followed: at most one request per
  second (queued), an identifying User-Agent, results cached on disk (2 000 entries), only on an
  explicit click per place – no bulk or background lookups. Alternatives (Photon, commercial APIs)
  were not needed: the volume is a few lookups per user, and Nominatim needs no API key.
- **Opt-in:** the setting `onlinePlaceLookup` is off by default; the first **Look up online** asks
  with an explanation of exactly what is sent (the place name only). Main checks the setting again
  for every request, so a compromised renderer can't bypass it. Everything works offline without it.
- **Tests never use the network:** the geocoder takes its URL from `FAMILY_INSIGHT_GEOCODER_URL`;
  unit and e2e tests run a local HTTP server.

## Map view: Leaflet with tiles through the main process (2026-10, issue #59)

- **Leaflet 1.9 + leaflet.markercluster** rather than MapLibre GL: raster OpenStreetMap tiles are
  all we need, Leaflet is small and works without WebGL (old laptops, VMs, CI). The map is a lazily
  loaded chunk – `MapView` with Leaflet and the cluster plugin is **324 kB (73 kB gzipped) JS +
  25 kB CSS**, loaded only when the map is opened. MapLibre would add ~800 kB and a WebGL
  requirement.
- **Tiles are fetched by main and served as `fi-tile://map/{z}/{x}/{y}.png`** (a privileged custom
  protocol). The CSP allows `img-src fi-tile:` instead of the internet; main enforces the opt-in
  setting `onlineMaps` (off by default, consent on first use), sends an identifying User-Agent and
  caches tiles in memory and on disk for a week, as the OpenStreetMap tile usage policy requires.
  The tile server is configurable (`mapTileUrl`, http(s) with `{z}/{x}/{y}`).
- **Markers are one per place** (core `groupByPlace`), clustered at low zoom; colours are a
  diverging generation scale around the root person (CSS variables `--map-gen-*`, light and dark),
  so they also work for colour-blind readers together with the legend and labels. A selected
  person's places are joined chronologically by a dashed polyline (`migrationPath`).
- The panel with filters, the legend, the picked place's people and the list of places without a
  location is React; Leaflet only draws markers (`LeafletMap`), so most behaviour is testable with
  a stubbed map library. Leaflet gets `invalidateSize()` from a `ResizeObserver` when panels open.
- **Export** captures the map area of the window (`capturePng`), so the PNG matches the screen,
  including the attribution.
- Tests and screenshots use a local tile server (`e2e/tileServer.ts`).

## GEDCOM in pure TypeScript (2026-10, issues #60–#63)

- **Own parser, importer and writer** in `src/core/io/gedcom/` rather than a dependency: the
  grammar is small, ANSEL and CONC/CONT need careful handling, and owning the mapping lets the
  import report exactly what it couldn't take over. Everything is pure, so it also runs on mobile.
- **Never fail an import**: malformed lines, dangling references, cycles, lossy dates and unknown
  tags are warnings or counts; lossy dates keep their original text in the person's notes.
- **Bytes go to the renderer** for `.ged`/`.gdz` (`FileReadResult.bytes`), because the encoding
  can be overridden in the preview and GEDZIP needs unzipping – decoding in main would need a
  second round trip.
- **Media of an import** are loaded by main from the paths in the file, falling back to the same
  file name next to the `.ged` or in its `media` folder (trees from another computer keep absolute
  paths). Exports write media through main as well (folder or GEDZIP), because the bytes live in
  the media library there.
- **Export 5.5.1 by default** (UTF-8): it's what other programs read; 7.0 is an option. Fields
  GEDCOM can't carry are documented in the reference and checked by a round-trip test.

## Updates (2026-10, issues #64–#66)

- **electron-updater with the GitHub provider** for builds that can replace themselves: the
  Windows installer (NSIS) and the AppImage. The release workflow uploads `latest*.yml` and the
  blockmaps (differential downloads).
- **"Notify" builds** – the portable exe, the deb package and the unsigned macOS app (Squirrel.Mac
  requires a Developer ID signature, see #36) – ask the GitHub releases API for the latest version
  and offer the release page instead of installing.
- The policy (which build can do what, semver comparison, daily interval, "skip this version") is
  pure (`src/core/updates.ts`) and unit-tested. Checks run 10 s after start and then when a day has
  passed; automatic checks fail silently, manual ones report errors. Nothing is downloaded without
  consent; "Restart now" first goes through the unsaved-changes question, otherwise the update is
  installed when the app quits.
- Off in development builds and in automated tests (isolated profile), unless a test sets
  `FAMILY_INSIGHT_UPDATE_TEST=1` (with `FAMILY_INSIGHT_UPDATE_TARGET` / `FAMILY_INSIGHT_UPDATE_API`
  to point at local fixtures).

## Internationalisation for more languages (2026-10, issue #68)

- **One locale registry** (`LOCALES` in `src/shared/i18n.ts`) holds each language's dictionary,
  its name in itself and its Excel CSV delimiter; the menu, the pickers and the CSV dialogs read
  it, so a new language is one JSON file plus one registry entry.
- **Plural forms come from the platform**: the locale test asks `Intl.PluralRules` which
  categories a language needs (Polish and Russian: one/few/many/other; French, Spanish, Italian
  and Portuguese: one/many/other) instead of keeping our own table. Every `{{count}}` message is a
  plural key; summaries such as "3 people, 1 family" are joined from `counts.*` messages instead of
  one sentence with several numbers.
- **Untranslated check with an allowlist**: a text identical to English fails unless it has no
  words or is listed as `key` (format names) or `lang:key` (a word that is the same in that
  language).
- **Pseudo-locale `xx`** (accented, 40 % longer) exists only in development builds or with
  `FAMILY_INSIGHT_PSEUDO=1`; it is generated from `en.json` at start, never shipped as a file, and
  formats dates and numbers as English. `PSEUDO_SHOTS=1` renders the screenshot scenes in it.
- **Fonts in exported SVG/PDF**: the export embeds the subsets of Inter and Source Serif 4 that
  cover the tree's text (Latin, Latin Extended, Cyrillic), so the file looks the same without the
  fonts installed.

## Locale-aware CSV, search and sorting (2026-10, issue #69)

- **Code page by letters, UI language as tie-breaker**: a non-UTF-8 CSV is decoded as Windows-1250,
  1251 or 1252, whichever explains its accented letters with one language and leaves the fewest
  broken words. Decoding moved to the renderer (main sends the bytes), so the preview can switch
  the character set without reading the file again.
- **Eight header languages, all accepted on import**: export writes one language's column names and
  `sex` / `living` values; import maps any of them (and common spellings) after folding. Latin
  names are ASCII, Russian ones Cyrillic. A unit test keeps `csv-format.md` listing every name.
  The export dialog offers the header languages of the UI languages (a select once there are more
  than three).
- **Search variants instead of a stronger fold**: `foldText` stays as it is (place keys and header
  matching depend on it). Search compares the query with extra forms of the text – umlauts written
  out (`ü` → `ue`) and Cyrillic transliterated to Latin – instead of folding `ae`/`ue` on both sides,
  which would make "Michael" find "Michał". Highlighting uses the plain fold only.
- **Surname particles** (von, van, der, de, la, du, da, dos, di, del …) are skipped for sorting
  while a word follows, so "Le" alone stays under L; equal keys fall back to the full surname.

## Dates in every language (2026-10, issue #70)

- **Tables, not code paths**: each language's month forms, qualifier phrases, numeric order and a
  small `write` function live in `src/core/date/dateLocales.ts`; the parser and formatter in
  `fuzzyDate.ts` are generic. `write` is a function because prepositions change with the precision
  (`vor 1890` but `vor dem 12. Mai 1890`, `antes de 1890` but `antes del 12 de mayo`).
- **The parser reads every language at once** (the issue asks for "the active language plus
  English"): the month names and qualifiers of the eight languages don't clash, and accepting all of
  them lets CSV files, which have no language, use any. Month prefixes of 3+ letters are accepted
  when they name one month in every language (`mar`, `sept.`; `jui` is refused).
- **`MM/DD/YYYY` only as a fallback** in English (and in CSV, which has no language): when the
  day-first reading is impossible (`05/23/1890`), never when both readings are valid.

## One Portuguese locale, Brazilian (2026-10, issue #75)

`pt` is written in Brazilian Portuguese – the larger user base – with Brazilian vocabulary
(_arquivo_, _planilha_, _sobrenome_), and `pt-PT` (like any `pt-*` tag) maps to it. CSV import also
accepts the European words (`apelido`, `nome de solteira`). A separate `pt-PT` locale can be added
later without changing anything else.

## The user guide in every app language (2026-10, issue #77)

- **Same slugs everywhere** (`/de/guide/csv-import` …), so the VitePress language switcher keeps
  the page; a unit test (`links.test.ts`) and the site test compare the page lists.
- **Site texts as data**: navigation, sidebar, search and theme component texts are one JSON file
  per language (`docs/.vitepress/locales/`) read by `siteLocales.ts`; the config builds every
  locale from them instead of en/pl branches.
- **Screenshots in every language and theme** (63 scenes × 8 × 2). They are generated, not
  hand-made, so the cost is run time (~2.5 h) and ~30 MB in the repository; `Screenshot.vue` falls
  back to English for a language without them.
- **Developer docs stay English**; each language has placeholders that link to the English pages.
- Translations were drafted per language from the English guide, the app's own strings (UI labels
  in the guide match the app exactly) and the glossary, then checked by script for structure,
  anchors, links and frontmatter.

## Relationship calculator UI (2026-10, issue #80)

- **View menu, not a Tools menu**: the app has no Tools menu, and one with a single item would be
  odd, so **Relationship calculator…** sits under View next to Statistics, with a toolbar button
  next to the Statistics button.
- **Reads like its result**: the left box is the person, the right one the reference ("[left] is
  the cousin of [right]"); the path and the banner on the tree run in the same direction.
- **Opening values**: the toolbar and menu fill in the selected person and the root person; a
  card's **Find relationship…** starts from that card (with the root person as the reference).
- **Showing the path** switches to the Family view and expands collapsed branches only when someone
  on the path would otherwise be hidden; the path is per session (cleared when another file opens)
  and ignored once someone on it is deleted. While it is shown it decides what fades, not the
  search.
- **Root-person line** in the details uses the language's `phrase` ("The granddaughter of Piotr
  Kowalski") so it needs no extra UI strings per relationship.
- **Not done: relationship labels on every card** (optional in the issue) – the details line and
  the calculator cover the need without crowding the cards.

## Generations by optimal layering (2026-10, issue #100)

- **Problem**: longest-path layering put both families' oldest known people on the top row. When
  a marriage moved someone down to their partner's row, only that person moved – their parents and
  siblings stayed a row too high, and the line to them spanned two rows.
- **Chosen: network simplex** (Gansner et al., as in Graphviz/dagre) over groups of partners: rows
  minimise the total length of parent → child links, so a whole branch moves with the person, and
  links span one row whenever the data allows. Implemented in `src/core/layout/ranking.ts` (about
  200 lines, no dependency – the decision for a custom engine above still holds); a brute-force
  test checks optimality on small graphs.
- **Fallback**: data with a cycle (someone partnered with their own parent) has no valid layering;
  the previous relaxation is kept for it.
- **Regression fixture** `twoFamiliesFixture` (`src/core/layout/fixtures.ts`) reproduces the shape
  of the user's tree that showed the bug, with invented names; real trees are never committed.
