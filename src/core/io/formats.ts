import { FILE_EXTENSION, parseTree, serializeTree } from '../file/format'
import { exportCsv, type CsvExportOptions } from './csv/export'
import { importCsv, type CsvImportOptions } from './csv/import'
import { exportGedcom, type GedcomExportOptions } from './gedcom/export'
import { importGedcom } from './gedcom/import'
import { parseGedcom } from './gedcom/parser'
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
  if (!getFormat('gedcom')) {
    registerFormat<Record<string, never>, GedcomExportOptions>({
      id: 'gedcom',
      extensions: ['ged', 'gdz'],
      labelKey: 'files.gedcomFilter',
      kind: 'interchange',
      // The app decodes bytes itself (`decodeGedcom`, GEDZIP); this takes decoded text.
      import: (content) => {
        const result = importGedcom(parseGedcom(content))
        return { tree: result.tree, errors: [], warnings: result.warnings }
      },
      export: (tree, options) => exportGedcom(tree, options).text
    })
  }
}
