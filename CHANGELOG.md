# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.0] - 2026-10-30

First public release.

### Added

- **Family tree editor** for Windows, macOS and Linux, fully in English and Polish, with light,
  dark and system themes.
- Graph-based family model: remarriages, half-siblings, adoptive/step/foster parents,
  partnerships with start/end dates and reasons; protection against impossible relationships.
- Person editor with partial and approximate dates (`~1890`, `before 1900`, `05.1890`), birth
  surnames, places with autocomplete, living status, notes and cropped portrait photos; soft
  plausibility warnings.
- One-click relatives (father, mother, partner, child, sibling), linking existing people,
  relationship editing and removal, deletion with confirmation.
- Interactive tree view with a custom family layout engine (couples side by side, children under
  their parents), zoom, pan, minimap, fit, keyboard navigation and screen reader announcements.
- View modes (family, ancestors, descendants, hourglass) with a generation limit and collapsible
  branches, remembered in the file.
- People list with diacritics-insensitive search and sorting; person details with a life
  timeline and age; statistics with the most common names and places and a to-do list.
- Native `.finsight` file format (versioned JSON, migrations, validation), atomic saves,
  unsaved-changes protection, autosave, crash recovery, rotating backups and recent files.
- CSV import (delimiter and encoding detection incl. Windows-1250, English/Polish headers, column
  mapping, preview with errors and warnings, merge into the current tree) and export (UTF-8 BOM,
  `,` or `;`, English/Polish headers), sample files and a template.
- Export of the tree as PNG, SVG or PDF and printing, always in print-friendly colours.
- Complete localized native menu, About dialog, shortcut cheat sheet (`?`/`F1`), edit context
  menus and accessibility fixes (WCAG 2.1 AA in automated audits).
- Installers: Windows (NSIS in English and Polish, portable), macOS (DMG for Apple Silicon and
  Intel, ad-hoc signed), Linux (AppImage, deb with `.finsight` file association); app icon.
- Documentation: README and user guide in English and Polish, CSV and file format specs.

[Unreleased]: https://github.com/K-u-r-c/family-insight/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/K-u-r-c/family-insight/releases/tag/v1.0.0
