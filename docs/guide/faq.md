---
description: Frequently asked questions about Family Insight – privacy, offline use, file size, GEDCOM, sharing and printing.
---

# FAQ

## Is Family Insight free?

Yes. It's free and open source (MIT licence), without ads, accounts or subscriptions.

## Where is my data? Does it go to the internet?

Your tree is in the `.finsight` file you saved – nowhere else. Family Insight works completely
**offline** and never sends your data anywhere. Once a day it asks GitHub whether a new version
is available ([updates](./settings), can be switched off). Otherwise it only goes online when you
ask it to: a link
such as **Help → User Guide** opens your web browser, and if you allow
[online place lookup](./places#lookup), **Look up online** sends the name of that one place – and
nothing else – to OpenStreetMap; with [online maps](./map#online) allowed, the map downloads its
background (only the map area, never your data).

## How do I back up my tree?

Copy the `.finsight` file to a USB stick, an external drive or a cloud folder you trust. Family
Insight also keeps the last five versions next to the file automatically
([backup copies](./files#backups)).

## How big can a tree be? Do photos make it huge?

Trees with a thousand people and more work smoothly. Portraits are reduced to 512 × 512 pixels when
you add them, so each adds only some tens of kilobytes – a tree with a few hundred portraits stays a
few megabytes and is easy to e-mail. Pictures are stored inside the file once, however many times
they are used, and saving stays quick even when the file grows to hundreds of megabytes.

## Can I open a tree from another genealogy program (GEDCOM)?

Yes. Export a GEDCOM file from the other program (Gramps, MyHeritage, Ancestry, Legacy …) and use
**☰ → Import GEDCOM…** – see [GEDCOM](./gedcom). The same way you can export your tree for other
programs. Data in spreadsheets can come in through [CSV](./csv-import).

## How can I share the tree with my family?

- Send them the `.finsight` file – with Family Insight they can open it, explore it and add to it.
- Send a **PDF or picture** of the tree to people who don't have the program
  ([Images, PDF and printing](./export-print)).
- Send a **CSV** file if they want to use a spreadsheet ([Export to CSV](./csv-export)).

Family Insight doesn't merge changes, so agree on who keeps the main copy.

## Can several people edit one tree at the same time?

No. Keep one main copy and pass it on, or collect additions in a spreadsheet and import them into
the current tree.

## How do I print a large tree?

Print it in parts (ancestors or descendants of one person, a few generations), use A3 paper, or
export a large PNG or SVG for a print shop. See
[Tips for large trees](./export-print#large-trees).

## Can I record adoptions, step-families and divorces?

Yes – see [Relationships](./relationships).

## Is there a version for phones?

No, Family Insight is a desktop program for Windows, macOS and Linux.

## Can I add another language?

The program is prepared for more languages; translators are welcome – see
[Add a language](/developer/howto/language) in the developer documentation.
