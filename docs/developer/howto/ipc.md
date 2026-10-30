---
description: Give the renderer a new capability through the typed, validated IPC bridge – contract, main handler, preload and use.
---

# Add an IPC channel

The renderer is sandboxed: everything that needs Node or the operating system goes through IPC.
A channel is declared once and implemented in two places. The example adds
`openDataFolder()`, which opens the folder with settings and recovery copies in the file manager
(the steps were compiled and tested while writing this page).

## 1. Declare it in `src/shared/ipc.ts`

Add the channel name and the method to the API type – both processes import this file, so names
and types can't drift apart:

```ts
export const IpcChannel = {
  // …
  MenuAction: 'menu:action',
  AppOpenDataFolder: 'app:open-data-folder'
} as const

export interface FamilyInsightApi {
  // …
  /** Opens the folder with settings and recovery copies in the file manager. */
  openDataFolder(): Promise<void>
}
```

Name channels `<area>:<action>`. Design the method **narrowly** – `openDataFolder()` rather than
`openPath(path)` – so a compromised renderer can't abuse it ([Security model](../security)).

## 2. Handle it in main

Register the handler where its area lives – general app channels in `src/main/ipc.ts`, file
channels in `src/main/files.ts`, recovery in `src/main/recovery.ts`:

```ts
import { app, BrowserWindow, ipcMain, shell } from 'electron'

ipcMain.handle(IpcChannel.AppOpenDataFolder, async () => {
  await shell.openPath(app.getPath('userData'))
})
```

**Validate every argument.** Handlers receive whatever the renderer sends, so type parameters as
`unknown` and check them, like the existing file handler does:

```ts
ipcMain.handle(IpcChannel.FileShowInFolder, (_event, path: unknown) => {
  if (typeof path === 'string') shell.showItemInFolder(resolve(path))
})
```

Return plain, serialisable values. For operations that can fail, return a result object
(`{ ok: true, … } | { ok: false, error: 'permission' | … }`) instead of throwing, and translate the
error code in the UI.

## 3. Expose it in `src/preload/index.ts`

```ts
const api: FamilyInsightApi = {
  // …
  openDataFolder: () => ipcRenderer.invoke(IpcChannel.AppOpenDataFolder)
}
```

The `FamilyInsightApi` type makes TypeScript complain until the preload implements the new method.
Events from main to the renderer use the `subscribe` helper instead
(`onMenuAction: (listener) => subscribe<MenuAction>(IpcChannel.MenuAction, listener)`).

## 4. Use it in the renderer

```ts
<Button onClick={() => void window.familyInsight.openDataFolder()}>
  {t('settings.openDataFolder')}
</Button>
```

`window.familyInsight` is typed through `src/preload/index.d.ts`. Add the label to both locale files.

## 5. Test it

- Pure logic behind the handler belongs in `src/core` or a small testable function in main (see
  `src/main/backups.test.ts`, `src/main/argv.test.ts`).
- In an E2E test, call the method from the page or replace Electron APIs in main with
  `app.evaluate` (see `mockDialogs` in `e2e/app.ts`).
- Update the [Preload API reference](../reference/preload-api).
