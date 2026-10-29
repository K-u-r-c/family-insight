import { FILE_EXTENSION, parseTree, serializeTree } from '../file/format'
import { exportCsv, type CsvExportOptions } from './csv/export'
import { importCsv, type CsvImportOptions } from './csv/import'
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
    registerFormat<CsvImportOptions, CsvExportOptions>({
      id: 'csv',
      extensions: ['csv', 'tsv', 'txt'],
      labelKey: 'files.csvFilter',
      kind: 'interchange',
      import: (content, options) => importCsv(content, options),
      export: (tree, options) => exportCsv(tree, options)
    })
  }
}
