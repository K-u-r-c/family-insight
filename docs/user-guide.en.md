# Family Insight – user guide

English · [Polski](user-guide.pl.md)

## 1. Getting started

When you start Family Insight you see the welcome screen:

- **New family tree** – give your tree a name and the editor for the first person opens straight
  away. Start with yourself or with the oldest ancestor you know.
- **Open tree…** – open a `.finsight` file. You can also double-click a `.finsight` file or drop it
  on the window.
- **Import from CSV…** – start from a spreadsheet (see [CSV](#7-csv-import-and-export)).
- **Try a sample family** – a demo tree of 25 people to explore.
- **Recent** – the trees you opened last. Files that were moved or deleted are crossed out; remove
  them from the list with ×.

Switch the language (English/Polski) and the theme (system, light, dark) in the top-right corner of
the welcome screen, or later in the settings menu (⚙) and in _View_ in the menu bar.

## 2. Adding people and relatives

- **Add person** in the toolbar (or `Ctrl+Shift+N` / `⌘⇧N`) creates a person and opens the editor.
- In a person's panel, the **Family** section lists parents, partners, children and siblings. Use
  **+ Father**, **+ Mother**, **+ Partner**, **+ Child** or **+ Sibling** to create a relative in one
  click — the new person is linked and selected so you can type the name right away.
  - A new father gets the family surname automatically.
  - When the person already has one parent, the new parent becomes their partner.
  - When a person with several partners gets a child, you are asked who the other parent is.
- The link icon next to each group connects a person who is **already in the tree**.
- Right-click a card on the tree for the same actions.

## 3. Editing a person

Click a person to see their details; click **Edit** (or double-click the card, or press `Enter`)
to change them. Changes are saved as you leave each field; `Esc` cancels the current field.

- **Names** – given names, surname and, if needed, the **birth surname** (maiden name).
- **Dates** – type a year (`1890`), a month (`05.1890` or `1890-05`) or a full date (`12.05.1890`
  or `1890-05-12`). Uncertain? Prefix with `~` (about), `<` (before) or `>` (after) — or pick the
  precision from the list. A preview shows how the date will be displayed.
- **Places** – suggestions come from places already used in the tree.
- **Life status** – living, deceased or unknown.
- **Photo** – _Add photo…_ or drop an image on the circle, then crop it. Photos are stored inside the
  `.finsight` file (resized to 512 px).
- **Notes** – anything worth remembering.

Soft warnings appear for unlikely data (death before birth, a parent younger than their child,
someone older than 120) — they never block you.

To change a relationship, open the **⋯** menu next to a relative: mark a parent as adoptive, step
or foster, edit a partnership (type, start and end dates, how it ended) or remove the relationship.
**Delete person** (🗑 in the panel or the `Delete` key) asks for confirmation. Everything can be
undone with `Ctrl+Z` / `⌘Z`.

## 4. Exploring the tree

- **Move** by dragging the background, **zoom** with the mouse wheel or the controls in the
  bottom-right corner, **fit** the whole tree with ⛶ or `F`.
- The **minimap** (bottom-left) shows where you are; click or drag in it to move.
- **Keyboard:** click the tree (or use the _Skip to the family tree_ link) and use the arrows:
  ↑ parent, ↓ child, ←/→ partner or sibling. `Enter` edits, `+`/`−` zoom, `0` resets the zoom.
- **View modes** in the toolbar: _Family_ (everyone), _Ancestors_, _Descendants_ and _Hourglass_
  (both) of the **root person** (🏠, set from a card's menu) or of the selected person, with a number
  of generations.
- Hover a card and use −/+ under it to collapse or expand a branch.
- The view (mode, generations, collapsed branches) is saved with the file.

## 5. Finding people

Press `Ctrl+F` / `⌘F` or click the search box. Search ignores letter case and Polish diacritics:
`lodz` finds _Łódź_, `zolkiewski` finds _Żółkiewski_. You can search names, birth surnames, places
and years. Matches are highlighted in the list and on the tree; `↓` moves to the results, `Esc`
clears the search. Sort the list by surname, given name or date of birth with ⇅.

## 6. Saving, autosave and backups

- `Ctrl+S` / `⌘S` saves, `Ctrl+Shift+S` / `⌘⇧S` saves under a new name.
- **Autosave** (on by default, settings menu ⚙) saves a tree that already has a file 2 seconds
  after every change.
- If the app or computer crashes, the next start offers to **restore unsaved work**.
- Each manual save keeps the previous five versions next to the file as `name.finsight.bak1` …
  `.bak5` (rename one to `.finsight` to open it).

## 7. CSV import and export

**Export:** _File → Export → CSV…_. Choose the column separator — **semicolon** for Excel with
Polish regional settings, **comma** otherwise — and English or Polish column names. The file opens
correctly in Excel, LibreOffice Calc and Google Sheets.

**Import:** _File → Import → CSV…_ (or drop a `.csv` file on the window). Before anything changes,
a preview shows:

- the detected separator and text encoding (UTF-8 or Windows-1250),
- how each column will be used — change it if a column was not recognised,
- the first rows, problems that must be fixed (with row numbers) and warnings you can accept.

Import into a **new tree** or **add to the current tree** (one step you can undo).

Tips for spreadsheets:

- One row per person. Every row needs an `id` (any text, e.g. `p1`) and a name.
- Parents go to `father_id` / `mother_id`, partners to `partner_ids` separated by `|` (`p2|p5`).
- Column names can be English or Polish (`imiona`, `nazwisko`, `data_urodzenia`, …).
- Use _Help → Download CSV template…_ for an empty sheet, and see the full
  [CSV format](developer/reference/csv-format.md).

CSV keeps names, dates, places, living status, biological parents, partners and notes. Photos,
partnership dates and adoptive links are kept only in `.finsight` files.

## 8. Printing and images

_File → Export → Image…_ saves the whole tree or the visible area as **PNG** (1×–3×), **SVG**
or **PDF** (A4, A3 or Letter, fitted to one page), optionally with the tree name and date.
_File → Print…_ (`Ctrl+P` / `⌘P`) prints the tree. Exports always use the light colours.

## 9. Statistics

The 📊 button shows how many people the tree has, how many generations, the average lifespan, the
most common names, surnames and birth places (click one to highlight those people) and a to-do list
of people without dates or parents.

## 10. Keyboard shortcuts

Press `?` or `F1` for the full list.

| Action           | Windows / Linux           | macOS        |
| ---------------- | ------------------------- | ------------ |
| New tree         | `Ctrl+N`                  | `⌘N`         |
| Open             | `Ctrl+O`                  | `⌘O`         |
| Save / Save as   | `Ctrl+S` / `Ctrl+Shift+S` | `⌘S` / `⌘⇧S` |
| Add person       | `Ctrl+Shift+N`            | `⌘⇧N`        |
| Undo / Redo      | `Ctrl+Z` / `Ctrl+Y`       | `⌘Z` / `⌘⇧Z` |
| Search           | `Ctrl+F`                  | `⌘F`         |
| Print            | `Ctrl+P`                  | `⌘P`         |
| Edit selected    | `Enter`                   | `Enter`      |
| Delete selected  | `Delete`                  | `⌫`          |
| Move in the tree | arrows                    | arrows       |
| Fit / zoom       | `F`, `+`, `−`, `0`        | same         |
