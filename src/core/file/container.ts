import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex } from '@noble/hashes/utils.js'
import { isMediaHash, mediaEntryName } from '../model/media'
import { MEDIA_TYPES, type MediaMime } from '../model/types'
import { decodeText } from './encoding'
import { crc32, isZip, readZip, writeZip, ZipError, type ZipInput } from './zip'

/**
 * The `.finsight` container: a zip with `tree.json` (the document, deflated), the media
 * library under `media/<sha256>.<ext>` (stored) and thumbnails under `thumbs/<sha256>.webp`.
 * Files of Family Insight 1.0 are plain JSON and are detected by their first bytes.
 */

export const TREE_ENTRY = 'tree.json'

/** Bytes of a media file or thumbnail, with its CRC-32 once known. */
export interface StoredBytes {
  bytes: Uint8Array
  crc?: number
}

/** Media bytes of one open document, keyed by SHA-256 (never shrinks during a session). */
export interface MediaStore {
  media: Map<string, StoredBytes>
  thumbs: Map<string, StoredBytes>
}

export const emptyMediaStore = (): MediaStore => ({ media: new Map(), thumbs: new Map() })

export type ContainerErrorCode = 'corrupt-container' | 'missing-tree'

export class ContainerError extends Error {
  readonly code: ContainerErrorCode
  constructor(code: ContainerErrorCode, detail?: string) {
    super(detail ? `${code}: ${detail}` : code)
    this.name = 'ContainerError'
    this.code = code
  }
}

/** SHA-256 of a file as lowercase hex: the media id of its bytes. */
export function hashBytes(bytes: Uint8Array): string {
  return bytesToHex(sha256(bytes))
}

const MEDIA_ENTRY = /^media\/([0-9a-f]{64})\.[a-z0-9]+$/
const THUMB_ENTRY = /^thumbs\/([0-9a-f]{64})\.webp$/
const encoder = new TextEncoder()

/**
 * Opens a `.finsight` file: a container, or a legacy JSON file (then the store is empty).
 * Throws `ContainerError` for a damaged zip.
 */
export function unpackDocument(bytes: Uint8Array): { json: string; store: MediaStore } {
  const store = emptyMediaStore()
  if (!isZip(bytes)) return { json: decodeText(bytes).text, store }
  let entries
  try {
    entries = readZip(bytes)
  } catch (error) {
    throw new ContainerError('corrupt-container', error instanceof ZipError ? error.message : '')
  }
  const tree = entries.get(TREE_ENTRY)
  if (!tree) throw new ContainerError('missing-tree')
  for (const [name, entry] of entries) {
    const media = MEDIA_ENTRY.exec(name)
    if (media) store.media.set(media[1]!, { bytes: entry.data, crc: entry.crc })
    const thumb = THUMB_ENTRY.exec(name)
    if (thumb) store.thumbs.set(thumb[1]!, { bytes: entry.data, crc: entry.crc })
  }
  return { json: new TextDecoder().decode(tree.data), store }
}

/** `hash → mime` of the media items listed in document JSON (invalid entries are skipped). */
export function mediaOfJson(json: string): Map<string, MediaMime> {
  const out = new Map<string, MediaMime>()
  const doc = JSON.parse(json) as { media?: Record<string, { hash?: unknown; mime?: unknown }> }
  for (const item of Object.values(doc.media ?? {})) {
    if (isMediaHash(item?.hash) && typeof item.mime === 'string' && item.mime in MEDIA_TYPES) {
      out.set(item.hash, item.mime as MediaMime)
    }
  }
  return out
}

/**
 * Builds the container for document JSON as chunks to write in order. Only media the
 * document lists are included (orphans are garbage-collected); known CRCs are reused, so
 * unchanged media cost no hashing. `missing` lists hashes the store has no bytes for.
 */
export function packDocument(
  json: string,
  store: MediaStore
): { chunks: Uint8Array[]; missing: string[] } {
  const inputs: ZipInput[] = [{ name: TREE_ENTRY, data: encoder.encode(json), compress: true }]
  const missing: string[] = []
  for (const [hash, mime] of [...mediaOfJson(json)].sort(([a], [b]) => a.localeCompare(b))) {
    const media = store.media.get(hash)
    if (!media) {
      missing.push(hash)
      continue
    }
    inputs.push(input(mediaEntryName(hash, mime), media))
    const thumb = store.thumbs.get(hash)
    if (thumb) inputs.push(input(`thumbs/${hash}.webp`, thumb))
  }
  return { chunks: writeZip(inputs), missing }
}

function input(name: string, stored: StoredBytes): ZipInput {
  if (stored.crc === undefined) stored.crc = crc32(stored.bytes)
  return { name, data: stored.bytes, crc: stored.crc }
}
