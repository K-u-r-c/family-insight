import { promises as fs } from 'node:fs'

export const MAX_BACKUPS = 5

/**
 * Rotates `file.bak1` … `file.bak5` and keeps the current file as `file.bak1`. The copy is a
 * hard link where the file system supports it (instant even for large trees): saves replace
 * the file by renaming a new one over it, so the old content survives under `.bak1`.
 */
export async function rotateBackups(path: string, count = MAX_BACKUPS): Promise<void> {
  try {
    await fs.access(path)
  } catch {
    return
  }
  await fs.rm(`${path}.bak${count}`, { force: true })
  for (let i = count - 1; i >= 1; i--) {
    await fs.rename(`${path}.bak${i}`, `${path}.bak${i + 1}`).catch(() => undefined)
  }
  await fs.rm(`${path}.bak1`, { force: true })
  try {
    await fs.link(path, `${path}.bak1`)
  } catch {
    // FAT/exFAT sticks and some network shares have no hard links.
    await fs.copyFile(path, `${path}.bak1`)
  }
}
