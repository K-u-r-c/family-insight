import { useEffect } from 'react'
import { FILE_EXTENSION } from '@core/file/format'
import { startCsvImport } from '@renderer/features/csv/importFlow'
import { handleCloseRequest, openTreeAt } from '@renderer/services/documentFiles'

/** OS-level file integration: double-click/argv opens, close guard, drag-and-drop. */
export function useFileIntegration(): void {
  useEffect(() => {
    const api = window.familyInsight
    void api.takePendingFile().then((path) => {
      if (path) void openTreeAt(path)
    })
    const offOpen = api.onOpenFileRequest((path) => void openTreeAt(path))
    const offClose = api.onCloseRequest(() => void handleCloseRequest())

    const onDragOver = (e: DragEvent): void => {
      if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
      }
    }
    const onDrop = (e: DragEvent): void => {
      const file = e.dataTransfer?.files[0]
      if (!file) return
      e.preventDefault()
      const path = api.getPathForFile(file)
      const lower = path.toLowerCase()
      if (lower.endsWith(`.${FILE_EXTENSION}`)) void openTreeAt(path)
      else if (/\.(csv|tsv|txt)$/.test(lower)) void startCsvImport(path)
    }
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('drop', onDrop)
    return () => {
      offOpen()
      offClose()
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('drop', onDrop)
    }
  }, [])
}
