# Ohara Tree – notes for AI assistants

Electron + React + TypeScript family tree app (EN/PL). Read `docs/ARCHITECTURE.md` first.

## Commands

- `npm run check` – typecheck + lint + tests (must pass before every commit)
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
