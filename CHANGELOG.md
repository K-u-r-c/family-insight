# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.2.0] - 2026-10-31

### Added

- **Relationship calculator** (toolbar, **View → Relationship calculator…** or a card's
  **Find relationship…**): how two people are related, in words of the app's language – first
  cousin once removed, brat stryjeczny, Großtante, cousin issu de germain, троюродная сестра – with
  every relationship when there are several and the path between them, which **Show on tree**
  highlights. The details of every person say how they are related to the root person.
- The user guide on the website in all eight languages; **Help → User Guide** opens it in the
  app's language.
- User interface in **German** (Deutsch), **French** (Français), **Spanish** (Español),
  **Italian** (Italiano), **Portuguese** (Português) and **Russian** (Русский), with installers and
  desktop entries in those languages.
- CSV import reads column names and values in German, French, Spanish, Italian, Portuguese and
  Russian, recognises Cyrillic (Windows-1251) and Western European (Windows-1252) files from older
  Excel versions, and lets you pick another character set in the preview.
- Dates can be typed with month names in any of the app's languages and forms (`12 marca 1890`,
  `12. Mai 1890`, `1er mai 1890`, `12 de mayo de 1890`, `12 марта 1890`, `sept. 1890`) and with
  their words for about, before and after.
- Search finds German spellings both ways (`mueller` → Müller, `strasse` → Straße) and Cyrillic
  names typed in Latin letters (`ivanov` → Иванов).

### Changed

- Surname particles (von, van, de, da, dos, di …) no longer count for sorting: "van der Berg" is
  listed under B.
- The language is chosen from a list that shows every language in its own name – ready for more
  languages.
- Counts read correctly in every language ("1 family", "2 sources" …).
- Exported images and PDFs embed the app's fonts, so they look the same on every computer.

## [1.1.0] - 2026-10-30

### Added

- **Life events** besides birth and death – baptism, emigration, military service, occupation,
  residence and more, with dates, periods, places and descriptions; shown in the details timeline,
  searchable and counted in the statistics.
- **Sources and citations** – a sources manager (**Edit → Sources…**) with repositories, and
  citations with page, quality, date and transcription for names, birth, death, events,
  relationships and marriages.
- **Photos and documents** – a gallery for every person (JPG, PNG, WebP, GIF, PDF), a viewer with
  zoom and the built-in PDF viewer, titles, dates and descriptions, family photos shown on several
  people, any gallery picture as the portrait, and scans attached to sources and citations. Stored
  once inside the `.finsight` file, however often they are used; saving stays fast for trees of
  hundreds of megabytes.
- **Places** – a list of all places with how often they are used (**Edit → Places…**), locations
  entered by hand or looked up online (optional, off by default: only the place name is sent to
  OpenStreetMap), and merging of different spellings.
- **Map** of where the family lived (**View → Map**): markers by place coloured by generation,
  filters by event type and period, the people at a place, a person's path through life, places
  still without a location, PNG export. The map background from OpenStreetMap is optional and off
  until you allow it.
- **GEDCOM import and export** (**File → Import / Export → GEDCOM**, or drop a `.ged` file):
  GEDCOM 5.5, 5.5.1 and 7.0 including GEDZIP, ANSEL and UTF-16 files, with a preview of what will
  be imported; export as 5.5.1 or 7.0 with photos (folder or `.gdz`), optionally hiding living
  people.
- **Automatic updates**: a notice when a new version is out, with release notes, download in the
  background and installation on restart (Windows installer and AppImage; other builds open the
  download page); **Help → Check for Updates…** and a switch in the settings.

### Changed

- **`.finsight` files are now zip containers** (schema 3). Trees from 1.0 open and are saved in the
  new format; **Family Insight 1.0 can't open files saved by 1.1** – update every computer you use.
- Backup copies (`.bak1…5`) are hard links where the file system allows it, so they are instant even
  for large trees.

## [1.0.1] - 2026-10-30

### Added

- Documentation website at <https://k-u-r-c.github.io/family-insight/> – a user guide in English
  and Polish with screenshots of every step, and developer documentation.

### Changed

- **Help → User Guide** and the CSV help links open the documentation website in the language of the
  app; the Polish menu item is now called **Poradnik**.
- The keyboard shortcut sheet also lists <kbd>Ctrl</kbd>+<kbd>W</kbd> (close the tree) and shows
  the Delete key as ⌫ on macOS; the user guide renders the same list.

### Fixed

- Adding a father, child or sibling from the details panel now opens the new person's editor even
  when the surname is filled in automatically (before, only relatives without a surname did).
- A new father of a woman gets the masculine form of a Polish surname (Kowalska → Kowalski).
- **+ Parent** for a person who already has two biological parents adds a step-parent instead of
  failing with an error.

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

[Unreleased]: https://github.com/K-u-r-c/family-insight/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/K-u-r-c/family-insight/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/K-u-r-c/family-insight/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/K-u-r-c/family-insight/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/K-u-r-c/family-insight/releases/tag/v1.0.0
