import { promises as fs } from 'node:fs'
import { join, resolve } from 'node:path'
import { app, ipcMain } from 'electron'
import { IpcChannel, type RecoveryEntry } from '@shared/ipc'
import { writeFileAtomic } from './fsUtils'

/**
 * Crash recovery: the renderer keeps a snapshot of every document with unsaved changes in
 * `userData/recovery`. Snapshots are deleted when the document is saved, discarded or
 * closed cleanly; anything left at start-up means the app did not exit properly.
 */

interface Snapshot {
  id: string
  originalPath: string | null
  name: string
  savedAt: string
  content: string
}

const dir = (): string => join(app.getPath('userData'), 'recovery')
const SAFE_ID = /^[a-zA-Z0-9-]{1,64}$/
const fileFor = (id: string): string => join(dir(), `${id}.json`)

async function readSnapshot(id: string): Promise<Snapshot | null> {
  try {
    const data = JSON.parse(await fs.readFile(fileFor(id), 'utf8')) as Snapshot
    return typeof data.content === 'string' ? data : null
  } catch {
    return null
  }
}

/** Snapshots newer than their original file (or of untitled documents). */
export async function listRecoverable(): Promise<RecoveryEntry[]> {
  const names = await fs.readdir(dir()).catch(() => [] as string[])
  const entries: RecoveryEntry[] = []
  for (const name of names) {
    if (!name.endsWith('.json')) continue
    const snap = await readSnapshot(name.slice(0, -5))
    if (!snap) continue
    if (snap.originalPath) {
      const mtime = await fs.stat(snap.originalPath).then(
        (s) => s.mtimeMs,
        () => 0
      )
      if (mtime >= Date.parse(snap.savedAt)) {
        await fs.rm(fileFor(snap.id), { force: true })
        continue
      }
    }
    entries.push({
      id: snap.id,
      originalPath: snap.originalPath,
      name: snap.name,
      savedAt: snap.savedAt
    })
  }
  return entries.sort((a, b) => b.savedAt.localeCompare(a.savedAt))
}

export function registerRecoveryHandlers(): void {
  ipcMain.handle(
    IpcChannel.RecoveryWrite,
    async (_e, id: unknown, originalPath: unknown, name: unknown, content: unknown) => {
      if (typeof id !== 'string' || !SAFE_ID.test(id) || typeof content !== 'string') return
      const snap: Snapshot = {
        id,
        originalPath: typeof originalPath === 'string' ? resolve(originalPath) : null,
        name: typeof name === 'string' ? name.slice(0, 200) : '',
        savedAt: new Date().toISOString(),
        content
      }
      await writeFileAtomic(fileFor(id), JSON.stringify(snap))
    }
  )
  ipcMain.handle(IpcChannel.RecoveryClear, async (_e, id: unknown) => {
    if (typeof id === 'string' && SAFE_ID.test(id)) await fs.rm(fileFor(id), { force: true })
  })
  ipcMain.handle(IpcChannel.RecoveryList, () => listRecoverable())
  ipcMain.handle(IpcChannel.RecoveryRead, async (_e, id: unknown) => {
    if (typeof id !== 'string' || !SAFE_ID.test(id)) return null
    const snap = await readSnapshot(id)
    return snap ? { content: snap.content, originalPath: snap.originalPath } : null
  })
}
