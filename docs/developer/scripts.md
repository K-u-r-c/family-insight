---
description: Every npm script of Family Insight – what it does and when to use it.
---

# Scripts

All scripts are run with `npm run <name>` (`npm test` for `test`).

## Develop

| Script    | What it does                                                       |
| --------- | ------------------------------------------------------------------ |
| `dev`     | Starts the app with hot reload (electron-vite dev server).         |
| `build`   | Bundles main, preload and renderer into `out/` (production build). |
| `preview` | Runs the production bundle from `out/` without packaging.          |

## Quality

| Script           | What it does                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------------- |
| `check`          | `typecheck` + `lint` + `format:check` + `test` – run before every commit; mirrors the CI check job. |
| `typecheck`      | All four TypeScript projects below.                                                                 |
| `typecheck:node` | Main process, preload, shared and core code (`tsconfig.node.json`).                                 |
| `typecheck:web`  | Renderer (`tsconfig.web.json`).                                                                     |
| `typecheck:e2e`  | Playwright tests and the screenshot scenes (`tsconfig.e2e.json`).                                   |
| `typecheck:docs` | VitePress config and theme (`tsconfig.docs.json`).                                                  |
| `lint`           | ESLint for the whole repository.                                                                    |
| `format`         | Formats everything with Prettier.                                                                   |
| `format:check`   | Fails if a file isn't formatted.                                                                    |
| `test`           | Unit tests once (Vitest).                                                                           |
| `test:watch`     | Unit tests in watch mode.                                                                           |
| `test:e2e`       | Builds the app and runs the Playwright end-to-end tests against it.                                 |

## Package

| Script       | What it does                                                                |
| ------------ | --------------------------------------------------------------------------- |
| `dist`       | Builds and creates the installers for the current OS in `dist/`.            |
| `dist:dir`   | Builds an unpacked app in `dist/` (fast; for checking packaging).           |
| `dist:linux` | AppImage and `.deb`.                                                        |
| `dist:win`   | NSIS installer and portable `.exe`.                                         |
| `dist:mac`   | DMG for x64 and arm64 (needs macOS).                                        |
| `icons`      | Regenerates all app icons from `build/icon.svg` ([Packaging](./packaging)). |

## Documentation

| Script             | What it does                                                                                        |
| ------------------ | --------------------------------------------------------------------------------------------------- |
| `docs:dev`         | Serves this website with hot reload at `http://localhost:5173/family-insight/`.                     |
| `docs:build`       | Builds the website into `docs/.vitepress/dist` (fails on dead links).                               |
| `docs:preview`     | Serves the built website.                                                                           |
| `docs:test`        | Checks the built website: links and anchors, accessibility in both themes, phone layout and search. |
| `docs:screenshots` | Builds the app and regenerates every documentation screenshot ([how](./screenshots)).               |
