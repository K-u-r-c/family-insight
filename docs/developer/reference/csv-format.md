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

| Aspect                | Export                                                                                              | Import                                                              |
| --------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Encoding              | UTF-8 **with BOM** (so Excel shows ą, ę, ł, ó, ж correctly)                                         | UTF-8 with or without BOM; otherwise a Windows code page, see below |
| Delimiter             | `,` or `;` (user choice; default `;` for pl, de, fr, es, it, pt, ru – what Excel expects there)     | auto-detected from `,` `;` and tab                                  |
| Quoting               | RFC 4180: fields containing the delimiter, quotes or line breaks are quoted, `"` is escaped as `""` | RFC 4180                                                            |
| Line endings          | CRLF                                                                                                | CRLF or LF                                                          |
| Multi-value separator | `\|` (pipe)                                                                                         | `\|`                                                                |
| File extensions       | `.csv`                                                                                              | `.csv`, `.tsv`, `.txt`                                              |

### Legacy code pages

A file that is not valid UTF-8 is decoded with the Windows code page whose letters fit it best:
**Windows-1250** (Central European: pl, cs, sk, hu …), **Windows-1251** (Cyrillic) or
**Windows-1252** (Western European: de, fr, es, it, pt, en). The score counts the accented letters
one language can explain (a file is usually in one language) and penalises words no language
explains, as a wrong code page mixes alphabets or puts symbols inside words. The UI language breaks
ties (Polish prefers 1250, Russian 1251, others 1252) – German text, for example, reads the same in
1250 and 1252. The preview lets the user pick another character set (`decodeText` in
`src/core/file/encoding.ts`).

## Columns

Column order does not matter on import. Unknown columns are ignored (with a warning) unless the user
maps them in the preview. Headers are compared ignoring case and diacritics, treating spaces, hyphens and underscores alike, and
may be given in any of the eight header languages (table below); common spellings are recognised
too (`first name`, `last name`, `maiden name`, `gender`, `born`, `died`, `alive`, `father`,
`mother`, `partners`, `imie`, `vorname`, `prénom`, `apellido`, `девичья фамилия` … – see
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
step and foster links, partnership dates, photos, **life events** (baptism, emigration, …) and **sources
and citations** exist only in `.finsight` files – CSV stays one row per person; GEDCOM carries the events.

## Header languages {#header-languages}

Export writes the header row and the `sex` / `living` values in one of eight languages; import
accepts all of them in any mix. Latin-script names are ASCII without diacritics so they survive
any spreadsheet (diacritics are accepted on import too); Russian names are Cyrillic, which the
UTF-8 BOM keeps readable in Excel. Source: `HEADERS`, `SEX_VALUES` and `LIVING_VALUES` in
`src/core/io/csv/columns.ts` (a unit test checks that this page lists every name).

| Column          | pl                  | de             | fr                  | es                        | it                   | pt                        | ru                     |
| --------------- | ------------------- | -------------- | ------------------- | ------------------------- | -------------------- | ------------------------- | ---------------------- |
| `id`            | `id`                | `id`           | `id`                | `id`                      | `id`                 | `id`                      | `id`                   |
| `given_names`   | `imiona`            | `vornamen`     | `prenoms`           | `nombres`                 | `nomi`               | `nomes`                   | `имя`                  |
| `surname`       | `nazwisko`          | `nachname`     | `nom`               | `apellidos`               | `cognome`            | `sobrenome`               | `фамилия`              |
| `birth_surname` | `nazwisko_rodowe`   | `geburtsname`  | `nom_de_naissance`  | `apellidos_de_nacimiento` | `cognome_di_nascita` | `sobrenome_de_nascimento` | `фамилия_при_рождении` |
| `sex`           | `plec`              | `geschlecht`   | `sexe`              | `sexo`                    | `sesso`              | `sexo`                    | `пол`                  |
| `birth_date`    | `data_urodzenia`    | `geburtsdatum` | `date_de_naissance` | `fecha_de_nacimiento`     | `data_di_nascita`    | `data_de_nascimento`      | `дата_рождения`        |
| `birth_place`   | `miejsce_urodzenia` | `geburtsort`   | `lieu_de_naissance` | `lugar_de_nacimiento`     | `luogo_di_nascita`   | `local_de_nascimento`     | `место_рождения`       |
| `death_date`    | `data_smierci`      | `sterbedatum`  | `date_de_deces`     | `fecha_de_defuncion`      | `data_di_morte`      | `data_de_falecimento`     | `дата_смерти`          |
| `death_place`   | `miejsce_smierci`   | `sterbeort`    | `lieu_de_deces`     | `lugar_de_defuncion`      | `luogo_di_morte`     | `local_de_falecimento`    | `место_смерти`         |
| `living`        | `zyje`              | `lebend`       | `vivant`            | `vivo`                    | `vivente`            | `vivo`                    | `жив`                  |
| `father_id`     | `ojciec_id`         | `vater_id`     | `pere_id`           | `padre_id`                | `padre_id`           | `pai_id`                  | `отец_id`              |
| `mother_id`     | `matka_id`          | `mutter_id`    | `mere_id`           | `madre_id`                | `madre_id`           | `mae_id`                  | `мать_id`              |
| `partner_ids`   | `partnerzy_id`      | `partner_ids`  | `partenaires_id`    | `parejas_id`              | `partner_id`         | `parceiros_id`            | `партнёры_id`          |
| `notes`         | `notatki`           | `notizen`      | `notes`             | `notas`                   | `note`               | `notas`                   | `заметки`              |

| Language | female     | male        | other    | unknown        | living yes / no  |
| -------- | ---------- | ----------- | -------- | -------------- | ---------------- |
| en       | `female`   | `male`      | `other`  | `unknown`      | `true` / `false` |
| pl       | `kobieta`  | `mężczyzna` | `inna`   | `nieznana`     | `tak` / `nie`    |
| de       | `weiblich` | `männlich`  | `divers` | `unbekannt`    | `ja` / `nein`    |
| fr       | `femme`    | `homme`     | `autre`  | `inconnu`      | `oui` / `non`    |
| es       | `mujer`    | `hombre`    | `otro`   | `desconocido`  | `sí` / `no`      |
| it       | `donna`    | `uomo`      | `altro`  | `sconosciuto`  | `sì` / `no`      |
| pt       | `mulher`   | `homem`     | `outro`  | `desconhecido` | `sim` / `não`    |
| ru       | `женщина`  | `мужчина`   | `другой` | `неизвестно`   | `да` / `нет`     |

Import also accepts the abbreviations `F`, `K`, `W`, `Ж` (female), `M`, `H`, `М` (male), `?`
(unknown), `yes`, `y`, `t`, `j`, `1` and `no`, `n`, `0`, and other word forms (`feminino`,
`maschio`, `мужской` …). Dates still use the English and Polish keywords until each language's
date words land (see [Dates](#dates)).

## Export details

- Rows are ordered by date of birth (unknown last), then surname and given name.
- People get short, readable ids `p1`, `p2`, … (internal ids are not exported).
- Values are written in the language of the column names (see [Header languages](#header-languages)).
  Import accepts the values of every language.
- The export dialog offers the header languages of the app's UI languages; the CSV template
  (**Help → Download CSV Template…**) uses the UI language with its default delimiter.
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
