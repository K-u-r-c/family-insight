# Family Insight – notes for AI assistants

Electron + React + TypeScript family tree app (eight UI languages). Read `docs/developer/architecture.md` first.

## Commands

- `npm run check` – typecheck + lint + format check + tests (must pass before every commit; mirrors CI)
- `npm run format` – Prettier
- `npm run build` – bundle to `out/`; `npm run dist:dir` – unpacked packaged app in `dist/`
- `npm run dev` – run the app

## Rules

- Domain logic in `src/core` (pure TS, no Electron/React imports) with Vitest tests.
- Never hard-code UI text: add keys to **every** locale file in `src/shared/locales/` (plural forms
  per language; `src/shared/i18n.test.ts` checks keys, plurals and placeholders).
- Never hard-code colours or fonts: use CSS variables from `src/renderer/src/styles/tokens.css`
  (every visual style overrides them, e.g. `styles/tapestry.css`).
- Renderer never accesses Node/fs; add IPC in `src/shared/ipc.ts` → `src/main/ipc.ts` →
  `src/preload/index.ts`, and validate input in main.
- CSV behaviour is specified in `docs/developer/reference/csv-format.md`; keep the doc and code in sync.
- Step-by-step guides for common changes live in `docs/developer/howto/`: `ui-text.md`,
  `setting.md`, `ipc.md`, `menu.md`, `person-field.md`, `format.md`, `view-mode.md`, `language.md`,
  `style.md`, `tour.md`.
  The `.finsight` format and its versioning policy: `docs/developer/reference/file-format.md`.
- User-visible changes: update the user guide (`docs/guide`, `docs/pl/guide`) and regenerate the
  affected screenshots (`npm run docs:screenshots -- -g <scene>`).
- Commits: Conventional Commits, reference the issue (`Closes #N`).

## Working through the backlog

Done: #1–#33 (v1.0.0), #38–#51 (documentation site, v1.0.1), #52–#81 (v1.1.0, v1.2.0) and
#100–#103 (v1.2.1).
**Current scope: #104–#111** – milestone v1.3 (Tapestry style with a style switch, built-in guided
tour, release v1.3.0), strictly in issue-number order. Update the user guide in all 8 languages,
but regenerate screenshots only for new or directly affected scenes
(`npm run docs:screenshots -- -g <scene>`), never a full regeneration.
Out of scope: the mobile apps (#82–#98, in the Backlog milestone – planned for the future), #36
(paid code signing) and #99 (store publishing, deferred); #34, #35 and #37 are superseded by the
roadmap issues.

- One issue at a time: implement → `npm run check` + `npm run build` (+ `npm run docs:build`
  when docs change) → update the user guide and affected screenshots → commit straight to
  `main` with `Closes #N` in the message → push → wait for CI to be green
  (`gh run watch`) before starting the next issue. Fix red CI immediately.
- Once #77 is closed, user-guide updates apply to **every** language of the docs site.
- Tests never use the network: mock servers (geocoder, map tiles, updates).
- "Screenshot in the PR" = render the app offscreen (Electron `capturePage`), inspect the
  image yourself in both themes and both languages; no PR needed.
- Acceptance criteria that need hardware/software unavailable here (Windows, macOS, Excel,
  fps on specific laptops): verify everything possible on Linux / in CI, then add an issue
  comment stating what could not be verified and why. Never tick such a box falsely and
  never stall on it.
- Make technical decisions autonomously; record significant ones in `docs/developer/reference/decisions.md`.
- macOS/Windows builds can only be verified in GitHub Actions: use
  `gh workflow run release.yml` (workflow_dispatch builds all OSes without publishing).
