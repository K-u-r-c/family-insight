import { create } from 'zustand'
import { alertDialog } from '@renderer/components/ui'
import i18n from '@renderer/i18n'
import { useWorkspaceUi } from '@renderer/store/workspaceUi'

export interface GedcomSource {
  path: string
  name: string
  bytes: Uint8Array
}

/** The GEDCOM file being previewed in the import dialog. */
export const useGedcomSource = create<{ source: GedcomSource | null }>(() => ({ source: null }))

const t = (key: string): string => i18n.t(key as never) as unknown as string

/** Opens a `.ged`/`.gdz` file (dialog or given path) and shows the import preview. */
export async function startGedcomImport(path?: string): Promise<void> {
  const api = window.familyInsight
  const result = path ? await api.readFile(path) : await api.openFileDialog('gedcom')
  if (!result) return
  if (!result.ok || !result.bytes) {
    await alertDialog({
      title: t('files.error.title'),
      message: t(`files.error.${result.ok ? 'unsupported' : result.error}`),
      danger: true
    })
    return
  }
  const file = result.path.split(/[\\/]/).pop() ?? result.path
  useGedcomSource.setState({
    source: { path: result.path, name: file.replace(/\.[^.]+$/, ''), bytes: result.bytes }
  })
  useWorkspaceUi.getState().openDialog('import-gedcom')
}
