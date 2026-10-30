import { SCHEMA_VERSION, type FamilyTree } from '../model/types'
import { validateTree } from '../model/validate'
import { hasErrors, type Issue } from '../issues'
import { repairSourceReferences } from '../model/sources'
import { migrate } from './migrations'
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
  const { schemaVersion, meta, persons, relationships, sources, repositories } = tree
  return `${JSON.stringify(
    { format: FORMAT_ID, schemaVersion, meta, persons, relationships, sources, repositories },
    null,
    2
  )}\n`
}

/**
 * Parses `.finsight` text: JSON → format check → migrations → shape validation → repair of
 * dangling source references → structural validation. Throws `FileParseError` with a code the
 * UI can translate; repairs are returned as warnings.
 */
export function parseTreeWithWarnings(text: string): { tree: FamilyTree; warnings: Issue[] } {
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

  const migrated = migrate(raw as Record<string, unknown>, version)
  // Development builds of schema 2 had no sources yet.
  migrated.sources ??= {}
  migrated.repositories ??= {}
  const shapeErrors = checkTreeShape(migrated)
  if (shapeErrors.length) throw new FileParseError('invalid-data', shapeErrors)
  const loaded = { ...(migrated as unknown as FamilyTree & { format?: string }) }
  delete loaded.format
  const warnings: Issue[] = []
  const { tree, removedCitations } = repairSourceReferences(loaded)
  if (removedCitations) {
    warnings.push({
      severity: 'warning',
      code: 'dangling-citations-removed',
      params: { count: removedCitations }
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
  return { tree, warnings }
}

/** Like `parseTreeWithWarnings`, for callers that don't show repair warnings. */
export function parseTree(text: string): FamilyTree {
  return parseTreeWithWarnings(text).tree
}
