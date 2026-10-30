---
description: The CSV format Family Insight imports and exports – encoding, columns, values, dates and validation.
---

# CSV format

Family Insight imports and exports family trees as CSV so they can be edited in Excel,
LibreOffice Calc or Google Sheets. **One row = one person.** Relationships are expressed
through ID columns.

> The CSV format is for interchange. The native `.finsight` format (see
> [file-format.md](file-format.md)) keeps everything; CSV keeps the fields listed below.

## Encoding and delimiters

| Aspect                | Export                                                                                              | Import                                                                          |
| --------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Encoding              | UTF-8 **with BOM** (so Excel shows ą, ę, ł, ó correctly)                                            | UTF-8 with or without BOM; Windows-1250 fallback if the file is not valid UTF-8 |
| Delimiter             | `,` (default) or `;` (user choice; `;` is what Polish-locale Excel expects)                         | auto-detected from `,` `;` and tab                                              |
| Quoting               | RFC 4180: fields containing the delimiter, quotes or line breaks are quoted, `"` is escaped as `""` | RFC 4180                                                                        |
| Line endings          | CRLF                                                                                                | CRLF or LF                                                                      |
| Multi-value separator | `\|` (pipe)                                                                                         | `\|`                                                                            |
| File extensions       | `.csv`                                                                                              | `.csv`, `.tsv`, `.txt`                                                          |

## Columns

Column order does not matter on import. Unknown columns are ignored (with a warning) unless the user
maps them in the preview. Headers are compared ignoring case and diacritics, treating spaces, hyphens and underscores alike, and
may be given in English **or Polish**; common spellings are recognised too (`first name`, `last name`,
`maiden name`, `gender`, `born`, `died`, `alive`, `father`, `mother`, `partners`, `imie` … – see
`HEADER_ALIASES` in `src/core/io/csv/columns.ts`).

| Column (EN)     | Alias (PL)                            | Required | Description                                                                                                                                                          | Example      |
| --------------- | ------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| `id`            | `id`                                  | yes      | Unique identifier within the file. Any text without `\|`.                                                                                                            | `p1`         |
| `given_names`   | `imiona`                              | yes*     | Given name(s).                                                                                                                                                       | `Jan Józef`  |
| `surname`       | `nazwisko`                            | yes*     | Current surname.                                                                                                                                                     | `Kowalski`   |
| `birth_surname` | `nazwisko_rodowe`                     | no       | Surname at birth (maiden name).                                                                                                                                      | `Nowak`      |
| `sex`           | `plec` / `płeć`                       | no       | `female`, `male`, `other`, `unknown`; also `F`, `K`, `woman`, `kobieta` / `M`, `man`, `mężczyzna` / `inna`, `inny` / `nieznana`, `nieznany`, `?`. Empty = `unknown`. | `male`       |
| `birth_date`    | `data_urodzenia`                      | no       | Date, see below.                                                                                                                                                     | `1890-05-12` |
| `birth_place`   | `miejsce_urodzenia`                   | no       | Free text.                                                                                                                                                           | `Kraków`     |
| `death_date`    | `data_smierci` / `data_śmierci`       | no       | Date, see below.                                                                                                                                                     | `~1955`      |
| `death_place`   | `miejsce_smierci` / `miejsce_śmierci` | no       | Free text.                                                                                                                                                           | `Łódź`       |
| `living`        | `zyje` / `żyje`                       | no       | `true`/`false`, `yes`/`no`, `y`/`n`, `tak`/`nie`, `t`/`n`, `1`/`0`. Empty = unknown.                                                                                 | `false`      |
| `father_id`     | `ojciec_id`                           | no       | `id` of a parent (see note).                                                                                                                                         | `p7`         |
| `mother_id`     | `matka_id`                            | no       | `id` of a parent (see note).                                                                                                                                         | `p8`         |
| `partner_ids`   | `partnerzy_id`                        | no       | `\|`-separated `id`s of partners/spouses. Listing the partnership on one side is enough.                                                                             | `p2\|p5`     |
| `notes`         | `notatki`                             | no       | Free text, may contain line breaks (quoted).                                                                                                                         |              |

\* At least one of `given_names` / `surname` must be non-empty.

**Parents note:** `father_id`/`mother_id` cover the common case. On export, a parent with sex
`male` goes to `father_id`, `female` to `mother_id`; parents with `other`/`unknown` sex fill
whichever slot is free (father first). Only biological parent links are written; adoptive,
step and foster links, partnership dates and photos exist only in `.finsight` files.

## Export details

- Rows are ordered by date of birth (unknown last), then surname and given name.
- People get short, readable ids `p1`, `p2`, … (internal ids are not exported).
- With Polish column names, values are written in Polish too: `sex` as `kobieta`,
  `mężczyzna`, `inna`, `nieznana` and `living` as `tak` / `nie`. Import accepts both languages.
- Partners are listed on both sides, ordered by the start of the partnership.

## Dates

Dates may be partial and carry a qualifier prefix.

| Written as                           | Meaning         |
| ------------------------------------ | --------------- |
| `1890-05-12`                         | exact day (ISO) |
| `1890-05`                            | month           |
| `1890`                               | year            |
| `~1890` or `abt 1890` / `ok. 1890`   | about           |
| `<1890` or `bef 1890` / `przed 1890` | before          |
| `>1890` or `aft 1890` / `po 1890`    | after           |

Import additionally accepts `12.05.1890`, `12/05/1890` and `05.1890` (day first).
Export always writes the ISO form with the symbolic prefix (`~`, `<`, `>`).

## Validation on import

Import never silently drops data. Errors block the import; warnings are shown in the
preview and can be accepted.

- **Errors** (block the import, each with its row): empty file; no `id` column; no name column; a
  row without `id`; a duplicate `id`; a row without any name; a reference (`father_id`, `mother_id`,
  `partner_ids`) to an `id` that doesn't exist; a person referring to themselves; the same person as
  father and mother; a cycle in ancestry (someone would be their own ancestor).
- **Warnings** (shown, can be accepted): unknown column; a date that can't be parsed (the text is
  kept in `notes`); an unrecognised `sex` value (imported as `unknown`); an unrecognised `living`
  value (left unknown); the date warnings of the editor – death before birth, older than 120 years,
  parent not older than child.

The codes are in `src/core/issues.ts`; the user-facing messages and fixes are listed in the
[user guide](/guide/csv-import#problems).

## Example

```csv
id,given_names,surname,birth_surname,sex,birth_date,birth_place,death_date,death_place,living,father_id,mother_id,partner_ids,notes
p1,Jan,Kowalski,,male,1890-05-12,Kraków,~1955,Łódź,false,,,p2,
p2,Anna,Kowalska,Nowak,female,1895,Kraków,1970-01-03,Łódź,false,,,p1,
p3,Piotr,Kowalski,,male,1921-11,Łódź,,,true,p1,p2,,"Lubił ""wędkować"""
```
