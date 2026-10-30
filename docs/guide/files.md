---
description: Save and open family trees, autosave, crash recovery, backup copies, recent files and moving a tree to another computer.
---

# Saving and opening

## The `.finsight` file

Each family tree is one file with the extension **`.finsight`** – everything is inside: people,
relationships, photos and how the tree was viewed. You decide where it lives, and you can copy,
back up or e-mail it like any other document.

## Saving

| To                      | Do                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| save                    | <kbd>Ctrl</kbd>+<kbd>S</kbd> (<kbd>⌘</kbd>+<kbd>S</kbd>), or **☰ → Save**                                   |
| save under another name | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd> (<kbd>⌘</kbd>+<kbd>⇧</kbd>+<kbd>S</kbd>), or **☰ → Save As…** |

<Screenshot name="file-menu" alt="The file menu with New Tree, Open, Save, Save As, Import CSV, Export CSV, Export Image and Print" />

The first time you save a new tree, choose a folder and a name (the Documents folder and the tree's
name are suggested). The status bar at the bottom always tells you whether everything is saved:

<Screenshot name="unsaved-status" alt="The status bar showing Unsaved changes (1)" />

If you close the window, open another tree or quit while there are unsaved changes, Family Insight
asks whether to **Save**, **Don't save** or **Cancel**.

## Autosave {#autosave}

Once a tree has been saved to a file, Family Insight saves it automatically **2 seconds after every
change**. You can switch this off in the [settings](./settings) (⚙ → **Save automatically**); then
save with <kbd>Ctrl</kbd>+<kbd>S</kbd> yourself.

A brand-new tree that has never been saved isn't autosaved – save it once to give it a file.

## Crash recovery {#crash-recovery}

While a tree has unsaved changes (for example a new tree, or with autosave off), Family Insight
keeps a hidden recovery copy, updated 2 seconds after each change. If the program or the computer
crashes, the next start offers to restore that work:

<Screenshot name="recovery" alt="The Restore unsaved work? window listing the tree Kowalscy, never saved, with the Restore and Discard all buttons" />

Click **Restore** to open the tree as it was, then save it. **Discard all** throws the copies
away. Recovery copies are deleted as soon as the tree is saved or closed normally.

## Backup copies {#backups}

Every time you save **manually** (<kbd>Ctrl</kbd>+<kbd>S</kbd> or **Save**), the previous version of
the file is kept next to it as `name.finsight.bak1`. Older versions move to `.bak2` … `.bak5`, so
the last five manual saves are always there. Autosave doesn't create backups.

To go back to an older version:

1. Close the tree in Family Insight.
2. In your file manager, find the folder with the tree and make a copy of the backup you want,
   for example `Kowalscy.finsight.bak2`.
3. Rename the copy so that it ends with `.finsight`, for example `Kowalscy (older).finsight`
   (your system may ask whether you really want to change the extension – confirm).
4. Open it in Family Insight.

::: tip Can't see the extensions?
Windows and macOS hide file extensions by default. On Windows, in File Explorer choose
**View → Show → File name extensions**; on macOS, in Finder choose **Finder → Settings → Advanced →
Show all filename extensions**.
:::

## Opening a tree {#opening}

- **☰ → Open…** or <kbd>Ctrl</kbd>+<kbd>O</kbd> (<kbd>⌘</kbd>+<kbd>O</kbd>), or **Open tree…** on the
  welcome screen;
- **double-click** a `.finsight` file (after installing with the Windows installer, the macOS app or
  the `.deb` package);
- **drag** a `.finsight` file onto the Family Insight window – dragging a `.csv` file starts a
  [CSV import](./csv-import);
- **File → Open Recent** in the menu bar, or the **Recent** list on the welcome screen.

<Screenshot name="welcome-recent" alt="The welcome screen with the Recent list: one tree opened 2 hours ago and one crossed out as File not found" />

Files that were moved or deleted are crossed out in the recent list; remove them with **×**.

If a file can't be opened, Family Insight tells you why – for example that it was saved by a newer
version (update the program, see [Installation](./install#updating)) or that it is damaged (try a
[backup copy](#backups)).

## Moving a tree to another computer

Copy the `.finsight` file – on a USB stick, by e-mail or through a cloud folder – and open it with
Family Insight on the other computer. Photos are inside the file, so nothing else is needed.

::: warning Working on the same tree in two places
Family Insight doesn't merge changes. If you keep the tree in a shared or synced folder, have it open
on one computer at a time.
:::
