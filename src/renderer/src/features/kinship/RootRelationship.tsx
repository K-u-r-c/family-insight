import { Home } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Person } from '@core/model/types'
import { resolveLanguage } from '@shared/i18n'
import { Icon } from '@renderer/components/ui'
import { useDocument } from '@renderer/store/document'
import { useWorkspaceUi } from '@renderer/store/workspaceUi'
import { capitalize, useRelationships } from './useRelationships'
import styles from './RootRelationship.module.css'

/** "The nephew of Piotr Kowalski": how a person is related to the root person (opens the calculator). */
export function RootRelationship({ person }: { person: Person }): React.JSX.Element | null {
  const { t, i18n } = useTranslation()
  const rootId = useDocument((s) => s.tree?.meta.rootPersonId) ?? null
  const isRoot = rootId === person.id
  const [first] = useRelationships(isRoot ? null : rootId, person.id)
  if (!rootId || isRoot || !first) return null
  const text = first.phrase
    ? capitalize(first.phrase, resolveLanguage(i18n.language))
    : first.sentence
  return (
    <button
      type="button"
      className={styles.relation}
      title={t('kinship.toRoot')}
      onClick={() => useWorkspaceUi.getState().openRelationship(rootId, person.id)}
    >
      <Icon icon={Home} size={12} />
      <span>{text}</span>
    </button>
  )
}
