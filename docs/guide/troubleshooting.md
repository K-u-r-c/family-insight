---
description: Solutions for common problems – the program doesn't start, Polish letters in Excel, CSV import errors, files that won't open – and how to report a bug.
---

# Troubleshooting

## The program doesn't start

### Windows

| Symptom                                          | Cause and fix                                                                                                                                       |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| A blue window **“Windows protected your PC”**    | SmartScreen doesn't know the publisher yet. Click **More info → Run anyway** (see [Installation](./install#windows)).                               |
| The antivirus program blocks or deletes the file | Download the file again from the official [releases page](https://github.com/K-u-r-c/family-insight/releases/latest) and allow it in the antivirus. |

### macOS

| Symptom                                                             | Cause and fix                                                                                                                      |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **“Family Insight” can't be opened because Apple cannot check it…** | The app isn't notarised yet. Right-click it in Applications → **Open**, or **System Settings → Privacy & Security → Open Anyway**. |
| **“Family Insight” is damaged and can't be opened**                 | macOS quarantine. Run `xattr -cr "/Applications/Family Insight.app"` in Terminal once.                                             |
| The app doesn't start on an Apple Silicon Mac                       | You may have the Intel version – download `mac-arm64.dmg` (see [Which file do I download?](./install#which-file)).                 |

### Linux {#linux}

| Symptom                                                                      | Cause and fix                                                                                                                                                    |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nothing happens when you double-click the AppImage                           | The file isn't executable: `chmod +x family-insight-*.AppImage`.                                                                                                 |
| `dlopen(): error loading libfuse.so.2` / _AppImages require FUSE to run_     | FUSE 2 is missing: `sudo apt install libfuse2` (Ubuntu 24.04 and newer: `libfuse2t64`), or the package `fuse2` / `fuse-libs` on other distributions.             |
| _The SUID sandbox helper binary was found, but is not configured correctly…_ | Some distributions (for example Ubuntu 24.04) restrict the sandbox Electron uses. Install the `.deb` package instead, or start the AppImage with `--no-sandbox`. |
| The window is blurry or flickers on Wayland                                  | Start it with `--ozone-platform=x11` to use XWayland.                                                                                                            |

To see what's going on, start the program from a terminal – any error message is printed there.

## Polish letters look wrong in Excel, or everything is in one column

Export the CSV again and choose the **semicolon** separator – Excel with Polish regional settings
expects it. The file always contains a UTF-8 marker, so letters like ą, ę and ł are correct. See
[Export to CSV](./csv-export).

## The CSV import shows problems

Every problem tells you the row and what to change. The full list with fixes is in
[Import from CSV → Problems and warnings](./csv-import#problems).

## A file won't open

| Message                                                                         | What to do                                                                               |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| _The file doesn't exist any more. It may have been moved or deleted._           | Find the file and open it with **Open…**; remove the old entry from the recent list.     |
| _You don't have permission to access this file._                                | Copy the file to a folder of your own (for example Documents) and open the copy.         |
| _This tree was saved by a newer version of Family Insight…_                     | [Update Family Insight](./install#updating).                                             |
| _The file is damaged or isn't a Family Insight tree._                           | Open one of the [backup copies](./files#backups) (`.bak1` … `.bak5`) next to the file.   |
| _This isn't a Family Insight tree file._ / _This type of file isn't supported._ | Choose a `.finsight` file; spreadsheets are opened with [Import from CSV](./csv-import). |
| _The file contains invalid data and can't be opened safely._                    | Try a backup copy; if that doesn't help, [report the problem](#report-a-problem).        |

If the program closed unexpectedly, start it again – it offers to
[restore unsaved work](./files#crash-recovery).

## Report a problem {#report-a-problem}

Choose **Help → Report a Problem…** – it opens the issue page on GitHub (you need a free GitHub
account). Please include:

- what you did, what you expected and what happened instead;
- the version (**Help → About Family Insight**) and your system (for example Windows 11, macOS 15,
  Ubuntu 24.04);
- a screenshot of the message, and the output from the terminal if you started the program from
  one.

Don't attach your family tree publicly – it contains personal data. If a file is needed, say so in
the report and we'll agree on a private way.
