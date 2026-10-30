import { SCHEMA_VERSION, type FamilyTree } from '../model/types'
import { validateTree } from '../model/validate'
import { hasErrors, type Issue } from '../issues'
import { repairSourceReferences } from '../model/sources'
import { repairMediaReferences } from '../model/media'
import { migrate, type MigrationContext } from './migrations'
import { checkTreeShape } from './schema'

export const FILE_EXTENSION = 'finsight'
export const FORMAT_ID = 'family-insight'

export type ParseErrorCode = 'invalid-json' | 'not-a-family-tree' | 'newer-version' | 'invalid-data'

export class FileParseError extends Error {
  readonly code: ParseErrorCode
  readonly details: string[]
  constructor(code: ParseErrorCode, details: string[] = []) {
    super(`${code}${details.length ? `: ${details.slice(0, 5).join('; ')}` : ''}`)
    this.name = 'FileParseError'
    this.code = code
    this.details = details
  }
}

/** Serialises a tree to the `.finsight` JSON text (stable key order, 2-space indent). */
export function serializeTree(tree: FamilyTree): string {
  const { schemaVersion, meta, persons, relationships, sources, repositories, media } = tree
  return `${JSON.stringify(
    {
      format: FORMAT_ID,
      schemaVersion,
      meta,
      persons,
      relationships,
      sources,
      repositories,
      media
    },
    null,
    2
  )}\n`
}

export interface ParsedTree {
  tree: FamilyTree
  /** Repairs made while loading (the document should be saved again). */
  warnings: Issue[]
  /** Bytes migrations moved out of the JSON (legacy portraits), by SHA-256. */
  media: Map<string, Uint8Array>
}

/**
 * Parses `.finsight` JSON text: JSON → format check → migrations → shape validation → repair
 * of dangling source and media references → structural validation. Throws `FileParseError`
 * with a code the UI can translate; repairs are returned as warnings.
 */
export function parseTreeWithWarnings(text: string): ParsedTree {
  let raw: unknown
  try {
    raw = JSON.parse(text.replace(/^\uFEFF/, ''))
  } catch {
    throw new FileParseError('invalid-json')
  }
  if (
    typeof raw !== 'object' ||
    raw === null ||
    (raw as Record<string, unknown>).format !== FORMAT_ID
  ) {
    throw new FileParseError('not-a-family-tree')
  }
  const version = (raw as Record<string, unknown>).schemaVersion
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 0) {
    throw new FileParseError('not-a-family-tree')
  }
  if (version > SCHEMA_VERSION) throw new FileParseError('newer-version', [String(version)])

  const context: MigrationContext = { media: new Map() }
  const migrated = migrate(
    raw as Record<string, unknown>,
    version,
    SCHEMA_VERSION,
    undefined,
    context
  )
  // Development builds of schema 2 had no sources yet.
  migrated.sources ??= {}
  migrated.repositories ??= {}
  const shapeErrors = checkTreeShape(migrated)
  if (shapeErrors.length) throw new FileParseError('invalid-data', shapeErrors)
  const loaded = { ...(migrated as unknown as FamilyTree & { format?: string }) }
  delete loaded.format
  const warnings: Issue[] = []
  const { tree: sourced, removedCitations } = repairSourceReferences(loaded)
  if (removedCitations) {
    warnings.push({
      severity: 'warning',
      code: 'dangling-citations-removed',
      params: { count: removedCitations }
    })
  }
  const { tree, removed: removedMedia } = repairMediaReferences(sourced)
  if (removedMedia) {
    warnings.push({
      severity: 'warning',
      code: 'dangling-media-removed',
      params: { count: removedMedia }
    })
  }
  const issues = validateTree(tree)
  if (hasErrors(issues)) {
    throw new FileParseError(
      'invalid-data',
      issues
        .filter((i) => i.severity === 'error')
        .map((i) => `${i.code} ${JSON.stringify(i.params ?? {})}`)
    )
  }
  return { tree, warnings, media: context.media }
}

/** Like `parseTreeWithWarnings`, for callers that don't show repair warnings. */
export function parseTree(text: string): FamilyTree {
  return parseTreeWithWarnings(text).tree
}
