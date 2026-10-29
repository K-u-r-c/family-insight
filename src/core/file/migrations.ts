import { SCHEMA_VERSION } from '../model/types'

type RawDoc = Record<string, unknown>

/** `MIGRATIONS[n]` upgrades a document from version `n` to `n + 1`. */
export type Migration = (doc: RawDoc) => RawDoc

export const MIGRATIONS: Record<number, Migration> = {
  // Example for the future:
  // 1: (doc) => ({ ...doc, schemaVersion: 2, persons: … }),
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
