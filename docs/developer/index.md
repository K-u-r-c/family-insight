---
description: Developer documentation for Family Insight – tech stack, repository map and where to start.
---

# Developer documentation

Family Insight is an Electron desktop app written in TypeScript with a React UI. This section is for
people who want to build it, change it or add features. (The [user guide](/guide/) explains how to
use the program.)

## Tech stack

| Area          | Technology                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------- |
| Desktop shell | **Electron 45** (main process, preload, sandboxed renderer)                                       |
| Build         | **electron-vite 6** on **Vite 8**; **electron-builder 26** for installers                         |
| UI            | **React 19**, CSS modules with design tokens, **lucide-react** icons                              |
| State         | **Zustand 5** stores, command pattern for undo/redo                                               |
| Language      | **TypeScript 6.0** (strict)                                                                       |
| Translations  | **i18next 26** + **react-i18next 17** (English and Polish)                                        |
| Tests         | **Vitest 5** (unit, jsdom + Testing Library), **Playwright 1.64** (E2E on the real app), axe-core |
| Documentation | **VitePress 1.6**, deployed to GitHub Pages                                                       |

## Repository map

```text
family-insight/
├── src/
│   ├── core/              Pure TypeScript domain logic – no Electron, React or DOM
│   │   ├── model/         Person/Relationship types, graph queries, operations, validation
│   │   ├── date/          FuzzyDate: parsing, formatting, ages, plausibility warnings
│   │   ├── file/          .finsight serialisation, schema checks, migrations, text decoding
│   │   ├── io/            Import/export format registry and adapters (csv/)
│   │   ├── layout/        Family tree layout engine and keyboard navigation
│   │   └── *.ts           history (undo), search, stats, timeline, settings, text helpers
│   ├── shared/            Used by main and renderer: IPC contract, i18n, locales, shortcuts
│   ├── main/              Electron main process: window, menu, IPC handlers, files, settings,
│   │                      recovery, backups, printing
│   ├── preload/           The only bridge: typed window.familyInsight API (contextBridge)
│   └── renderer/src/      React app
│       ├── features/      welcome, workspace, tree, person, people, csv, export, stats, help …
│       ├── components/    UI kit (Button, Dialog, Menu, TextField …) and shared pieces
│       ├── store/         Zustand stores: document (+ history), settings, tree view, UI
│       ├── services/      File flows, autosave/recovery, sample tree
│       ├── hooks/         Menu, file, shortcut and theme integration
│       └── styles/        tokens.css (colours, spacing, type) and global styles
├── e2e/                   Playwright tests driving the built app (+ fixtures)
├── docs/                  This website (VitePress): guide, pl/guide, developer, screenshots
├── build/                 App icons and installer assets
├── resources/samples/     Sample family CSV files bundled with the app
├── scripts/               icons.mjs (generates icons from build/icon.svg)
└── .github/workflows/     ci.yml, docs.yml, release.yml
```

## Where to start

1. [Set up the project](./setup) and run it.
2. Read the [architecture overview](./architecture) – especially the principles.
3. Learn the [workflow and conventions](./workflow) and how to [test](./testing).
4. Pick a task from the [issues](https://github.com/K-u-r-c/family-insight/issues) and follow a
   [how-to guide](./howto/ui-text).
