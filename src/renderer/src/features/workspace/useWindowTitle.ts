import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { selectIsDirty, useDocument } from '@renderer/store/document'

/** `• Tree name — Family Insight`; also flags the window as edited on macOS. */
export function useWindowTitle(): void {
  const { t } = useTranslation()
  const name = useDocument((s) => s.tree?.meta.name)
  const dirty = useDocument(selectIsDirty)

  useEffect(() => {
    const app = t('app.name')
    document.title = name ? `${dirty ? '• ' : ''}${name} — ${app}` : app
    void window.familyInsight.setDocumentEdited(dirty)
  }, [name, dirty, t])
}
