import { createEmptyTree } from '../../model/tree'
import type { HeaderLanguage } from './columns'
import { exportCsv } from './export'

/** An empty CSV with just the header row: `;` and Polish names for Polish, `,` otherwise. */
export function csvTemplate(language: HeaderLanguage): string {
  return exportCsv(createEmptyTree('Template'), {
    headerLanguage: language,
    delimiter: language === 'pl' ? ';' : ','
  })
}
