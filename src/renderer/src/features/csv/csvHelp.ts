import { csvTemplate } from '@core/io/csv/template'
import { resolveLanguage } from '@shared/i18n'
import { guideUrl } from '@shared/links'
import { toast } from '@renderer/components/ui'
import i18n from '@renderer/i18n'

/** Opens the user guide's CSV import page (in the UI language) in the default browser. */
export function openCsvFormatDocs(): void {
  window.open(guideUrl(resolveLanguage(i18n.language), 'csv-import'), '_blank', 'noopener')
}

/** Saves an empty CSV with headers in the current UI language. */
export async function saveCsvTemplate(): Promise<void> {
  const language = resolveLanguage(i18n.language)
  const name = i18n.t('csv.templateFileName' as never) as unknown as string
  const path = await window.familyInsight.saveFileDialog('csv', name)
  if (!path) return
  const result = await window.familyInsight.writeFile(path, csvTemplate(language))
  if (result.ok) {
    toast({
      message: i18n.t('csv.templateSaved' as never) as unknown as string,
      tone: 'success',
      action: {
        label: i18n.t('csv.showInFolder' as never) as unknown as string,
        onClick: () => void window.familyInsight.showInFolder(result.path)
      }
    })
  }
}
