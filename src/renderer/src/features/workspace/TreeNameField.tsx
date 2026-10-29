import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDocument } from '@renderer/store/document'
import styles from './Toolbar.module.css'

/** The tree name, editable in place (click, type, Enter/Esc). */
export function TreeNameField(): React.JSX.Element | null {
  const { t } = useTranslation()
  const name = useDocument((s) => s.tree?.meta.name)
  const rename = useDocument((s) => s.rename)
  const [draft, setDraft] = useState<string | null>(null)
  if (name === undefined) return null

  if (draft === null) {
    return (
      <button
        type="button"
        className={styles.nameButton}
        title={t('workspace.renameTree')}
        aria-label={`${t('workspace.treeName')}: ${name}`}
        onClick={() => setDraft(name)}
      >
        {name}
      </button>
    )
  }
  const commit = (): void => {
    rename(draft)
    setDraft(null)
  }
  return (
    <input
      className={styles.nameInput}
      aria-label={t('workspace.treeName')}
      value={draft}
      autoFocus
      maxLength={120}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit()
        if (e.key === 'Escape') setDraft(null)
      }}
    />
  )
}
