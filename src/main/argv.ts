import { extname } from 'node:path'
import { fileURLToPath } from 'node:url'

export const TREE_EXTENSION = '.finsight'

/**
 * Extracts a `.finsight` file from command-line arguments. Desktop environments pass either
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
    if (extname(candidate).toLowerCase() === TREE_EXTENSION) return candidate
  }
  return null
}
