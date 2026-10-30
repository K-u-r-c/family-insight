import { mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { rotateBackups } from './backups'

describe('rotateBackups', () => {
  it('keeps the newest copies in .bak1…bakN', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fi-bak-'))
    const file = join(dir, 'tree.finsight')
    await rotateBackups(file, 3) // nothing to back up yet
    expect(existsSync(`${file}.bak1`)).toBe(false)
    for (let v = 1; v <= 5; v++) {
      writeFileSync(file, `v${v}`)
      await rotateBackups(file, 3)
    }
    expect(readFileSync(`${file}.bak1`, 'utf8')).toBe('v5')
    expect(readFileSync(`${file}.bak2`, 'utf8')).toBe('v4')
    expect(readFileSync(`${file}.bak3`, 'utf8')).toBe('v3')
    expect(existsSync(`${file}.bak4`)).toBe(false)
  })
})
