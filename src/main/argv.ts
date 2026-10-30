import { extname } from 'node:path'
import { fileURLToPath } from 'node:url'

export const TREE_EXTENSION = '.finsight'
/** Files the app opens when the OS passes them: trees, and GEDCOM files (import). */
const OPENABLE = new Set([TREE_EXTENSION, '.ged', '.gdz'])

/**
 * Extracts a `.finsight` (or GEDCOM) file from command-line arguments. Desktop environments pass either
 * a path or (for `%U` in .desktop files) a `file://` URL.
 */
export function pathFromArgv(argv: string[]): string | null {
  for (const arg of argv.slice(1)) {
    if (arg.startsWith('-')) continue
    let candidate = arg
    if (arg.startsWith('file://')) {
      try {
        candidate = fileURLToPath(arg)
      } catch {
        continue
      }
    }
    if (OPENABLE.has(extname(candidate).toLowerCase())) return candidate
  }
  return null
}
