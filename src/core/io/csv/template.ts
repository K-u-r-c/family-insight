import { createEmptyTree } from '../../model/tree'
import { csvDelimiterOf, type HeaderLanguage } from './columns'
import { exportCsv } from './export'

/** An empty CSV with just the header row in the language's names and Excel delimiter. */
export function csvTemplate(language: HeaderLanguage): string {
  return exportCsv(createEmptyTree('Template'), {
    headerLanguage: language,
    delimiter: csvDelimiterOf(language)
  })
}
