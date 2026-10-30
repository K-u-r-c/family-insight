---
description: How changes are made in Family Insight – issues, commits, code style, project rules and the definition of done.
---

# Workflow and conventions

## From issue to merge

1. Every change starts with a [GitHub issue](https://github.com/K-u-r-c/family-insight/issues)
   describing the goal and acceptance criteria.
2. Create a branch (`feat/short-description`, `fix/…`, `docs/…`), make the change and add tests.
3. Run `npm run check` and `npm run build` (and `npm run test:e2e` for UI changes).
4. Open a pull request that references the issue (`Closes #123`). CI must be green.
5. For UI changes, check the result in the **light and dark theme** and in **English and Polish**,
   and attach screenshots.

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `test:`,
`refactor:`, `chore:`, `ci:` …, an optional scope (`fix(csv): …`), a short summary in the imperative
and the issue reference in the body (`Closes #42`).

```text
fix: adding relatives from the details panel

Open the new relative's editor even when the surname is prefilled.

Closes #42
```

## Code style

- **Prettier** formats everything (`npm run format`); **ESLint** catches the rest. CI fails on
  either.
- TypeScript is **strict** (`noUncheckedIndexedAccess`, no unused locals or parameters). Prefix
  intentionally unused parameters with `_`.
- Match the surrounding code: naming, comment density and idioms. Comments explain _why_, not what.

## Project rules

These rules keep the app consistent and easy to extend (they are also in `CLAUDE.md`):

- **Domain logic lives in `src/core`** – pure TypeScript without Electron, React or DOM imports – and
  has Vitest tests next to it.
- **Never hard-code UI text.** Add keys to **both** `src/shared/locales/en.json` and `pl.json`; a test
  fails when the files differ ([How-to](./howto/ui-text)).
- **Never hard-code colours.** Use the CSS variables from `src/renderer/src/styles/tokens.css`.
- **The renderer never touches Node or the file system.** New capabilities go through IPC:
  `src/shared/ipc.ts` → `src/main/ipc.ts` (validate input!) → `src/preload/index.ts`
  ([How-to](./howto/ipc)).
- **CSV behaviour** is specified in the [CSV format reference](./reference/csv-format); keep the
  document and the code in sync.
- Significant technical decisions are recorded in the [decision log](./reference/decisions).

## Definition of done

- [ ] Acceptance criteria of the issue are met.
- [ ] `npm run check` and `npm run build` pass; E2E tests pass for UI changes.
- [ ] New logic has unit tests; new UI flows have an E2E test where reasonable.
- [ ] All new UI text exists in English and Polish.
- [ ] UI checked in light and dark theme, in English and Polish.
- [ ] The user guide and screenshots are updated if the change is visible to users
      ([Updating screenshots](./screenshots)).
- [ ] The commit or PR references the issue.
