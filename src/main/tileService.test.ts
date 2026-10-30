import { createServer, type Server } from 'node:http'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { isTileUrl } from '@core/settings'
import { parseTilePath, TileService } from './tileService'

const PNG = Buffer.from('89504e470d0a1a0a', 'hex')
let server: Server
let base = ''
let requests: { path: string; agent?: string }[] = []

beforeEach(async () => {
  requests = []
  server = createServer((req, res) => {
    requests.push({ path: req.url!, agent: req.headers['user-agent'] })
    if (req.url!.startsWith('/missing')) return void res.writeHead(404).end()
    res.writeHead(200, { 'Content-Type': 'image/png' }).end(PNG)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`
})
afterEach(() => new Promise<void>((resolve) => server.close(() => resolve())))

describe('map tiles', () => {
  it('accepts only http(s) templates with z, x and y', () => {
    expect(isTileUrl('https://tile.openstreetmap.org/{z}/{x}/{y}.png')).toBe(true)
    expect(isTileUrl('https://{s}.tile.example.org/{z}/{x}/{y}.png')).toBe(true)
    expect(isTileUrl('file:///etc/{z}/{x}/{y}')).toBe(false)
    expect(isTileUrl('https://example.org/{z}/{x}.png')).toBe(false)
    expect(isTileUrl(42)).toBe(false)
  })

  it('parses tile paths and rejects tiles outside the world', () => {
    expect(parseTilePath('/3/4/5.png')).toEqual({ z: 3, x: 4, y: 5 })
    expect(parseTilePath('3/8/0')).toBeNull()
    expect(parseTilePath('/20/0/0')).toBeNull()
    expect(parseTilePath('/../../etc')).toBeNull()
  })

  it('fetches with an identifying User-Agent and caches in memory and on disk', async () => {
    const cacheDir = mkdtempSync(join(tmpdir(), 'fi-tiles-'))
    const template = `${base}/{z}/{x}/{y}.png`
    const service = new TileService({ userAgent: 'FamilyInsight-test', cacheDir })
    const tile = await service.get(template, 2, 1, 3)
    expect(Buffer.from(tile!.bytes).equals(PNG)).toBe(true)
    expect(tile!.type).toBe('image/png')
    await service.get(template, 2, 1, 3)
    expect(requests).toEqual([{ path: '/2/1/3.png', agent: 'FamilyInsight-test' }])
    // The next app start reads the disk cache.
    await new TileService({ userAgent: 'x', cacheDir }).get(template, 2, 1, 3)
    expect(requests).toHaveLength(1)
  })

  it('returns nothing for errors and unreachable servers', async () => {
    const service = new TileService({ userAgent: 'x' })
    expect(await service.get(`${base}/missing/{z}/{x}/{y}`, 1, 0, 0)).toBeNull()
    expect(await service.get('http://127.0.0.1:1/{z}/{x}/{y}', 1, 0, 0)).toBeNull()
    expect(await service.get('not a template', 1, 0, 0)).toBeNull()
  })
})
