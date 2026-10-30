import { mkdtempSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { rotateBackups } from './backups'
import { writeFileAtomic } from './fsUtils'

describe('rotateBackups', () => {
  it('keeps the newest copies in .bak1…bakN', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fi-bak-'))
    const file = join(dir, 'tree.finsight')
    await rotateBackups(file, 3) // nothing to back up yet
    expect(existsSync(`${file}.bak1`)).toBe(false)
    // The app always replaces the file atomically (new inode), which hard-linked backups rely on.
    for (let v = 1; v <= 5; v++) {
      await writeFileAtomic(file, `v${v}`)
      await rotateBackups(file, 3)
    }
    expect(readFileSync(`${file}.bak1`, 'utf8')).toBe('v5')
    expect(readFileSync(`${file}.bak2`, 'utf8')).toBe('v4')
    expect(readFileSync(`${file}.bak3`, 'utf8')).toBe('v3')
    expect(existsSync(`${file}.bak4`)).toBe(false)
  })

  it('keeps the old content when the file is replaced atomically', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fi-bak-'))
    const file = join(dir, 'tree.finsight')
    await writeFileAtomic(file, 'old')
    await rotateBackups(file)
    await writeFileAtomic(file, 'new')
    expect(readFileSync(`${file}.bak1`, 'utf8')).toBe('old')
    expect(readFileSync(file, 'utf8')).toBe('new')
  })
})
