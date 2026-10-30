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

| Method                                         | Channel               | Returns / does                                                                                                                                                                                                                                                                                       | Checks in main                                                                     |
| ---------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `openFileDialog(format)`                       | `file:open-dialog`    | Native open dialog filtered to a registered format; `FileReadResult` or `null` if cancelled. The opened path becomes writable.                                                                                                                                                                       | Unknown format ids fall back to `.finsight`                                        |
| `readFile(path)`                               | `file:read`           | `FileReadResult`: `{ ok, path, content, encoding, library?, bytes? }` (`bytes` for `.ged`/`.gdz`, which the renderer decodes itself) (`utf-8` or `windows-1250`) or `{ ok: false, error }`. For `.finsight` files main unpacks the container: `content` is `tree.json` and `library` holds the media | Non-empty string; extension of a registered format; ≤ 200 MB (`.finsight` ≤ 2 GiB) |
| `saveFileDialog(format, suggestedName)`        | `file:save-dialog`    | Native save dialog in Documents; the chosen path (extension added if missing) or `null`. The path becomes writable.                                                                                                                                                                                  | Unknown format ids fall back to `.finsight`; name trimmed                          |
| `writeFile(path, content, options?)`           | `file:write`          | Atomic write; `options.backup` rotates `.bak1–5` for `.finsight` (if backups are on), `options.encoding: 'base64'` writes binary (PNG). `FileWriteResult`                                                                                                                                            | Strings only; **path must be writable** (picked or opened this session)            |
| `writeDocument(path, json, library, options?)` | `file:write-document` | Saves a `.finsight` container: the JSON plus the media of `library` it lists (others are left out); `options.backup` as for `writeFile`                                                                                                                                                              | `.finsight` path that is **writable**; unknown library = no media                  |
| `exportGedcom(path, text, media)`              | `file:export-gedcom`  | Writes a GEDCOM export: `none`, `folder` (media copied into the folder of the file) or `gedzip` (one `.gdz` with text and media)                                                                                                                                                                     | Path must be writable; media paths must be plain relative paths                    |
| `exportPdf(svg, options, path)`                | `export:pdf`          | Renders the SVG to a PDF (`pageSize` A4/A3/Letter, `landscape`) and writes it                                                                                                                                                                                                                        | SVG markup only; path must be writable; options sanitised                          |
| `capturePng(rect, path)`                       | `export:capture-png`  | Saves a rectangle of the sender's window (CSS pixels) as PNG – the map export                                                                                                                                                                                                                        | Path must be writable; non-negative integer rectangle                              |
| `print(svg, options)`                          | `export:print`        | Opens the system print dialog for the SVG; `true` if printed                                                                                                                                                                                                                                         | SVG markup only; options sanitised                                                 |
| `showInFolder(path)`                           | `file:show-in-folder` | Reveals the file in the file manager                                                                                                                                                                                                                                                                 | String                                                                             |
| `filesExist(paths)`                            | `file:exists`         | `boolean[]` for the recent-files list                                                                                                                                                                                                                                                                | Array; at most 50 paths                                                            |
| `pickPhoto()`                                  | `photo:pick`          | Native image picker; `{ ok: true, dataUrl }`, `{ ok: false, error }` or `null`                                                                                                                                                                                                                       | JPG/PNG/WebP/GIF (HEIC reported as unsupported); ≤ 20 MB                           |
| `getPathForFile(file)`                         | – (preload only)      | Absolute path of a dropped `File` (`webUtils.getPathForFile`)                                                                                                                                                                                                                                        | –                                                                                  |
| `takePendingFile()`                            | `file:take-pending`   | A file passed on the command line before the renderer was ready, or `null`                                                                                                                                                                                                                           | –                                                                                  |
| `onOpenFileRequest(listener)`                  | `file:open-request`   | Subscribes to “open this file” from double-click/second instance                                                                                                                                                                                                                                     | –                                                                                  |

## Media library

