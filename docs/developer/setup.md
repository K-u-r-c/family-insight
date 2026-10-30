---
description: Set up a development environment for Family Insight and run the app.
---

# Development setup

## Requirements

- **Node.js 24** or newer (with npm). CI uses Node 24.
- **Git**.
- Linux, macOS or Windows. Building the macOS installer requires macOS; the Windows installer is
  built most reliably on Windows. [CI](./ci-releases) builds all of them.

## Get the code and run it

```sh
git clone https://github.com/K-u-r-c/family-insight.git
cd family-insight
npm install
npm run dev
```

The first start downloads the Electron binary for your platform (about 100 MB) into
`node_modules/electron/dist`.

::: info npm 12 and install scripts
npm 12 blocks dependency install scripts unless they're approved in `allowScripts`. It reports
`esbuild` (nested in VitePress) and `electron-winstaller` – neither script is needed: esbuild's
binary comes from its platform package and electron-winstaller is only used for Squirrel installers,
which Family Insight doesn't build.
:::

`npm run dev` starts electron-vite: the renderer is served by Vite with hot module replacement,
and the main and preload processes are rebuilt and restarted when they change. DevTools are
available from **View → Toggle Developer Tools** in development builds.

Before your first commit, make sure everything passes:

```sh
npm run check   # typecheck + lint + format check + unit tests
npm run build   # production bundle in out/
```

## Editor

Any editor with TypeScript support works. Recommended for VS Code: **ESLint**, **Prettier** (format
on save) and **Vitest** extensions. The workspace uses the TypeScript version from
`node_modules`.

## Platform notes

- **Linux sandbox in E2E tests:** Electron's setuid sandbox helper isn't configured inside
  `node_modules`. If Electron refuses to start in tests, set `ELECTRON_DISABLE_SANDBOX=1` (CI does).
- **Wayland:** Electron runs natively on Wayland. Tests use hidden windows, so they don't open
  windows on your desktop.
- **Headless Linux (CI, containers):** run E2E tests under `xvfb-run -a`.
- **Windows:** use a path without spaces for the repository if native modules complain, and run
  the scripts from PowerShell or Git Bash.

## Where things are stored in development

The app uses the normal settings folder (`~/.config/Family Insight` on Linux,
`%APPDATA%\Family Insight` on Windows, `~/Library/Application Support/Family Insight` on macOS).
To use a throw-away profile, set `FAMILY_INSIGHT_USER_DATA`:

```sh
FAMILY_INSIGHT_USER_DATA=/tmp/fi-profile npm run dev
```
