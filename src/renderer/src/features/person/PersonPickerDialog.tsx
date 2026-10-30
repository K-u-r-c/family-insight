import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { searchPersons } from '@core/search'
import { displayName, isLiving } from '@core/model/tree'
import type { Person, PersonId } from '@core/model/types'
import { Dialog, TextField } from '@renderer/components/ui'
import { useFormat } from '@renderer/i18n/format'
import { useDocument } from '@renderer/store/document'
import styles from './PersonPickerDialog.module.css'
import { PersonAvatar } from '@renderer/features/person/PersonAvatar'

interface PersonPickerDialogProps {
  open: boolean
  title: string
  /** People that cannot be picked (e.g. self, existing relatives). */
  exclude: Set<PersonId>
  onPick: (person: Person) => void
  onClose: () => void
}

/** Searchable list of people in the tree to link as a relative. */
export function PersonPickerDialog({
  open,
  title,
  exclude,
  onPick,
  onClose
}: PersonPickerDialogProps): React.JSX.Element | null {
  const { t } = useTranslation()
  const tree = useDocument((s) => s.tree)
  const format = useFormat()
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    if (!tree) return []
    return searchPersons(tree, query)
      .filter((p) => !exclude.has(p.id))
      .sort(
        (a, b) => format.compare(a.surname, b.surname) || format.compare(a.givenNames, b.givenNames)
      )
      .slice(0, 200)
  }, [tree, query, exclude, format])

  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <TextField
        icon={Search}
        type="search"
        label={t('common.search')}
        hideLabel
        placeholder={t('workspace.searchPlaceholder')}
        value={query}
        autoFocus
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className={styles.list} role="listbox" aria-label={title}>
        {results.length === 0 && <p className={styles.empty}>{t('relations.noMatches')}</p>}
        {results.map((p) => (
          <button
            key={p.id}
            type="button"
            role="option"
            aria-selected={false}
            className={styles.option}
            onClick={() => onPick(p)}
          >
            <PersonAvatar person={p} size={32} deceased={isLiving(p) === false} />
            <span className={styles.text}>
              <span className={styles.name}>{displayName(p) || t('person.unnamed')}</span>
              <span className={styles.meta}>{format.lifespan(p)}</span>
            </span>
          </button>
        ))}
      </div>
    </Dialog>
  )
}
