import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { emptyMediaStore, hashBytes, unpackDocument } from '@core/file/container'
import { serializeTree } from '@core/file/format'
import { addMedia } from '@core/model/media'
import { updatePerson } from '@core/model/operations'
import { remarriageFixture } from '@core/test/fixtures'
import type { FamilyTree } from '@core/model/types'
import { saveDocument } from './documentWriter'

/** Photo-like bytes: a JPEG signature followed by `seed`-derived noise. */
function fakePhoto(seed: number, size: number): Uint8Array {
  const bytes = new Uint8Array(size)
  bytes.set([0xff, 0xd8, 0xff, 0xe0])
  let x = seed * 2654435761
  for (let i = 4; i < size; i++) {
    x = (x * 1103515245 + 12345) >>> 0
    bytes[i] = x >>> 24
  }
  return bytes
}

describe('saving a .finsight document', () => {
  it('writes the container atomically and keeps the previous version as a backup', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fi-save-'))
    try {
      const file = join(dir, 'tree.finsight')
      const store = emptyMediaStore()
      const photo = fakePhoto(1, 1000)
      const hash = hashBytes(photo)
      store.media.set(hash, { bytes: photo })
      const tree = addMedia(remarriageFixture(), {
        hash,
        mime: 'image/jpeg',
        fileName: 'a.jpg'
      }).tree
      await saveDocument(file, serializeTree(tree), store, { backup: true })
      expect(existsSync(`${file}.bak1`)).toBe(false)
      const first = readFileSync(file)
      await saveDocument(file, serializeTree(updatePerson(tree, 'jan', { notes: 'x' })), store, {
        backup: true
      })
      expect(readFileSync(`${file}.bak1`)).toEqual(first)
      const { json, store: loaded } = unpackDocument(new Uint8Array(readFileSync(file)))
      expect(JSON.parse(json).persons.jan.notes).toBe('x')
      expect(loaded.media.get(hash)!.bytes).toEqual(photo)
      expect(readdirSync(dir).filter((n) => n.endsWith('.tmp'))).toEqual([])
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('saves a tree with 500 photos where one person changed in under a second', async () => {
    const store = emptyMediaStore()
    let tree: FamilyTree = remarriageFixture()
    for (let i = 0; i < 500; i++) {
      const photo = fakePhoto(i, 400 * 1024)
      const hash = hashBytes(photo)
      store.media.set(hash, { bytes: photo })
      tree = addMedia(tree, { hash, mime: 'image/jpeg', fileName: `${i}.jpg` }).tree
    }
    const dir = mkdtempSync(join(tmpdir(), 'fi-save-'))
    try {
      const file = join(dir, 'tree.finsight')
      // The first save computes every CRC; afterwards only tree.json changes.
      await saveDocument(file, serializeTree(tree), store)
      const size = statSync(file).size
      expect(size).toBeGreaterThan(200e6)

      tree = updatePerson(tree, 'jan', { notes: 'Changed' })
      let start = performance.now()
      await saveDocument(file, serializeTree(tree), store)
      const autosave = performance.now() - start

      tree = updatePerson(tree, 'jan', { notes: 'Changed again' })
      start = performance.now()
      await saveDocument(file, serializeTree(tree), store, { backup: true })
      const explicit = performance.now() - start

      console.info(
        `Saved ${(size / 1e6).toFixed(0)} MB with 500 photos: autosave ${autosave.toFixed(0)} ms, ` +
          `save with backup rotation ${explicit.toFixed(0)} ms (pack, fsync, rename)`
      )
      expect(autosave).toBeLessThan(1000)
      expect(explicit).toBeLessThan(1000)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  }, 60_000)
})
