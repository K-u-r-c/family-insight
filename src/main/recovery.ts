import { promises as fs } from 'node:fs'
import { join, resolve } from 'node:path'
import { app, ipcMain } from 'electron'
import { emptyMediaStore, mediaOfJson } from '@core/file/container'
import { IpcChannel, type RecoveryEntry } from '@shared/ipc'
import { writeFileAtomic } from './fsUtils'
import { createLibrary, getLibrary } from './media'

/**
 * Crash recovery: the renderer keeps a snapshot of every document with unsaved changes in
 * `userData/recovery`. Snapshots are deleted when the document is saved, discarded or
 * closed cleanly; anything left at start-up means the app did not exit properly.
 * Media bytes go to `<id>.media/<hash>` (thumbnails `<hash>.thumb`), each written once.
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
const mediaDirFor = (id: string): string => join(dir(), `${id}.media`)
const HASH_FILE = /^([0-9a-f]{64})(\.thumb)?$/

async function removeSnapshot(id: string): Promise<void> {
  await fs.rm(fileFor(id), { force: true })
  await fs.rm(mediaDirFor(id), { recursive: true, force: true })
}

/** Writes the media the document lists that the snapshot folder doesn't have yet. */
async function writeSnapshotMedia(id: string, content: string, library: unknown): Promise<void> {
  const store = getLibrary(library)
  if (!store) return
  const hashes = [...mediaOfJson(content).keys()]
  if (!hashes.length) return
  const folder = mediaDirFor(id)
  await fs.mkdir(folder, { recursive: true })
  const present = new Set(await fs.readdir(folder))
  for (const hash of hashes) {
    const media = store.media.get(hash)
    if (media && !present.has(hash)) await writeFileAtomic(join(folder, hash), media.bytes)
    const thumb = store.thumbs.get(hash)
    if (thumb && !present.has(`${hash}.thumb`)) {
      await writeFileAtomic(join(folder, `${hash}.thumb`), thumb.bytes)
    }
  }
}

async function readSnapshotMedia(id: string): Promise<string> {
  const store = emptyMediaStore()
  const folder = mediaDirFor(id)
  for (const name of await fs.readdir(folder).catch(() => [] as string[])) {
    const match = HASH_FILE.exec(name)
    if (!match) continue
    const bytes = new Uint8Array(await fs.readFile(join(folder, name)))
    ;(match[2] ? store.thumbs : store.media).set(match[1]!, { bytes })
  }
  return createLibrary(store)
}

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
    if (name.endsWith('.media') && !names.includes(`${name.slice(0, -6)}.json`)) {
      await fs.rm(join(dir(), name), { recursive: true, force: true })
      continue
    }
    if (!name.endsWith('.json')) continue
    const snap = await readSnapshot(name.slice(0, -5))
    if (!snap) continue
    if (snap.originalPath) {
      const mtime = await fs.stat(snap.originalPath).then(
        (s) => s.mtimeMs,
        () => 0
      )
      if (mtime >= Date.parse(snap.savedAt)) {
        await removeSnapshot(snap.id)
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
    async (
      _e,
      id: unknown,
      originalPath: unknown,
      name: unknown,
      content: unknown,
      library: unknown
    ) => {
      if (typeof id !== 'string' || !SAFE_ID.test(id) || typeof content !== 'string') return
      // Media first: a snapshot is only listed once its JSON exists.
      await writeSnapshotMedia(id, content, library)
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
    if (typeof id === 'string' && SAFE_ID.test(id)) await removeSnapshot(id)
  })
  ipcMain.handle(IpcChannel.RecoveryList, () => listRecoverable())
  ipcMain.handle(IpcChannel.RecoveryRead, async (_e, id: unknown) => {
    if (typeof id !== 'string' || !SAFE_ID.test(id)) return null
    const snap = await readSnapshot(id)
    if (!snap) return null
    return {
      content: snap.content,
      originalPath: snap.originalPath,
      library: await readSnapshotMedia(id)
    }
  })
}
