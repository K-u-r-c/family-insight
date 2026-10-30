import { promises as fs } from 'node:fs'

export const MAX_BACKUPS = 5

/** Rotates `file.bak1` … `file.bak5` and copies the current file to `file.bak1`. */
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
  await fs.copyFile(path, `${path}.bak1`)
}
