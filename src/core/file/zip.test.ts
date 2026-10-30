import { strToU8, unzipSync, zipSync } from 'fflate'
import { describe, expect, it } from 'vitest'
import { concatChunks, crc32, isZip, readZip, writeZip, ZipError } from './zip'

const text = (data: Uint8Array): string => new TextDecoder().decode(data)

describe('zip', () => {
  it('computes CRC-32 (IEEE)', () => {
    expect(crc32(strToU8('123456789'))).toBe(0xcbf43926)
    expect(crc32(new Uint8Array())).toBe(0)
    const long = strToU8('zażółć gęślą jaźń '.repeat(100))
    expect(crc32(long)).toBe(crc32(long.slice()))
  })

  it('round-trips stored and deflated entries', () => {
    const json = strToU8('{"name":"Kowalscy – zażółć"}'.repeat(50))
    const media = Uint8Array.from({ length: 1000 }, (_, i) => i % 251)
    const zip = concatChunks(
      writeZip([
        { name: 'tree.json', data: json, compress: true },
        { name: 'media/a.png', data: media }
      ])
    )
    expect(isZip(zip)).toBe(true)
    const entries = readZip(zip)
    expect(text(entries.get('tree.json')!.data)).toBe(text(json))
    expect(entries.get('media/a.png')!.data).toEqual(media)
    expect(entries.get('media/a.png')!.crc).toBe(crc32(media))
    // Deflated JSON is much smaller than stored.
    expect(zip.length).toBeLessThan(json.length + media.length)
  })

  it('reuses a known CRC instead of computing it', () => {
    const data = strToU8('photo')
    const zip = concatChunks(writeZip([{ name: 'x', data, crc: crc32(data) }]))
    expect(readZip(zip).get('x')!.data).toEqual(data)
  })

  it('interoperates with other zip implementations', () => {
    const ours = concatChunks(
      writeZip([
        { name: 'tree.json', data: strToU8('{}'), compress: true },
        { name: 'media/b.jpg', data: strToU8('JPEG') }
      ])
    )
    const unpacked = unzipSync(ours)
    expect(text(unpacked['tree.json']!)).toBe('{}')
    expect(text(unpacked['media/b.jpg']!)).toBe('JPEG')
    const theirs = zipSync({ 'tree.json': strToU8('{"a":1}'), 'dir/': new Uint8Array() })
    const entries = readZip(theirs)
    expect(text(entries.get('tree.json')!.data)).toBe('{"a":1}')
    expect(entries.has('dir/')).toBe(false)
  })

  it('writes the same bytes for the same input (no timestamps)', () => {
    const make = (): Uint8Array =>
      concatChunks(writeZip([{ name: 'tree.json', data: strToU8('{}'), compress: true }]))
    expect(make()).toEqual(make())
  })

  it('rejects damaged files with ZipError', () => {
    const zip = concatChunks(
      writeZip([
        { name: 'tree.json', data: strToU8('{"a":1}'.repeat(20)), compress: true },
        { name: 'media/c.png', data: strToU8('PNGDATA') }
      ])
    )
    expect(() => readZip(zip.subarray(0, zip.length - 30))).toThrow(ZipError)
    expect(() => readZip(strToU8('PK\x03\x04 not really a zip'))).toThrow(ZipError)
    const flipped = zip.slice()
    const at = Buffer.from(flipped).indexOf('NGDATA') // inside the stored "PNGDATA"
    flipped[at]! ^= 0xff
    expect(() => readZip(flipped)).toThrow(/CRC mismatch|Corrupt/)
    expect(isZip(strToU8('{"format":"family-insight"}'))).toBe(false)
  })
})
