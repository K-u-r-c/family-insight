import { SCHEMA_VERSION } from '../model/types'
import { sniffMime } from '../model/media'
import { hashBytes } from './container'

type RawDoc = Record<string, unknown>

const isObj = (v: unknown): v is RawDoc => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Side output of migrations: bytes moved out of the JSON (legacy portraits), by SHA-256. */
export interface MigrationContext {
  media: Map<string, Uint8Array>
}

/** `MIGRATIONS[n]` upgrades a document from version `n` to `n + 1`. */
export type Migration = (doc: RawDoc, context: MigrationContext) => RawDoc

/** Decodes a base64 `data:` URL; `null` if it isn't one. */
function decodeDataUrl(url: unknown): Uint8Array | null {
  if (typeof url !== 'string') return null
  const match = /^data:[^,]*;base64,(.*)$/s.exec(url)
  if (!match) return null
  try {
    const binary = atob(match[1]!)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes
  } catch {
    return null
  }
}

export const MIGRATIONS: Record<number, Migration> = {
  // v1 → v2: people get a list of life events (baptism, emigration, …); the tree gets
  // sources and repositories for citations.
  1: (doc) => ({
    ...doc,
    sources: isObj(doc.sources) ? doc.sources : {},
    repositories: isObj(doc.repositories) ? doc.repositories : {},
    persons: Object.fromEntries(
      Object.entries(isObj(doc.persons) ? doc.persons : {}).map(([id, p]) => [
        id,
        isObj(p) && !Array.isArray(p.events) ? { ...p, events: [] } : p
      ])
    )
  }),
  // v2 → v3: the tree gets a media library; portraits move from `photo` data URLs into it
  // (`portraitMediaId`), their bytes go to the container.
  2: (doc, context) => {
    const media: RawDoc = isObj(doc.media) ? { ...doc.media } : {}
    const persons = Object.fromEntries(
      Object.entries(isObj(doc.persons) ? doc.persons : {}).map(([id, p]) => {
        if (!isObj(p) || !('photo' in p)) return [id, p]
        const { photo, ...rest } = p
        const bytes = decodeDataUrl(photo)
        const mime = bytes && sniffMime(bytes)
        if (!bytes || !mime?.startsWith('image/')) return [id, rest]
        const hash = hashBytes(bytes)
        context.media.set(hash, bytes)
        const mediaId = `portrait-${id}`
        media[mediaId] = {
          id: mediaId,
          hash,
          mime,
          fileName: `portrait.${mime.slice(6).replace('jpeg', 'jpg')}`,
          size: bytes.length
        }
        return [id, { ...rest, portraitMediaId: mediaId }]
      })
    )
    return { ...doc, persons, media }
  }
}

/** Applies migrations in order until the document reaches `target`. */
export function migrate(
  doc: RawDoc,
  from: number,
  target: number = SCHEMA_VERSION,
  migrations: Record<number, Migration> = MIGRATIONS,
  context: MigrationContext = { media: new Map() }
): RawDoc {
  let current = doc
  for (let v = from; v < target; v++) {
    const step = migrations[v]
    if (!step) throw new Error(`Missing migration from schema version ${v}`)
    current = { ...step(current, context), schemaVersion: v + 1 }
  }
  return current
}
