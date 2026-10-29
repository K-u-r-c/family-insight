import { SCHEMA_VERSION, type FamilyTree } from '../model/types'
import { validateTree } from '../model/validate'
import { hasErrors } from '../issues'
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
  const { schemaVersion, meta, persons, relationships } = tree
  return `${JSON.stringify({ format: FORMAT_ID, schemaVersion, meta, persons, relationships }, null, 2)}\n`
}

/**
 * Parses `.finsight` text: JSON → format check → migrations → shape validation →
 * structural validation. Throws `FileParseError` with a code the UI can translate.
 */
export function parseTree(text: string): FamilyTree {
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
  const shapeErrors = checkTreeShape(migrated)
  if (shapeErrors.length) throw new FileParseError('invalid-data', shapeErrors)
  const tree = { ...(migrated as unknown as FamilyTree & { format?: string }) }
  delete tree.format
  const issues = validateTree(tree)
  if (hasErrors(issues)) {
    throw new FileParseError(
      'invalid-data',
      issues
        .filter((i) => i.severity === 'error')
        .map((i) => `${i.code} ${JSON.stringify(i.params ?? {})}`)
    )
  }
  return tree
}
