import { strToU8, unzipSync } from 'fflate'
import { describe, expect, it } from 'vitest'
import { addMedia, setPortrait } from '../model/media'
import { updatePerson } from '../model/operations'
import type { FamilyTree, MediaMime } from '../model/types'
import { remarriageFixture } from '../test/fixtures'
import {
  ContainerError,
  emptyMediaStore,
  hashBytes,
  packDocument,
  unpackDocument,
  type MediaStore
} from './container'
import { parseTree, serializeTree } from './format'
import { concatChunks, writeZip } from './zip'

const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

/** Fake image bytes of the given type: a real signature followed by `seed`-derived bytes. */
function fakeImage(seed: number, size = 64, header = PNG_HEADER): Uint8Array {
  const bytes = new Uint8Array(size)
  bytes.set(header)
  let x = seed * 2654435761
  for (let i = header.length; i < size; i++) {
    x = (x * 1103515245 + 12345) >>> 0
    bytes[i] = x >>> 24
  }
  return bytes
}

/** Adds `bytes` to the store and a media item for it to the tree. */
function withMedia(
  tree: FamilyTree,
  store: MediaStore,
  id: string,
  bytes: Uint8Array,
  mime: MediaMime = 'image/png'
): FamilyTree {
  const hash = hashBytes(bytes)
  store.media.set(hash, { bytes })
  return addMedia(tree, { hash, mime, fileName: `${id}.png`, size: bytes.length }, { id }).tree
}

const pack = (tree: FamilyTree, store: MediaStore): Uint8Array =>
  concatChunks(packDocument(serializeTree(tree), store).chunks)

describe('.finsight container', () => {
  it('round-trips the tree, media and thumbnails', () => {
    const store = emptyMediaStore()
    const photo = fakeImage(1)
    let tree = withMedia(remarriageFixture(), store, 'm1', photo)
    tree = setPortrait(tree, 'jan', 'm1')
    const hash = hashBytes(photo)
    store.thumbs.set(hash, { bytes: strToU8('RIFF....WEBP') })

    const file = pack(tree, store)
    const names = Object.keys(unzipSync(file))
    expect(names).toEqual(['tree.json', `media/${hash}.png`, `thumbs/${hash}.webp`])

    const { json, store: loaded } = unpackDocument(file)
    expect(parseTree(json)).toEqual(tree)
    expect(loaded.media.get(hash)!.bytes).toEqual(photo)
    expect(loaded.thumbs.get(hash)!.bytes).toEqual(strToU8('RIFF....WEBP'))
    // CRCs come from the zip, so saving again does not hash the media.
    expect(loaded.media.get(hash)!.crc).toBeTypeOf('number')
  })

  it('opens legacy JSON files (detected by their first bytes)', () => {
    const text = serializeTree(remarriageFixture())
    const { json, store } = unpackDocument(strToU8(`\uFEFF${text}`))
    expect(json).toBe(text)
    expect(store.media.size).toBe(0)
  })

  it('stores a file used by several media items once', () => {
    const store = emptyMediaStore()
    const scan = fakeImage(2)
    let tree = withMedia(remarriageFixture(), store, 'a', scan)
    tree = withMedia(tree, store, 'b', scan)
    const media = Object.keys(unzipSync(pack(tree, store))).filter((n) => n.startsWith('media/'))
    expect(media).toEqual([`media/${hashBytes(scan)}.png`])
  })

  it('garbage-collects media no item refers to', () => {
    const store = emptyMediaStore()
    const kept = fakeImage(3)
    const orphan = fakeImage(4)
    let tree = withMedia(remarriageFixture(), store, 'kept', kept)
    store.media.set(hashBytes(orphan), { bytes: orphan })
    store.thumbs.set(hashBytes(orphan), { bytes: strToU8('thumb') })
    tree = updatePerson(tree, 'jan', { mediaIds: ['kept'] })
    const names = Object.keys(unzipSync(pack(tree, store)))
    expect(names).toEqual(['tree.json', `media/${hashBytes(kept)}.png`])
    // The session store keeps everything (undo may bring a removed item back).
    expect(store.media.has(hashBytes(orphan))).toBe(true)
  })

  it('reports media the store has no bytes for', () => {
    const tree = addMedia(remarriageFixture(), {
      hash: 'c'.repeat(64),
      mime: 'application/pdf',
      fileName: 'gone.pdf'
    }).tree
    const { missing } = packDocument(serializeTree(tree), emptyMediaStore())
    expect(missing).toEqual(['c'.repeat(64)])
  })

  it('ignores unexpected entries and fails cleanly on damage', () => {
    const json = serializeTree(remarriageFixture())
    const extra = concatChunks(
      writeZip([
        { name: 'tree.json', data: strToU8(json), compress: true },
        { name: 'notes/readme.txt', data: strToU8('hello') },
        { name: 'media/../../evil.png', data: strToU8('x') }
      ])
    )
    const { store } = unpackDocument(extra)
    expect(store.media.size).toBe(0)

    const code = (bytes: Uint8Array): string | undefined => {
      try {
        unpackDocument(bytes)
      } catch (error) {
        return error instanceof ContainerError ? error.code : 'other'
      }
      return undefined
    }
    expect(code(extra.subarray(0, extra.length - 10))).toBe('corrupt-container')
    expect(code(strToU8('PK\x03\x04garbage'))).toBe('corrupt-container')
    expect(code(concatChunks(writeZip([{ name: 'other.json', data: strToU8('{}') }])))).toBe(
      'missing-tree'
    )
  })
})
