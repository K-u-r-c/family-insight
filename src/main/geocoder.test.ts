import { createServer, type IncomingMessage, type Server } from 'node:http'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { GeocodeError, Geocoder } from './geocoder'

/** A local stand-in for Nominatim: records requests, answers from a fixed table. */
let server: Server
let url = ''
let requests: { url: URL; headers: IncomingMessage['headers']; at: number }[] = []
let status = 200

beforeEach(async () => {
  requests = []
  status = 200
  server = createServer((req, res) => {
    const u = new URL(req.url!, 'http://localhost')
    requests.push({ url: u, headers: req.headers, at: Date.now() })
    if (status !== 200) {
      res.writeHead(status).end()
      return
    }
    const q = u.searchParams.get('q')
    const body =
      q === 'Kraków'
        ? [
            { lat: '50.0619474', lon: '19.9368564', display_name: 'Kraków, Lesser Poland, Poland' },
            { lat: 'nope', lon: '1', display_name: 'broken' }
          ]
        : []
    res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(body))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address() as { port: number }
  url = `http://127.0.0.1:${address.port}/search`
})

afterEach(() => new Promise<void>((resolve) => server.close(() => resolve())))

const geocoder = (extra: Partial<ConstructorParameters<typeof Geocoder>[0]> = {}) =>
  new Geocoder({ url, userAgent: 'FamilyInsight-test/1.0', minIntervalMs: 200, ...extra })

describe('Geocoder', () => {
  it('asks the server with an identifying User-Agent and parses the results', async () => {
    const results = await geocoder().search('Kraków', 'pl')
    expect(results).toEqual([
      { lat: 50.0619474, lon: 19.9368564, displayName: 'Kraków, Lesser Poland, Poland' }
    ])
    const [req] = requests
    expect(req!.headers['user-agent']).toBe('FamilyInsight-test/1.0')
    expect(req!.url.searchParams.get('format')).toBe('jsonv2')
    expect(req!.url.searchParams.get('accept-language')).toBe('pl')
  })

  it('caches answers, also on disk, keyed by the normalised name', async () => {
    const cachePath = join(mkdtempSync(join(tmpdir(), 'fi-geo-')), 'cache.json')
    const first = geocoder({ cachePath })
    await first.search('Kraków', 'pl')
    await first.search(' kraków ', 'pl')
    expect(requests).toHaveLength(1)
    expect(Object.keys(JSON.parse(readFileSync(cachePath, 'utf8')))).toEqual(['pl:krakow'])
    // A new instance (next app start) reads the cache from disk.
    await geocoder({ cachePath }).search('Krakow', 'pl')
    expect(requests).toHaveLength(1)
  })

  it('sends at most one request per interval', async () => {
    const g = geocoder()
    await Promise.all(['A', 'B', 'C'].map((q) => g.search(q, 'en')))
    expect(requests).toHaveLength(3)
    const gaps = requests.slice(1).map((r, i) => r.at - requests[i]!.at)
    for (const gap of gaps) expect(gap).toBeGreaterThanOrEqual(190)
  })

  it('can be cancelled while waiting its turn', async () => {
    const g = geocoder({ minIntervalMs: 1000 })
    await g.search('A', 'en')
    const controller = new AbortController()
    const pending = g.search('B', 'en', controller.signal)
    controller.abort()
    await expect(pending).rejects.toMatchObject({ code: 'cancelled' })
    expect(requests).toHaveLength(1)
  })

  it('reports server errors and unreachable servers', async () => {
    status = 503
    await expect(geocoder().search('Kraków', 'en')).rejects.toBeInstanceOf(GeocodeError)
    await expect(geocoder().search('Kraków', 'en')).rejects.toMatchObject({ code: 'failed' })
    const offline = new Geocoder({ url: 'http://127.0.0.1:1/search', userAgent: 'x' })
    await expect(offline.search('Kraków', 'en')).rejects.toMatchObject({ code: 'offline' })
  })
})
