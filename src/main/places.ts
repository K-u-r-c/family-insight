import { join } from 'node:path'
import { app, ipcMain } from 'electron'
import { IpcChannel, type PlaceLookupResult } from '@shared/ipc'
import { GeocodeError, Geocoder } from './geocoder'
import { getSettings } from './settings'

/** OpenStreetMap Nominatim; tests point `FAMILY_INSIGHT_GEOCODER_URL` at a local server. */
const NOMINATIM = 'https://nominatim.openstreetmap.org/search'
const SAFE_ID = /^[a-zA-Z0-9-]{1,64}$/

let geocoder: Geocoder | null = null
const pending = new Map<string, AbortController>()

function service(): Geocoder {
  geocoder ??= new Geocoder({
    url: process.env.FAMILY_INSIGHT_GEOCODER_URL || NOMINATIM,
    userAgent: `FamilyInsight/${app.getVersion()} (+https://github.com/K-u-r-c/family-insight)`,
    cachePath: join(app.getPath('userData'), 'place-lookup-cache.json')
  })
  return geocoder
}

export function registerPlaceHandlers(): void {
  ipcMain.handle(
    IpcChannel.PlaceLookup,
    async (_e, requestId: unknown, query: unknown): Promise<PlaceLookupResult> => {
      if (typeof requestId !== 'string' || !SAFE_ID.test(requestId) || typeof query !== 'string') {
        return { ok: false, error: 'failed' }
      }
      // Place names only leave the computer when the user allowed it.
      if (!getSettings().onlinePlaceLookup) return { ok: false, error: 'disabled' }
      const controller = new AbortController()
      pending.get(requestId)?.abort()
      pending.set(requestId, controller)
      try {
        const results = await service().search(
          query.slice(0, 200),
          getSettings().language,
          controller.signal
        )
        return { ok: true, results }
      } catch (error) {
        return { ok: false, error: error instanceof GeocodeError ? error.code : 'failed' }
      } finally {
        if (pending.get(requestId) === controller) pending.delete(requestId)
      }
    }
  )
  ipcMain.handle(IpcChannel.PlaceLookupCancel, (_e, requestId: unknown) => {
    if (typeof requestId === 'string') pending.get(requestId)?.abort()
  })
}