Bytes of photos and documents stay in main, in a library per open document; see
[the media library](../architecture#media-library).

| Method                                           | Channel                 | Returns / does                                                                                   | Checks in main                                                                                                                 |
| ------------------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `createMediaLibrary()`                           | `media:create-library`  | Id of a new, empty library                                                                       | –                                                                                                                              |
| `releaseMediaLibrary(library)`                   | `media:release-library` | Frees the library of a document that was closed                                                  | –                                                                                                                              |
| `importMedia(library, multiple)`                 | `media:import`          | Native picker (multi-select if `multiple`); `{ items: MediaPutResult[] }` or `null` if cancelled | Type by magic bytes (JPEG, PNG, WebP, GIF, PDF); ≤ 25 MB; ≤ 200 files                                                          |
| `putMedia(library, data, fileName)`              | `media:put`             | Adds bytes made in the renderer (cropped portrait); `MediaPutResult` with `hash`, `mime`, `size` | `Uint8Array`; type by magic bytes; ≤ 25 MB; file name reduced to a base name                                                   |
| `getMedia(library, hash)`                        | `media:get`             | The file's bytes or `null`                                                                       | –                                                                                                                              |
| `getThumbnails(library)`                         | `media:thumbs`          | All thumbnails, `hash → bytes`                                                                   | –                                                                                                                              |
| `listMediaHashes(library)`                       | `media:hashes`          | Hashes of all files in the library                                                               | –                                                                                                                              |
| `putThumbnail(library, hash, data)`              | `media:put-thumb`       | Stores a thumbnail for a file of the library; `true` if accepted                                 | Known hash; WebP by magic bytes; ≤ 512 KB                                                                                      |
| `exportMedia(library, hash, fileName)`           | `media:export`          | Save dialog, then writes the file; `false` if cancelled                                          | Name reduced to a safe base name                                                                                               |
| `importMediaFromPaths(library, basePath, paths)` | `media:import-paths`    | Adds files a GEDCOM file references to the library; one `MediaPutResult` per path                | Paths relative to `basePath` or absolute, else the same name next to it or in its `media` folder; type by magic bytes; ≤ 25 MB |
| `openMediaExternally(library, hash, fileName)`   | `media:open-external`   | Writes a temporary copy and opens it with the system's default app; `true` if it opened          | Type by magic bytes; the extension follows the type, not the name                                                              |

## Updates

| Method                     | Channel              | Returns / does                                                                                         | Checks in main                                                                                 |
| -------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `checkForUpdates()`        | `updates:check`      | A manual check; resolves to the new `UpdateStatus` (errors reported)                                   | Off in development builds and tests (`FAMILY_INSIGHT_*`) unless `FAMILY_INSIGHT_UPDATE_TEST=1` |
| `downloadUpdate()`         | `updates:download`   | Downloads the update (`auto` builds) or opens the release page (`notify` builds)                       | Only when an update is available                                                               |
| `installUpdate()`          | `updates:install`    | Restarts into the downloaded update – call after unsaved changes were dealt with                       | Only when an update is ready                                                                   |
| `getUpdateStatus()`        | `updates:get-status` | The current `UpdateStatus` (`state`, `support`, `version`, `notes`, `releaseUrl`, `progress`, `error`) | –                                                                                              |
| `onUpdateStatus(listener)` | `updates:status`     | Subscribes to status changes                                                                           | –                                                                                              |

## Places

| Method                          | Channel                | Returns / does                                                                                                                                                                                     | Checks in main                                                                                                             |
| ------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `lookupPlace(requestId, query)` | `places:lookup`        | `PlaceLookupResult`: up to 5 `{ lat, lon, displayName }` from OpenStreetMap Nominatim, or an error (`disabled`, `offline`, `failed`, `cancelled`). A newer call with the same id cancels the older | Refused unless the `onlinePlaceLookup` setting is on; id `[a-zA-Z0-9-]{1,64}`; query ≤ 200 characters; 1 request/s, cached |
| `cancelPlaceLookup(requestId)`  | `places:lookup-cancel` | Cancels a pending lookup                                                                                                                                                                           | –                                                                                                                          |

## Window and unsaved changes

| Method                      | Channel                      | Returns / does                                                               | Checks in main               |
| --------------------------- | ---------------------------- | ---------------------------------------------------------------------------- | ---------------------------- |
| `setDocumentEdited(edited)` | `window:set-document-edited` | Marks the window as edited (macOS dot in the close button)                   | Only `true` counts           |
| `askUnsaved(documentName)`  | `dialog:unsaved`             | Native Save / Don't save / Cancel dialog → `'save' \| 'discard' \| 'cancel'` | Name used as text only       |
| `onCloseRequest(listener)`  | `window:close-request`       | Subscribes to the window's close attempts (the renderer decides)             | –                            |
| `closeWindow()`             | `window:close`               | Closes the sender's window after the renderer has dealt with unsaved changes | Only the sender's own window |

## Crash recovery

| Method                                                    | Channel          | Returns / does                                                                                              | Checks in main                                                                |
| --------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `writeRecovery(id, originalPath, name, content, library)` | `recovery:write` | Saves a snapshot to `userData/recovery/<id>.json`; media it lists that aren't there yet go to `<id>.media/` | `id` matches `[a-zA-Z0-9-]{1,64}`; content is a string; name ≤ 200 characters |
| `clearRecovery(id)`                                       | `recovery:clear` | Deletes the snapshot                                                                                        | Same id rule                                                                  |
| `listRecovery()`                                          | `recovery:list`  | `RecoveryEntry[]` newer than their original files (others are deleted)                                      | –                                                                             |
| `readRecovery(id)`                                        | `recovery:read`  | `{ content, originalPath, library }` (media loaded into a new library) or `null`                            | Same id rule                                                                  |

## Native menu

| Method                   | Channel          | Returns / does                                                                                                    | Checks in main                                           |
| ------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `setMenuState(state)`    | `menu:set-state` | Enables/disables items and checks the view mode (`hasDocument`, `canUndo`, `canRedo`, `hasSelection`, `viewMode`) | Booleans must be `true`; view mode from the allowed list |
| `onMenuAction(listener)` | `menu:action`    | Subscribes to menu commands (`MenuAction`, e.g. `'file:save'`)                                                    | –                                                        |

## Types

The result and option types – `AppInfo`, `FileReadResult`, `FileWriteResult`, `PhotoPickResult`,
`MediaPutResult`, `MediaImportResult`,
`PdfOptions`, `UnsavedChoice`, `RecoveryEntry`, `MenuState`, `MenuAction` – are defined next to the
API in `src/shared/ipc.ts`. To add a method, follow [Add an IPC channel](../howto/ipc).
