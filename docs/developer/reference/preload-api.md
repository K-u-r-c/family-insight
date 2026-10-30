---
description: Reference of window.familyInsight – every method the renderer can call, its parameters, result and the checks done in main.
---

# Preload API

The renderer talks to the operating system only through `window.familyInsight`, typed as
`FamilyInsightApi` in `src/shared/ipc.ts` and implemented in `src/preload/index.ts`. Every call is
an `ipcRenderer.invoke` on the channel shown below; the handler in main validates the arguments
([Security model](../security)).

## App and settings

| Method                        | Channel            | Returns / does                                                                        | Checks in main                         |
| ----------------------------- | ------------------ | ------------------------------------------------------------------------------------- | -------------------------------------- |
| `getAppInfo()`                | `app:get-info`     | `{ name, version, platform, locale }`                                                 | –                                      |
| `getSettings()`               | `settings:get`     | Current `Settings`                                                                    | –                                      |
| `updateSettings(patch)`       | `settings:update`  | Merges the patch, saves and returns the new `Settings`; broadcasts `settings:changed` | Whole result passes `sanitizeSettings` |
| `onSettingsChanged(listener)` | `settings:changed` | Subscribes; returns an unsubscribe function                                           | –                                      |

## Files

| Method                                  | Channel               | Returns / does                                                                                                                                            | Checks in main                                                          |
| --------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `openFileDialog(format)`                | `file:open-dialog`    | Native open dialog filtered to a registered format; `FileReadResult` or `null` if cancelled. The opened path becomes writable.                            | Unknown format ids fall back to `.finsight`                             |
| `readFile(path)`                        | `file:read`           | `FileReadResult`: `{ ok, path, content, encoding }` (`utf-8` or `windows-1250`) or `{ ok: false, error }`                                                 | Non-empty string; extension of a registered format; ≤ 200 MB            |
| `saveFileDialog(format, suggestedName)` | `file:save-dialog`    | Native save dialog in Documents; the chosen path (extension added if missing) or `null`. The path becomes writable.                                       | Unknown format ids fall back to `.finsight`; name trimmed               |
| `writeFile(path, content, options?)`    | `file:write`          | Atomic write; `options.backup` rotates `.bak1–5` for `.finsight` (if backups are on), `options.encoding: 'base64'` writes binary (PNG). `FileWriteResult` | Strings only; **path must be writable** (picked or opened this session) |
| `exportPdf(svg, options, path)`         | `export:pdf`          | Renders the SVG to a PDF (`pageSize` A4/A3/Letter, `landscape`) and writes it                                                                             | SVG markup only; path must be writable; options sanitised               |
| `print(svg, options)`                   | `export:print`        | Opens the system print dialog for the SVG; `true` if printed                                                                                              | SVG markup only; options sanitised                                      |
| `showInFolder(path)`                    | `file:show-in-folder` | Reveals the file in the file manager                                                                                                                      | String                                                                  |
| `filesExist(paths)`                     | `file:exists`         | `boolean[]` for the recent-files list                                                                                                                     | Array; at most 50 paths                                                 |
| `pickPhoto()`                           | `photo:pick`          | Native image picker; `{ ok: true, dataUrl }`, `{ ok: false, error }` or `null`                                                                            | JPG/PNG/WebP/GIF (HEIC reported as unsupported); ≤ 20 MB                |
| `getPathForFile(file)`                  | – (preload only)      | Absolute path of a dropped `File` (`webUtils.getPathForFile`)                                                                                             | –                                                                       |
| `takePendingFile()`                     | `file:take-pending`   | A file passed on the command line before the renderer was ready, or `null`                                                                                | –                                                                       |
| `onOpenFileRequest(listener)`           | `file:open-request`   | Subscribes to “open this file” from double-click/second instance                                                                                          | –                                                                       |

## Window and unsaved changes

| Method                      | Channel                      | Returns / does                                                               | Checks in main               |
| --------------------------- | ---------------------------- | ---------------------------------------------------------------------------- | ---------------------------- |
| `setDocumentEdited(edited)` | `window:set-document-edited` | Marks the window as edited (macOS dot in the close button)                   | Only `true` counts           |
| `askUnsaved(documentName)`  | `dialog:unsaved`             | Native Save / Don't save / Cancel dialog → `'save' \| 'discard' \| 'cancel'` | Name used as text only       |
| `onCloseRequest(listener)`  | `window:close-request`       | Subscribes to the window's close attempts (the renderer decides)             | –                            |
| `closeWindow()`             | `window:close`               | Closes the sender's window after the renderer has dealt with unsaved changes | Only the sender's own window |

## Crash recovery

| Method                                           | Channel          | Returns / does                                                         | Checks in main                                                                |
| ------------------------------------------------ | ---------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `writeRecovery(id, originalPath, name, content)` | `recovery:write` | Saves a snapshot to `userData/recovery/<id>.json`                      | `id` matches `[a-zA-Z0-9-]{1,64}`; content is a string; name ≤ 200 characters |
| `clearRecovery(id)`                              | `recovery:clear` | Deletes the snapshot                                                   | Same id rule                                                                  |
| `listRecovery()`                                 | `recovery:list`  | `RecoveryEntry[]` newer than their original files (others are deleted) | –                                                                             |
| `readRecovery(id)`                               | `recovery:read`  | `{ content, originalPath }` or `null`                                  | Same id rule                                                                  |

## Native menu

| Method                   | Channel          | Returns / does                                                                                                    | Checks in main                                           |
| ------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `setMenuState(state)`    | `menu:set-state` | Enables/disables items and checks the view mode (`hasDocument`, `canUndo`, `canRedo`, `hasSelection`, `viewMode`) | Booleans must be `true`; view mode from the allowed list |
| `onMenuAction(listener)` | `menu:action`    | Subscribes to menu commands (`MenuAction`, e.g. `'file:save'`)                                                    | –                                                        |

## Types

The result and option types – `AppInfo`, `FileReadResult`, `FileWriteResult`, `PhotoPickResult`,
`PdfOptions`, `UnsavedChoice`, `RecoveryEntry`, `MenuState`, `MenuAction` – are defined next to the
API in `src/shared/ipc.ts`. To add a method, follow [Add an IPC channel](../howto/ipc).
