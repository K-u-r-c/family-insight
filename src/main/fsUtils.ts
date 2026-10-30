import { promises as fs } from 'node:fs'
import { dirname, join, basename } from 'node:path'
import { randomUUID } from 'node:crypto'

/**
 * Writes a file atomically: write to a sibling temp file, fsync, then rename over the target.
 * `data` may be a list of chunks (written in order, never concatenated in memory).
 */
export async function writeFileAtomic(
  path: string,
  data: string | Uint8Array | Uint8Array[]
): Promise<void> {
  await fs.mkdir(dirname(path), { recursive: true })
  const tmp = join(dirname(path), `.${basename(path)}.${randomUUID()}.tmp`)
  const handle = await fs.open(tmp, 'w')
  try {
    await handle.writeFile(data)
    await handle.sync()
  } finally {
    await handle.close()
  }
  try {
    await fs.rename(tmp, path)
  } catch (error) {
    await fs.rm(tmp, { force: true })
    throw error
  }
}
