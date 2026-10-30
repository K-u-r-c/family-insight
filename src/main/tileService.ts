import { promises as fs } from 'node:fs'
import { dirname, join } from 'node:path'
import { isTileUrl } from '@core/settings'
import { writeFileAtomic } from './fsUtils'

/**
 * Map tiles for the map view, fetched by the main process (never by the renderer) and only
 * when online maps are allowed. Follows the OpenStreetMap tile usage policy: identifying
 * User-Agent, tiles cached on disk for a week and in memory, no prefetching.
 */

const WEEK = 7 * 24 * 60 * 60 * 1000
const MEMORY_TILES = 400

export interface Tile {
  bytes: Uint8Array
  type: string
}

export interface TileServiceOptions {
  userAgent: string
  /** Folder for the disk cache; memory only when absent. */
  cacheDir?: string
  fetch?: typeof fetch
  timeoutMs?: number
}

/** Parses `z/x/y` and checks the tile exists at that zoom. */
export function parseTilePath(path: string): { z: number; x: number; y: number } | null {
  const m = /^\/?(\d{1,2})\/(\d{1,7})\/(\d{1,7})(?:\.png)?$/.exec(path)
  if (!m) return null
  const [z, x, y] = [Number(m[1]), Number(m[2]), Number(m[3])]
  if (z > 19 || x >= 2 ** z || y >= 2 ** z) return null
  return { z, x, y }
}

export class TileService {
  private readonly memory = new Map<string, Tile>()
  private readonly options: TileServiceOptions & { fetch: typeof fetch; timeoutMs: number }

  constructor(options: TileServiceOptions) {
    this.options = { fetch: globalThis.fetch, timeoutMs: 15_000, ...options }
  }

  async get(template: string, z: number, x: number, y: number): Promise<Tile | null> {
    if (!isTileUrl(template)) return null
    const url = template
      .replace('{s}', 'abc'[(x + y) % 3]!)
      .replace('{z}', String(z))
      .replace('{x}', String(x))
      .replace('{y}', String(y))
    const key = url
    const cached = this.memory.get(key)
    if (cached) {
      this.memory.delete(key)
      this.memory.set(key, cached)
      return cached
    }
    const file = this.options.cacheDir
      ? join(this.options.cacheDir, encodeURIComponent(new URL(url).host), `${z}`, `${x}`, `${y}`)
      : null
    if (file) {
      const stat = await fs.stat(file).catch(() => null)
      if (stat && Date.now() - stat.mtimeMs < WEEK) {
        const tile = { bytes: new Uint8Array(await fs.readFile(file)), type: 'image/png' }
        this.remember(key, tile)
        return tile
      }
    }
    let response: Response
    try {
      response = await this.options.fetch(url, {
        headers: { 'User-Agent': this.options.userAgent },
        signal: AbortSignal.timeout(this.options.timeoutMs)
      })
    } catch {
      return null
    }
    if (!response.ok) return null
    const type = response.headers.get('content-type') ?? 'image/png'
    if (!type.startsWith('image/')) return null
    const tile = { bytes: new Uint8Array(await response.arrayBuffer()), type }
    this.remember(key, tile)
    if (file) {
      await fs.mkdir(dirname(file), { recursive: true }).catch(() => undefined)
      await writeFileAtomic(file, tile.bytes).catch(() => undefined)
    }
    return tile
  }

  private remember(key: string, tile: Tile): void {
    this.memory.set(key, tile)
    while (this.memory.size > MEMORY_TILES) this.memory.delete(this.memory.keys().next().value!)
  }
}
