import { FILE_EXTENSION, parseTree, serializeTree } from '../file/format'
import { registerFormat, getFormat } from './registry'

/** Registers the built-in formats once (safe to call from main and renderer). */
export function registerBuiltInFormats(): void {
  if (!getFormat('finsight')) {
    registerFormat({
      id: 'finsight',
      extensions: [FILE_EXTENSION],
      labelKey: 'files.treeFilter',
      kind: 'native',
      import: (content) => ({ tree: parseTree(content), errors: [], warnings: [] }),
      export: (tree) => serializeTree(tree)
    })
  }
}
