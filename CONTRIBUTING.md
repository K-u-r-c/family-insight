# Contributing

Thanks for helping with Family Insight!

1. Fork and clone, then `npm install`.
2. Create a branch: `git checkout -b feat/short-description`.
3. Run `npm run dev` and make your change.
4. Make sure `npm run check` passes.
5. Open a pull request that references the issue (`Closes #123`).

## Conventions

- **Domain logic goes in `src/core`** with unit tests next to it (`*.test.ts`).
- **Every UI string** must exist in both `src/shared/locales/en.json` and `pl.json`.
  The test suite fails if the keys differ.
- **Styling** uses CSS modules and the variables in `src/renderer/src/styles/tokens.css`.
  No hard-coded colours. Check both light and dark themes.
- **IPC:** add the channel and types to `src/shared/ipc.ts`, implement it in
  `src/main/ipc.ts` and `src/preload/index.ts`, and validate the payload in main.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `docs:`, `chore:` …).

## Adding a language

1. Copy `src/shared/locales/en.json` to `xx.json` and translate it.
2. Register it in `src/shared/i18n.ts` (`SUPPORTED_LANGUAGES` and `resources`).
3. Add the language name under `language.xx` in every locale file.
