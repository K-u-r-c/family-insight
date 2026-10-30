import { csvTemplate } from '@core/io/csv/template'
import { resolveLanguage } from '@shared/i18n'
import { toast } from '@renderer/components/ui'
import i18n from '@renderer/i18n'

export const CSV_FORMAT_URL =
  'https://github.com/K-u-r-c/family-insight/blob/main/docs/developer/reference/csv-format.md'

/** Opens the CSV format documentation in the default browser. */
export function openCsvFormatDocs(): void {
  window.open(CSV_FORMAT_URL, '_blank', 'noopener')
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
