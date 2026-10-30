import { SCHEMA_VERSION } from '../model/types'

type RawDoc = Record<string, unknown>

const isObj = (v: unknown): v is RawDoc => typeof v === 'object' && v !== null && !Array.isArray(v)

/** `MIGRATIONS[n]` upgrades a document from version `n` to `n + 1`. */
export type Migration = (doc: RawDoc) => RawDoc

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
  })
}

/** Applies migrations in order until the document reaches `target`. */
export function migrate(
  doc: RawDoc,
  from: number,
  target: number = SCHEMA_VERSION,
  migrations: Record<number, Migration> = MIGRATIONS
): RawDoc {
  let current = doc
  for (let v = from; v < target; v++) {
    const step = migrations[v]
    if (!step) throw new Error(`Missing migration from schema version ${v}`)
    current = { ...step(current), schemaVersion: v + 1 }
  }
  return current
}
