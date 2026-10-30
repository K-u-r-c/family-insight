---
description: Unit tests with Vitest and end-to-end tests with Playwright driving the real Electron app – helpers, test hooks and accessibility audits.
---

# Testing

## Unit tests (Vitest)

```sh
npm test            # once
npm run test:watch  # watch mode
npx vitest run src/core/search.test.ts   # one file
```

- Tests live next to the code as `*.test.ts` / `*.test.tsx` (`vitest.config.mts` includes
  `src/**`).
- Domain code in `src/core` is pure and tested directly – the layout engine, dates, CSV, history,
  search, stats and more. Shared fixtures (for example a sample tree) are in `src/core/test`.
- React components run in **jsdom** with Testing Library (`src/renderer/src/test` holds the
  setup).
- `src/shared/i18n.test.ts` checks that English and Polish have the same keys, the required plural
  forms, and that every model error code has a translation.

## End-to-end tests (Playwright)

```sh
npm run test:e2e                       # build + all E2E tests
npx playwright test e2e/csv.spec.ts    # one file (after npm run build)
```

The tests drive the **built app** (`out/`) with Playwright's Electron support. Helpers in
`e2e/app.ts`:

| Helper                                        | Purpose                                                                      |
| --------------------------------------------- | ---------------------------------------------------------------------------- |
| `launch({ language, theme, args, userData })` | Starts the app with a fresh, temporary profile in a **hidden** window.       |
| `mockDialogs(app, { open, save, message })`   | Replaces the native open/save/message dialogs in main with scripted answers. |
| `tempDir()`                                   | A temporary folder for files the test creates.                               |
| `closeApp(app)`                               | Closes the app, answering “Don't save” if it asks.                           |

### Test hooks

| Hook                             | Effect                                                                                   |
| -------------------------------- | ---------------------------------------------------------------------------------------- |
| `FAMILY_INSIGHT_USER_DATA=<dir>` | Uses `<dir>` as the settings/recovery folder instead of the real profile.                |
| `FAMILY_INSIGHT_HIDDEN=1`        | Never shows the window, but keeps it rendering (no background throttling).               |
| `window.__familyInsight`         | Exposes the Zustand stores (`useDocument`, `useSettings`, `useTreeView`) for assertions. |

Native menu accelerators can't be triggered with synthetic key presses. To run a menu command,
send it the way the menu does:

```ts
await app.evaluate(({ BrowserWindow }) => {
  BrowserWindow.getAllWindows()[0]!.webContents.send('menu:action', 'file:save')
})
```

### Accessibility

`e2e/a11y.spec.ts` injects **axe-core** into the page (Playwright's `AxeBuilder` needs to open extra
pages, which Electron doesn't allow) and fails on serious or critical violations in both themes.
It also checks keyboard access: the shortcut sheet, the skip link and screen-reader announcements.

### Running in CI or without a display

CI runs the E2E job on Ubuntu with `xvfb-run -a npx playwright test` and
`ELECTRON_DISABLE_SANDBOX=1`. On failure, traces are uploaded as the `e2e-results` artifact – open
them with `npx playwright show-trace trace.zip`.

## Documentation tests

`npm run docs:build && npm run docs:test` (`playwright.docs.config.ts`, `docs/.test/site.spec.ts`)
serves the built website and checks every page: no console errors or failed requests, a title,
description and previous/next links, every internal link, anchor and image resolves, axe-core finds
no serious or critical violations in **light and dark** mode, nothing overflows a 375 px phone
screen, the menu and the search work in both languages, and the English and Polish guides have the
same pages. It drives the site with the Electron that the app already uses (an offscreen window), so
no extra browser has to be downloaded; the Docs workflow runs it under xvfb before deploying.

## Tips

- Prefer **roles and labels** (`getByRole('button', { name: 'Save' })`) over CSS classes – class
  names are hashed CSS modules.
- When names collide (a card in the tree and a row in the list), scope the locator to its region,
  for example `page.getByRole('application', { name: 'Family tree' })`.
- A new person without a name keeps the editor open; commit the name with **Enter** before looking
  for **Done**.
