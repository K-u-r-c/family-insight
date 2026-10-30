import { deflateSync, inflateSync } from 'fflate'

/**
 * Minimal zip reader/writer for the `.finsight` container. Media entries are stored
 * uncompressed with a cached CRC, so saving a large tree only writes bytes it already has;
 * `tree.json` is deflated. No zip64: a container is limited to 4 GiB and 65 535 entries.
 */

export class ZipError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ZipError'
  }
}

const CRC_TABLE = (() => {
  const table = new Int32Array(256 * 8)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  for (let n = 0; n < 256; n++) {
    let c = table[n]!
    for (let k = 1; k < 8; k++) {
      c = table[c & 0xff]! ^ (c >>> 8)
      table[k * 256 + n] = c
    }
  }
  return table
})()

/** CRC-32 (IEEE) of `data`, slice-by-8. */
export function crc32(data: Uint8Array): number {
  const t = CRC_TABLE
  let crc = -1
  let i = 0
  const end8 = data.length - (data.length % 8)
  for (; i < end8; i += 8) {
    const a = (data[i]! | (data[i + 1]! << 8) | (data[i + 2]! << 16) | (data[i + 3]! << 24)) ^ crc
    const b = data[i + 4]! | (data[i + 5]! << 8) | (data[i + 6]! << 16) | (data[i + 7]! << 24)
    crc =
      t[1792 + (a & 0xff)]! ^
      t[1536 + ((a >>> 8) & 0xff)]! ^
      t[1280 + ((a >>> 16) & 0xff)]! ^
      t[1024 + (a >>> 24)]! ^
      t[768 + (b & 0xff)]! ^
      t[512 + ((b >>> 8) & 0xff)]! ^
      t[256 + ((b >>> 16) & 0xff)]! ^
      t[b >>> 24]!
  }
  for (; i < data.length; i++) crc = t[(crc ^ data[i]!) & 0xff]! ^ (crc >>> 8)
  return (crc ^ -1) >>> 0
}

export interface ZipInput {
  name: string
  data: Uint8Array
  /** CRC-32 of `data` when already known (saves hashing unchanged media). */
  crc?: number
  /** Deflate the entry (text); binary media is stored as is. */
  compress?: boolean
}

export interface ZipEntry {
  data: Uint8Array
  crc: number
}

const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04]

/** Whether `bytes` start like a zip file (local file header signature). */
export function isZip(bytes: Uint8Array): boolean {
  return ZIP_MAGIC.every((b, i) => bytes[i] === b)
}

const encoder = new TextEncoder()
const DOS_DATE_1980 = (1 << 5) | 1 // 1980-01-01: stable output, no timestamps leak.

/** Builds the zip as a list of chunks (write them in order; nothing large is copied). */
export function writeZip(inputs: ZipInput[]): Uint8Array[] {
  const chunks: Uint8Array[] = []
  const central: Uint8Array[] = []
  let offset = 0
  for (const input of inputs) {
    const name = encoder.encode(input.name)
    const crc = input.crc ?? crc32(input.data)
    const stored = input.compress ? deflateSync(input.data, { level: 6 }) : input.data
    const method = input.compress ? 8 : 0
    const local = new Uint8Array(30 + name.length)
    const lv = new DataView(local.buffer)
    lv.setUint32(0, 0x04034b50, true)
    lv.setUint16(4, 20, true)
    lv.setUint16(6, 0x0800, true) // UTF-8 names
    lv.setUint16(8, method, true)
    lv.setUint16(10, 0, true)
    lv.setUint16(12, DOS_DATE_1980, true)
    lv.setUint32(14, crc, true)
    lv.setUint32(18, stored.length, true)
    lv.setUint32(22, input.data.length, true)
    lv.setUint16(26, name.length, true)
    local.set(name, 30)
    const header = new Uint8Array(46 + name.length)
    const cv = new DataView(header.buffer)
    cv.setUint32(0, 0x02014b50, true)
    cv.setUint16(4, 20, true)
    cv.setUint16(6, 20, true)
    cv.setUint16(8, 0x0800, true)
    cv.setUint16(10, method, true)
    cv.setUint16(14, DOS_DATE_1980, true)
    cv.setUint32(16, crc, true)
    cv.setUint32(20, stored.length, true)
    cv.setUint32(24, input.data.length, true)
    cv.setUint16(28, name.length, true)
    cv.setUint32(42, offset, true)
    header.set(name, 46)
    chunks.push(local, stored)
    central.push(header)
    offset += local.length + stored.length
    if (offset > 0xffffffff) throw new ZipError('Container larger than 4 GiB')
  }
  const centralSize = central.reduce((n, c) => n + c.length, 0)
  const end = new Uint8Array(22)
  const ev = new DataView(end.buffer)
  ev.setUint32(0, 0x06054b50, true)
  ev.setUint16(8, inputs.length, true)
  ev.setUint16(10, inputs.length, true)
  ev.setUint32(12, centralSize, true)
  ev.setUint32(16, offset, true)
  return [...chunks, ...central, end]
}

