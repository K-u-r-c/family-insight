# Ohara Tree – notes for AI assistants

Electron + React + TypeScript family tree app (EN/PL). Read `docs/ARCHITECTURE.md` first.

## Commands

- `npm run check` – typecheck + lint + format check + tests (must pass before every commit; mirrors CI)
- `npm run format` – Prettier
- `npm run build` – bundle to `out/`; `npm run dist:dir` – unpacked packaged app in `dist/`
- `npm run dev` – run the app

## Rules

- Domain logic in `src/core` (pure TS, no Electron/React imports) with Vitest tests.
- Never hard-code UI text: add keys to **both** `src/shared/locales/en.json` and `pl.json`.
- Never hard-code colours: use CSS variables from `src/renderer/src/styles/tokens.css`.
- Renderer never accesses Node/fs; add IPC in `src/shared/ipc.ts` → `src/main/ipc.ts` →
  `src/preload/index.ts`, and validate input in main.
- CSV behaviour is specified in `docs/CSV_FORMAT.md`; keep the doc and code in sync.
- Commits: Conventional Commits, reference the issue (`Closes #N`).

## Working through the backlog

Issues #1–#33 (milestones MVP and v1.0) are the full 1.0 scope, already ordered by
dependency – implement them in numeric order. #34+ (Backlog) are out of scope for 1.0.

- One issue at a time: implement → `npm run check` + `npm run build` → commit straight to
  `main` with `Closes #N` in the message → push → wait for CI to be green
  (`gh run watch`) before starting the next issue. Fix red CI immediately.
- "Screenshot in the PR" = render the app offscreen (Electron `capturePage`), inspect the
  image yourself in both themes and both languages; no PR needed.
- Acceptance criteria that need hardware/software unavailable here (Windows, macOS, Excel,
  fps on specific laptops): verify everything possible on Linux / in CI, then add an issue
  comment stating what could not be verified and why. Never tick such a box falsely and
  never stall on it.
- Make technical decisions autonomously; record significant ones in `docs/ARCHITECTURE.md`.
- macOS/Windows builds can only be verified in GitHub Actions: use
  `gh workflow run release.yml` (workflow_dispatch builds all OSes without publishing).
