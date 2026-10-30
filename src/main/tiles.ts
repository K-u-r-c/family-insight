import { join } from 'node:path'
import { app, protocol } from 'electron'
import { getSettings } from './settings'
import { parseTilePath, TileService } from './tileService'

/**
 * `fi-tile://map/{z}/{x}/{y}.png` serves map tiles to the renderer through the main process,
 * so the CSP only allows this scheme (not the internet), and main enforces the "online maps"
 * setting, the User-Agent and the cache.
 */
export const TILE_SCHEME = 'fi-tile'

/** Must run before the app is ready. */
export function registerTileScheme(): void {
  protocol.registerSchemesAsPrivileged([
    { scheme: TILE_SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true } }
  ])
}

let service: TileService | null = null

export function registerTileProtocol(): void {
  protocol.handle(TILE_SCHEME, async (request) => {
    const { onlineMaps, mapTileUrl } = getSettings()
    if (!onlineMaps) return new Response(null, { status: 403 })
    const tile = parseTilePath(new URL(request.url).pathname)
    if (!tile) return new Response(null, { status: 400 })
    service ??= new TileService({
      userAgent: `FamilyInsight/${app.getVersion()} (+https://github.com/K-u-r-c/family-insight)`,
      cacheDir: join(app.getPath('userData'), 'tile-cache')
    })
    const found = await service.get(mapTileUrl, tile.z, tile.x, tile.y)
    if (!found) return new Response(null, { status: 502 })
    return new Response(Buffer.from(found.bytes), {
      headers: { 'Content-Type': found.type, 'Cache-Control': 'max-age=86400' }
    })
  })
}
