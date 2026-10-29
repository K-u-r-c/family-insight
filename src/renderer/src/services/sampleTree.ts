import { importCsv } from '@core/io/csv/import'
import { resolveLanguage } from '@shared/i18n'
import i18n from '@renderer/i18n'
import { guardUnsaved } from '@renderer/services/documentFiles'
import { useDocument } from '@renderer/store/document'
import sampleEn from '../../../../resources/samples/example-en.csv?raw'
import samplePl from '../../../../resources/samples/example-pl.csv?raw'

/** Opens the bundled demo family (in the UI language) as an untitled document. */
export async function openSampleTree(): Promise<void> {
  if (!(await guardUnsaved())) return
  const language = resolveLanguage(i18n.language)
  const name = i18n.t('welcome.sampleName' as never) as unknown as string
  const { tree } = importCsv(language === 'pl' ? samplePl : sampleEn, { name })
  const root = Object.values(tree.persons).find(
    (p) => p.givenNames === 'Jan' && p.surname === 'Kowalski'
  )
  if (root) tree.meta.rootPersonId = root.id
  useDocument.getState().loadDocument(tree, null)
}
