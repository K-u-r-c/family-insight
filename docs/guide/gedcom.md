---
description: Move family trees between Family Insight and other genealogy programs with GEDCOM – import from Gramps, MyHeritage, Ancestry or FamilySearch, export as GEDCOM 5.5.1 or 7.0.
---

# GEDCOM

**GEDCOM** is the file format genealogy programs use to exchange family trees. Family Insight
reads GEDCOM 5.5, 5.5.1 and 7.0 files (`.ged`, and `.gdz` with photos inside) and writes 5.5.1 or
7.0.

## Import a GEDCOM file

Choose **☰ → Import GEDCOM…** (or **File → Import → GEDCOM…**, or **Import from GEDCOM…** on the
welcome screen), or simply drop a `.ged` file onto the window. A preview opens:

<Screenshot name="gedcom-import" alt="The Import GEDCOM window: GEDCOM 5.5.1 from MyHeritage, the character set UTF-8 (detected), a warning about an approximate date, the tags that weren't imported, and the summary with people, families, events, sources and media" />

- The window shows the **version** and the **program** that wrote the file, and how many people,
  families, events, sources and photos it contains.
- **Character set** – detected automatically (UTF-8, UTF-16, ANSEL, ANSI, Windows-1250). If letters
  such as _ą_, _ł_, _ö_ or _ß_ look wrong in the result, choose another one.
- **Warnings** explain what couldn't be taken over exactly – for example a date like
  _BET 1850 AND 1855_ or a date in the Julian calendar. The original text is kept in the person's
  notes, so nothing is lost.
- **Not imported** lists program-specific details Family Insight has no place for (record numbers,
  internal IDs …), grouped by tag.
- With a tree open you can import into a **new tree** or **add to the open tree**. Adding is one
  step you can undo.

Photos and documents referenced by the file are loaded from where the file says they are – or,
if the file comes from another computer, from the folder of the `.ged` file and its `media`
folder. A `.gdz` file has them inside.

### What is kept

Names (including birth and married surnames), sex, birth and death, life events (baptism, burial,
emigration, occupation, military service …, and custom events), notes, sources and repositories
with citations (page, reliability, transcription), photos and documents, marriages, engagements
and divorces, adoptive, foster and step-parents, and place coordinates.

### Coming from another program

| Program                                   | How to export a GEDCOM file                                                                                                            |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Gramps**                                | **Family Trees → Export…**, choose _GEDCOM_.                                                                                           |
| **MyHeritage**                            | Family Tree Builder: **File → Export to GEDCOM**; on the website: **Family tree → Manage trees → Export to GEDCOM**.                   |
| **Ancestry**                              | **Trees → (your tree) → Tree settings → Export tree**.                                                                                 |
| **FamilySearch**                          | FamilySearch doesn't export the whole shared tree; export your own trees with partner programs, or start from a GEDCOM someone shared. |
| **Legacy, RootsMagic, Family Tree Maker** | **File → Export → GEDCOM**.                                                                                                            |

## Export a GEDCOM file

Choose **☰ → Export GEDCOM…** (or **File → Export → GEDCOM…**):

<Screenshot name="gedcom-export" alt="The Export GEDCOM window with the version GEDCOM 5.5.1 or 7.0, Include photos and documents, Hide living people and Include notes" />

- **Version** – **5.5.1** is read by almost every genealogy program; **7.0** is the newest version.
- **Include photos and documents** – with 5.5.1 they are saved in a `media` folder next to the
  GEDCOM file; with 7.0 everything is packed into one `.gdz` file.
- **Hide living people** – replaces the names of people who may be alive with "Living" and leaves
  out their details. Use it when you share your tree with others.
- **Include notes** – leave it off to share only the facts.

::: info What GEDCOM can't carry
Whether someone is alive (only death is recorded), the web address of a source (it becomes a line
in the source's notes) and the view settings of your tree. Everything else comes back when you
import the file into Family Insight again.
:::
