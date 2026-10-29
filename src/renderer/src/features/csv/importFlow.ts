import { create } from 'zustand'
import { alertDialog } from '@renderer/components/ui'
import i18n from '@renderer/i18n'
import { useWorkspaceUi } from '@renderer/store/workspaceUi'

export interface ImportSource {
  path: string
  name: string
  content: string
  encoding: 'utf-8' | 'windows-1250'
}

/** The CSV file being previewed in the import dialog. */
export const useImportSource = create<{ source: ImportSource | null }>(() => ({ source: null }))

const t = (key: string): string => i18n.t(key as never) as unknown as string

function baseName(path: string): string {
  const file = path.split(/[\\/]/).pop() ?? path
  return file.replace(/\.[^.]+$/, '')
}

/** Opens a CSV file (dialog or given path) and shows the import preview. */
export async function startCsvImport(path?: string): Promise<void> {
  const api = window.familyInsight
  const result = path ? await api.readFile(path) : await api.openFileDialog('csv')
  if (!result) return
  if (!result.ok) {
    await alertDialog({
      title: t('files.error.title'),
      message: t(`files.error.${result.error}`),
      danger: true
    })
    return
  }
  useImportSource.setState({
    source: {
      path: result.path,
      name: baseName(result.path),
      content: result.content,
      encoding: result.encoding
    }
  })
  useWorkspaceUi.getState().openDialog('import-csv')
}