/** Concatenates chunks (tests, small files, platforms without chunked writes). */
export function concatChunks(chunks: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0))
  let at = 0
  for (const c of chunks) {
    out.set(c, at)
    at += c.length
  }
  return out
}

const decoder = new TextDecoder('utf-8', { fatal: false })

/**
 * Reads every entry of a zip. Stored entries are views into `bytes` (no copy). Throws
 * `ZipError` for anything malformed, encrypted, zip64 or failing its CRC check.
 */
export function readZip(bytes: Uint8Array, verify = true): Map<string, ZipEntry> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let eocd = -1
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 0xffff); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new ZipError('End of central directory not found')
  const count = view.getUint16(eocd + 10, true)
  const centralOffset = view.getUint32(eocd + 16, true)
  if (count === 0xffff || centralOffset === 0xffffffff) throw new ZipError('zip64 not supported')
  const entries = new Map<string, ZipEntry>()
  let at = centralOffset
  for (let i = 0; i < count; i++) {
    if (at + 46 > bytes.length || view.getUint32(at, true) !== 0x02014b50) {
      throw new ZipError('Corrupt central directory')
    }
    const flags = view.getUint16(at + 8, true)
    const method = view.getUint16(at + 10, true)
    const crc = view.getUint32(at + 16, true)
    const compressedSize = view.getUint32(at + 20, true)
    const size = view.getUint32(at + 24, true)
    const nameLength = view.getUint16(at + 28, true)
    const extraLength = view.getUint16(at + 30, true)
    const commentLength = view.getUint16(at + 32, true)
    const localOffset = view.getUint32(at + 42, true)
    const name = decoder.decode(bytes.subarray(at + 46, at + 46 + nameLength))
    at += 46 + nameLength + extraLength + commentLength
    if (flags & 1) throw new ZipError(`Encrypted entry ${name}`)
    if (localOffset + 30 > bytes.length || view.getUint32(localOffset, true) !== 0x04034b50) {
      throw new ZipError(`Corrupt local header of ${name}`)
    }
    const start =
      localOffset +
      30 +
      view.getUint16(localOffset + 26, true) +
      view.getUint16(localOffset + 28, true)
    if (start + compressedSize > bytes.length) throw new ZipError(`Truncated entry ${name}`)
    const raw = bytes.subarray(start, start + compressedSize)
    let data: Uint8Array
    if (method === 0) data = raw
    else if (method === 8) {
      try {
        data = inflateSync(raw, { out: new Uint8Array(size) })
      } catch {
        throw new ZipError(`Corrupt data of ${name}`)
      }
    } else throw new ZipError(`Unsupported compression of ${name}`)
    if (data.length !== size) throw new ZipError(`Wrong size of ${name}`)
    if (verify && crc32(data) !== crc) throw new ZipError(`CRC mismatch in ${name}`)
    if (!name.endsWith('/')) entries.set(name, { data, crc })
  }
  return entries
}
