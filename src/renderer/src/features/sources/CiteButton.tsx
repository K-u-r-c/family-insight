import { BookMarked } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getCitations, type CitationTarget } from '@core/model/sources'
import { Icon } from '@renderer/components/ui'
import { useDocument } from '@renderer/store/document'
import { useWorkspaceUi } from '@renderer/store/workspaceUi'
import { factLabel } from './facts'
import styles from './Sources.module.css'

/** Small "cite" button next to a fact; shows how many sources it has and opens the citations. */
export function CiteButton({ target }: { target: CitationTarget }): React.JSX.Element | null {
  const { t } = useTranslation()
  const tree = useDocument((s) => s.tree)
  if (!tree) return null
  const count = getCitations(tree, target).length
  const fact = factLabel(tree, target, t as never)
  return (
    <button
      type="button"
      className={styles.cite}
      data-cited={count > 0 || undefined}
      title={t('sources.citeTitle', { fact })}
      aria-label={t('sources.citeLabel', { fact, count })}
      onClick={() => useWorkspaceUi.getState().setCiting(target)}
    >
      <Icon icon={BookMarked} size={13} />
      {count > 0 && <span>{count}</span>}
    </button>
  )
}
