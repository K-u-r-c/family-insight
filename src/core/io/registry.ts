import type { Issue } from '../issues'
import type { FamilyTree } from '../model/types'

export interface ImportResult {
  tree: FamilyTree
  errors: Issue[]
  warnings: Issue[]
}

/**
 * A file format Family Insight can read and/or write. Adding a format (e.g. GEDCOM) means
 * implementing this interface and calling `registerFormat` – menus and file dialogs pick it up.
 */
export interface FormatAdapter<
  ImportOptions = Record<string, unknown>,
  ExportOptions = Record<string, unknown>
> {
  /** Stable identifier, also used over IPC (e.g. `finsight`, `csv`). */
  id: string
  /** File extensions without the dot; the first one is used when saving. */
  extensions: string[]
  /** i18n key of the human-readable name (file dialog filter label). */
  labelKey: string
  /** `native` formats keep everything; `interchange` formats may lose information. */
  kind: 'native' | 'interchange'
  import?: (content: string, options?: ImportOptions) => ImportResult
  export?: (tree: FamilyTree, options?: ExportOptions) => string
}

const formats = new Map<string, FormatAdapter>()

export function registerFormat<I, E>(adapter: FormatAdapter<I, E>): void {
  if (formats.has(adapter.id)) throw new Error(`Format already registered: ${adapter.id}`)
  formats.set(adapter.id, adapter as unknown as FormatAdapter)
}

export function unregisterFormat(id: string): void {
  formats.delete(id)
}

export function getFormat(id: string): FormatAdapter | undefined {
  return formats.get(id)
}

export function listFormats(filter?: {
  canImport?: boolean
  canExport?: boolean
}): FormatAdapter[] {
  return [...formats.values()].filter(
    (f) => (!filter?.canImport || !!f.import) && (!filter?.canExport || !!f.export)
  )
}

/** The registered format handling a file path, by extension. */
export function formatForPath(path: string): FormatAdapter | undefined {
  const ext = path.toLowerCase().split('.').pop() ?? ''
  return [...formats.values()].find((f) => f.extensions.includes(ext))
}
