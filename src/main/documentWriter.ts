import { emptyMediaStore, packDocument, type MediaStore } from '@core/file/container'
import { rotateBackups } from './backups'
import { writeFileAtomic } from './fsUtils'

/** `.finsight` containers carry photos and scans; larger files are refused on open and save. */
export const MAX_DOCUMENT_BYTES = 2 * 1024 * 1024 * 1024 - 1

export class DocumentTooLargeError extends Error {
  constructor() {
    super('Document too large')
    this.name = 'DocumentTooLargeError'
  }
}

/**
 * Saves document JSON with the media it lists as a `.finsight` container: optional backup
 * rotation, then an atomic write of the chunks. Returns hashes the store had no bytes for.
 */
export async function saveDocument(
  path: string,
  json: string,
  store: MediaStore = emptyMediaStore(),
  options: { backup?: boolean } = {}
): Promise<{ missing: string[] }> {
  const { chunks, missing } = packDocument(json, store)
  if (chunks.reduce((n, c) => n + c.length, 0) > MAX_DOCUMENT_BYTES) {
    throw new DocumentTooLargeError()
  }
  if (options.backup) {
    await rotateBackups(path).catch((error) => console.warn('Backup failed', error))
  }
  await writeFileAtomic(path, chunks)
  return { missing }
}
