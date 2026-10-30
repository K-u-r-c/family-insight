---
description: Import a family tree from Excel, LibreOffice or Google Sheets – prepare the sheet, check the preview and fix common errors.
---

# Import from CSV

Have your family in a spreadsheet already? Family Insight can read it from a **CSV** file – the
format every spreadsheet program can save.

## 1. Prepare the spreadsheet

Use **one row per person** and these columns (in any order, with English or Polish names):

| Column                       | Polish name                            | What to write                                                         |
| ---------------------------- | -------------------------------------- | --------------------------------------------------------------------- |
| `id` **(required)**          | `id`                                   | any short, unique label for the person, for example `p1`, `p2` …      |
| `given_names`                | `imiona`                               | given names                                                           |
| `surname`                    | `nazwisko`                             | surname                                                               |
| `birth_surname`              | `nazwisko_rodowe`                      | birth (maiden) surname                                                |
| `sex`                        | `plec`                                 | `female` / `male` (or `F`, `M`, `kobieta`, `mężczyzna`)               |
| `birth_date`, `death_date`   | `data_urodzenia`, `data_smierci`       | `1890`, `05.1890`, `12.05.1890`, `~1890` … ([dates](./editing#dates)) |
| `birth_place`, `death_place` | `miejsce_urodzenia`, `miejsce_smierci` | the town or village                                                   |
| `living`                     | `zyje`                                 | `yes` / `no` (or `tak` / `nie`)                                       |
| `father_id`, `mother_id`     | `ojciec_id`, `matka_id`                | the **id** of the father and mother                                   |
| `partner_ids`                | `partnerzy_id`                         | the **ids** of partners, separated by `\|` – for example `p2\|p5`     |
| `notes`                      | `notatki`                              | anything else                                                         |

Column names and values in **German, French, Spanish, Italian, Portuguese and Russian** work too
(for example `vornamen`, `nom`, `fecha_de_nacimiento`, `фамилия`; `männlich`, `oui`, `да`) – all
names are listed in the [CSV format reference](/developer/reference/csv-format#columns). For
patronymics and double surnames, see [names from other countries](./editing#name-conventions).

Every person needs an **id** and at least a given name or a surname; all other columns are
optional. Relatives are connected through the ids – for example `p3` with `father_id` `p1` and
`mother_id` `p2` is the child of `p1` and `p2`. A partnership needs to be listed on one side only.

::: tip Start from an example
Download a sample with 25 people – [English column names](/samples/example-en.csv) or
[Polish column names](/samples/example-pl.csv) – or an empty template from Family Insight:
**Help → Download CSV Template…**. The complete specification is in the
[CSV format reference](/developer/reference/csv-format).
:::

## 2. Save it as CSV

| Program          | How                                                                             |
| ---------------- | ------------------------------------------------------------------------------- |
| Microsoft Excel  | **File → Save As**, type **CSV UTF-8 (Comma delimited) (\*.csv)**               |
| LibreOffice Calc | **File → Save As**, type **Text CSV (.csv)**, character set **Unicode (UTF-8)** |
| Google Sheets    | **File → Download → Comma-separated values (.csv)**                             |

Commas, semicolons and tabs as separators all work. Files that are not saved as UTF-8 (the plain
**CSV** type of older Excel versions) work too: Family Insight recognises Central European
(Windows-1250), Cyrillic (Windows-1251) and Western European (Windows-1252) text by its letters.

## 3. Import

On the welcome screen click **Import from CSV…**, or with a tree open choose **☰ → Import CSV…**.
You can also drag the `.csv` file onto the window. Before anything changes, you see a preview:

<Screenshot name="csv-import" alt="The import preview: detected separator and encoding, the columns with how each is imported, a preview of the first rows and the Import button" />

- At the top: the **separator and text encoding** that were detected.
- **Character set** – if letters such as ą, ö, é or ж look wrong in the preview, choose another
  one here (shown for files read from disk; the detected one is marked).
- **Columns** – how each column of your file will be used. If a column wasn't recognised (for
  example because it's called “First name”), choose the right meaning in the list, or
  **Don't import** to skip it.
- **Preview** – the first rows as Family Insight understood them.
- At the bottom: how many people and relationships will be imported.

<Screenshot name="csv-import-columns" alt="The Columns table: column in the file, imported as (a list) and the value in the first row" />

When a tree is already open, choose whether to import into **A new tree** or **The current tree**.
Importing into the current tree adds all the people from the file as new people (they aren't matched
with people already in the tree) – one step you can [undo](./undo).

Click **Import**. A new tree from a CSV file has no file yet – [save it](./files) to keep it.

## Problems and warnings {#problems}

**Problems** (red) must be fixed before importing – correct them in your spreadsheet (or change the
column mapping) and import again. **Warnings** (yellow) explain what will happen; you can import
anyway. Each message says which row it is about.

<Screenshot name="csv-import-errors" alt="The import preview with 2 problems: Row 4 – the id p2 is used more than once; Row 5 – refers to p9, but there is no row with that id" />

### Problems that block the import

| Message                                                      | How to fix it                                                                    |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| _The file is empty._                                         | Choose the right file, or check that the sheet was saved with data.              |
| _The file has no “id” column…_                               | Add an `id` column with a unique label for every person.                         |
| _The file has no name columns (“given_names” or “surname”)._ | Add a `given_names` or `surname` column, or map an existing column to it.        |
| _This row has no id._                                        | Fill in the id in that row.                                                      |
| _The id “p2” is used more than once._                        | Give each person a different id.                                                 |
| _The person “p7” has neither given names nor a surname._     | Fill in at least one name (or remove the empty row).                             |
| _Refers to “p9”, but there is no row with that id._          | Correct the id in `father_id`, `mother_id` or `partner_ids`, or add that person. |
| _The person refers to themselves (“p3”)._                    | A person can't be their own parent or partner – fix the id.                      |
| _Father and mother are the same person (“p1”)._              | Correct `father_id` or `mother_id`.                                              |
| _… would be their own ancestor._                             | Somewhere a child is listed as a parent of their own ancestor – check the ids.   |

### Warnings

| Message                                                                       | What happens                                                      |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| _The column “…” isn't recognised and will be ignored._                        | The column is skipped – map it to a field if you need it.         |
| _“…” isn't a date we understand; it was added to the notes._                  | The text is kept in the person's notes so nothing is lost.        |
| _“…” isn't a known sex; imported as unknown._                                 | Use `female`, `male`, `other` or `unknown` (or the Polish words). |
| _“…” isn't yes/no; the living status is left unknown._                        | Use `yes`/`no`, `true`/`false`, `tak`/`nie` or `1`/`0`.           |
| Date warnings (death before birth, older than 120, parent younger than child) | Imported as written – see [Warnings](./editing#warnings).         |

## What CSV can't carry

CSV keeps names, dates, places, life status, biological parents, partners and notes. **Photos,
partnership dates and places, adoptive/step/foster links, the root person and the view** exist only
in `.finsight` files – use those to keep everything.
