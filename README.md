<div align="center">

# 🌳 Ohara Tree

**A beautiful, simple family tree editor for Windows, macOS and Linux.**

English · [Polski](README.pl.md)

</div>

Ohara Tree helps you build your family tree, browse it comfortably and keep it up to date.
Your data stays on your computer in a single `.ohara` file. Import and export via CSV lets you
work with Excel, LibreOffice or Google Sheets.

> 🚧 **Status:** early development. Track progress in
> [Issues](https://github.com/K-u-r-c/ohara-tree/issues) and
> [Milestones](https://github.com/K-u-r-c/ohara-tree/milestones).

## Features (planned for 1.0)

- Interactive tree view with zoom, pan and focus on any person
- Add and edit people, parents, children, partners (remarriages, half-siblings, adoption)
- Partial dates (`~1890`, `before 1900`), places, notes and photos
- Fast search that ignores diacritics (`lodz` finds `Łódź`)
- Undo/redo, autosave and recent files
- **CSV import and export**, Excel-friendly in both English and Polish
- English and Polish interface, light and dark theme

## Download

Get the latest installer from [Releases](https://github.com/K-u-r-c/ohara-tree/releases/latest):

| System  | File                                                                          |
| ------- | ----------------------------------------------------------------------------- |
| Windows | `ohara-tree-<version>-setup.exe` or `-portable.exe`                           |
| macOS   | `ohara-tree-<version>-mac-arm64.dmg` (Apple Silicon) / `-mac-x64.dmg` (Intel) |
| Linux   | `.AppImage` or `.deb`                                                         |

The builds are not code-signed yet:

- **Windows:** if SmartScreen appears, click _More info → Run anyway_.
- **macOS:** right-click the app → _Open_, or run `xattr -cr "/Applications/Ohara Tree.app"`.
- **Linux (AppImage):** `chmod +x ohara-tree-*.AppImage` and run it.

## Development

Requirements: Node.js 24+ and npm.

```bash
npm install
npm run dev        # start the app with hot reload
npm run check      # typecheck + lint + unit tests
npm run dist       # build installers for the current OS into dist/
```

| Script                                         | Description                                   |
| ---------------------------------------------- | --------------------------------------------- |
| `npm run dev`                                  | Run in development mode                       |
| `npm run build`                                | Bundle main, preload and renderer into `out/` |
| `npm test`                                     | Unit tests (Vitest)                           |
| `npm run lint` / `npm run format`              | ESLint / Prettier                             |
| `npm run dist:linux` / `dist:win` / `dist:mac` | Platform installers                           |

Releases are built by GitHub Actions for all three platforms when a `v*` tag is pushed.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [CSV format](docs/CSV_FORMAT.md)
- [`.ohara` file format](docs/FILE_FORMAT.md)
- [Contributing](CONTRIBUTING.md)

## Tech stack

Electron · React · TypeScript · Vite (electron-vite) · Zustand · i18next · Vitest · electron-builder

## License

[MIT](LICENSE)
