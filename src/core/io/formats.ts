import { FILE_EXTENSION, parseTree, serializeTree } from '../file/format'
import { exportCsv, type CsvExportOptions } from './csv/export'
import { getFormat, registerFormat } from './registry'

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
  if (!getFormat('csv')) {
    registerFormat<Record<string, unknown>, CsvExportOptions>({
      id: 'csv',
      extensions: ['csv', 'tsv', 'txt'],
      labelKey: 'files.csvFilter',
      kind: 'interchange',
      export: (tree, options) => exportCsv(tree, options)
    })
  }
}
