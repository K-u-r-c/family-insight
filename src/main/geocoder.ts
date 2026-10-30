import { promises as fs } from 'node:fs'
import { placeKey } from '@core/model/places'
import { writeFileAtomic } from './fsUtils'

/**
 * Place lookup with OpenStreetMap Nominatim, following its usage policy: at most one request
 * per second, an identifying User-Agent, results cached on disk, only on explicit user action
 * (no bulk lookups). Pure Node so it can be tested against a local HTTP server.
 */

export interface GeocodeResult {
  lat: number
  lon: number
  displayName: string
}

export type GeocodeErrorCode = 'offline' | 'failed' | 'cancelled'

export class GeocodeError extends Error {
  readonly code: GeocodeErrorCode
  constructor(code: GeocodeErrorCode) {
    super(code)
    this.name = 'GeocodeError'
    this.code = code
  }
}

export interface GeocoderOptions {
  /** Search endpoint, e.g. `https://nominatim.openstreetmap.org/search`. */
  url: string
  userAgent: string
  /** JSON file for the cache; memory only when absent. */
  cachePath?: string
  /** Minimum time between two requests (Nominatim: 1 s). */
  minIntervalMs?: number
  timeoutMs?: number
  fetch?: typeof fetch
}

const MAX_RESULTS = 5
const MAX_CACHE = 2000

export class Geocoder {
  private readonly options: Required<Omit<GeocoderOptions, 'cachePath'>> & { cachePath?: string }
  private cache: Map<string, GeocodeResult[]> | null = null
  private queue: Promise<unknown> = Promise.resolve()
  private lastRequest = 0

  constructor(options: GeocoderOptions) {
    this.options = { minIntervalMs: 1000, timeoutMs: 15_000, fetch: globalThis.fetch, ...options }
  }

  private async loadCache(): Promise<Map<string, GeocodeResult[]>> {
    if (this.cache) return this.cache
    this.cache = new Map()
    if (this.options.cachePath) {
      try {
        const data = JSON.parse(await fs.readFile(this.options.cachePath, 'utf8')) as Record<
          string,
          GeocodeResult[]
        >
        for (const [key, value] of Object.entries(data))
          if (Array.isArray(value)) this.cache.set(key, value)
      } catch {
        // No cache yet, or unreadable: start empty.
      }
    }
    return this.cache
  }

  private async saveCache(): Promise<void> {
    if (!this.options.cachePath || !this.cache) return
    while (this.cache.size > MAX_CACHE) this.cache.delete(this.cache.keys().next().value!)
    await writeFileAtomic(this.options.cachePath, JSON.stringify(Object.fromEntries(this.cache)))
  }

  /** Looks up a place name; cached answers return immediately, others wait their turn. */
  async search(query: string, language: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
    const q = query.trim().slice(0, 200)
    if (!q) return []
    const key = `${language}:${placeKey(q)}`
    const cache = await this.loadCache()
    const cached = cache.get(key)
    if (cached) return cached
    const run = async (): Promise<GeocodeResult[]> => {
      if (signal?.aborted) throw new GeocodeError('cancelled')
      const wait = this.lastRequest + this.options.minIntervalMs - Date.now()
      if (wait > 0) await delay(wait, signal)
      this.lastRequest = Date.now()
      const results = await this.request(q, language, signal)
      cache.delete(key)
      cache.set(key, results)
      await this.saveCache().catch(() => undefined)
      return results
    }
    const result = this.queue.then(run, run)
    this.queue = result.catch(() => undefined)
    return result
  }

  private async request(
    q: string,
    language: string,
    signal?: AbortSignal
  ): Promise<GeocodeResult[]> {
    const url = new URL(this.options.url)
    url.searchParams.set('q', q)
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('limit', String(MAX_RESULTS))
    url.searchParams.set('accept-language', language)
    const timeout = AbortSignal.timeout(this.options.timeoutMs)
    let response: Response
    try {
      response = await this.options.fetch(url, {
        headers: { 'User-Agent': this.options.userAgent, Accept: 'application/json' },
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout
      })
    } catch (error) {
      if (signal?.aborted) throw new GeocodeError('cancelled')
      throw new GeocodeError((error as Error).name === 'TimeoutError' ? 'failed' : 'offline')
    }
    if (!response.ok) throw new GeocodeError('failed')
    let data: unknown
    try {
      data = await response.json()
    } catch {
      throw new GeocodeError('failed')
    }
    if (!Array.isArray(data)) throw new GeocodeError('failed')
    return data
      .map((item: { lat?: unknown; lon?: unknown; display_name?: unknown }) => ({
        lat: Number(item.lat),
        lon: Number(item.lon),
        displayName: typeof item.display_name === 'string' ? item.display_name.slice(0, 300) : ''
      }))
      .filter(
        (r) =>
          Number.isFinite(r.lat) &&
          Math.abs(r.lat) <= 90 &&
          Number.isFinite(r.lon) &&
          Math.abs(r.lon) <= 180
      )
      .slice(0, MAX_RESULTS)
  }
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(new GeocodeError('cancelled'))
      },
      { once: true }
    )
  })
}
