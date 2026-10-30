import { create } from 'zustand'
import type { UpdateStatus } from '@shared/ipc'
import { alertDialog } from '@renderer/components/ui'
import i18n from '@renderer/i18n'
import { guardUnsaved } from '@renderer/services/documentFiles'
import { useSettings } from '@renderer/store/settings'

interface UpdatesState {
  status: UpdateStatus | null
  /** The user closed the notice for this version (until the next status change). */
  dismissed: string | null
  notesOpen: boolean
}

/** Mirror of the main process updater (status broadcasts). */
export const useUpdates = create<UpdatesState>(() => ({
  status: null,
  dismissed: null,
  notesOpen: false
}))

const t = (key: string, options?: Record<string, unknown>): string =>
  i18n.t(key as never, options as never) as unknown as string

/** Starts listening to the updater; call once at start-up. */
export function initUpdates(): () => void {
  const api = window.familyInsight
  void api.getUpdateStatus().then((status) => useUpdates.setState({ status }))
  return api.onUpdateStatus((status) => {
    const prev = useUpdates.getState().status
    // A new state brings the notice back.
    const dismissed = prev?.state === status.state ? useUpdates.getState().dismissed : null
    useUpdates.setState({ status, dismissed })
  })
}

/** "Check for updates…": shows the result in a dialog (an available update shows the notice). */
export async function checkForUpdatesManually(): Promise<void> {
  const status = await window.familyInsight.checkForUpdates()
  useUpdates.setState({ status, dismissed: null })
  if (status.state === 'not-available') {
    await alertDialog({
      title: t('updates.upToDateTitle'),
      message: t('updates.upToDate', { version: (await window.familyInsight.getAppInfo()).version })
    })
  } else if (status.state === 'error') {
    await alertDialog({
      title: t('updates.errorTitle'),
      message: t('updates.checkFailed'),
      danger: true
    })
  }
}

export function downloadUpdate(): void {
  void window.familyInsight.downloadUpdate()
}

/** Restart into the update, after the usual "save changes?" question. */
export async function restartToUpdate(): Promise<void> {
  if (!(await guardUnsaved())) return
  await window.familyInsight.installUpdate()
}

export function skipVersion(version: string): void {
  const { settings, update } = useSettings.getState()
  void update({ updates: { ...settings.updates, skippedVersion: version } })
  useUpdates.setState({ dismissed: version })
}

export function dismissUpdate(): void {
  const { status } = useUpdates.getState()
  useUpdates.setState({ dismissed: status?.version ?? status?.state ?? 'dismissed' })
}
