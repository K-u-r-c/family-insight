<div align="center">

# 🌳 Family Insight

**A beautiful, simple family tree editor for Windows, macOS and Linux.**

English · [Polski](README.pl.md)

</div>

Family Insight helps you build your family tree, browse it comfortably and keep it up to date.
Your data stays on your computer in a single `.finsight` file. Import and export via CSV lets you
work with Excel, LibreOffice or Google Sheets.

> 🚧 **Status:** early development. Track progress in
> [Issues](https://github.com/K-u-r-c/family-insight/issues) and
> [Milestones](https://github.com/K-u-r-c/family-insight/milestones).

## Features (planned for 1.0)

- Interactive tree view with zoom, pan and focus on any person
- Add and edit people, parents, children, partners (remarriages, half-siblings, adoption)
- Partial dates (`~1890`, `before 1900`), places, notes and photos
- Fast search that ignores diacritics (`lodz` finds `Łódź`)
- Undo/redo, autosave and recent files
- **CSV import and export**, Excel-friendly in both English and Polish
- English and Polish interface, light and dark theme

## Download

Get the latest installer from [Releases](https://github.com/K-u-r-c/family-insight/releases/latest):

| System  | File                                                                              |
| ------- | --------------------------------------------------------------------------------- |
| Windows | `family-insight-<version>-setup.exe` or `-portable.exe`                           |
| macOS   | `family-insight-<version>-mac-arm64.dmg` (Apple Silicon) / `-mac-x64.dmg` (Intel) |
| Linux   | `.AppImage` or `.deb`                                                             |

The builds are not code-signed yet:

- **Windows:** if SmartScreen appears, click _More info → Run anyway_.
- **macOS:** right-click the app → _Open_, or run `xattr -cr "/Applications/Family Insight.app"`.
- **Linux:** the `.deb` package (`sudo apt install ./family-insight-*.deb`) adds a menu entry and
  opens `.finsight` files on double-click. The AppImage runs anywhere: `chmod +x family-insight-*.AppImage`
  and start it.

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
- [`.finsight` file format](docs/FILE_FORMAT.md)
- [Translations](docs/I18N.md)
- [Contributing](CONTRIBUTING.md)

## Tech stack

Electron · React · TypeScript · Vite (electron-vite) · Zustand · i18next · Vitest · electron-builder

## License

[MIT](LICENSE)
