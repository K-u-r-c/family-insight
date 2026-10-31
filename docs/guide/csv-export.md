---
description: Export your family tree to a CSV spreadsheet that opens correctly in Excel, LibreOffice Calc and Google Sheets.
---

# Export to CSV

Choose **☰ → Export CSV…** (or **File → Export → CSV…** in the menu bar):

<Screenshot name="csv-export" alt="The Export to CSV dialog with the column separator (comma or semicolon) and the column names (English, Polski, Deutsch or Français)" />

1. **Column separator** – **Comma** for most programs; **Semicolon** for Excel with regional
   settings that use a decimal comma (Polish, German, French, Spanish, Italian, Portuguese,
   Russian …), which otherwise puts everything into one column. The default follows the language of
   the program, and Family Insight remembers your choice.
2. **Column names** – in one of the program's languages: English (`given_names`, `surname` …),
   Polish (`imiona`, `nazwisko` …), German (`vornamen`, `nachname` …) and so on. The values follow
   the column names (`kobieta`, `tak` / `nie` in Polish; `weiblich`, `ja` / `nein` in German).
3. Click **Export…** and choose where to save the file. A message with **Show in folder** appears
   when it's done.

The file uses UTF-8 with a byte-order mark, so Polish letters (ą, ę, ł, ó, ż …) display correctly
when you double-click it in Excel.

## What is exported

One row per person, ordered by date of birth, with these columns: id, given names, surname, birth
surname, sex, date and place of birth, date and place of death, living, father and mother (by id),
partners (ids separated by `|`) and notes. People get short ids `p1`, `p2` … so the file is easy
to read and edit.

**Not exported:** photos, partnership dates and places, adoptive, step and foster links, the root
person and the view. Keep the `.finsight` file as your main copy – CSV is for working with
spreadsheets.

You can edit the file and [import it back](./csv-import). The exact format is described in the
[CSV format reference](/developer/reference/csv-format).

## Opening the file in a spreadsheet

| Program          | Tip                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| Microsoft Excel  | Double-click the file. If all data is in column A, export again with the **semicolon** separator. |
| LibreOffice Calc | Open the file; in the import window choose **UTF-8** and the separator you exported with.         |
| Google Sheets    | **File → Import → Upload**; the separator is detected automatically.                              |
