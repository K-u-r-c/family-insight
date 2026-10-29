import { useMemo, useRef, useState } from 'react'
import { ArrowDownUp, PanelLeftClose, SearchX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { compareFuzzyDates } from '@core/date/fuzzyDate'
import { displayName, isLiving } from '@core/model/tree'
import type { Person } from '@core/model/types'
import { matchRanges, searchPersons } from '@core/search'
import { anchorBelow, Avatar, IconButton, Menu, type MenuAnchor } from '@renderer/components/ui'
import { Panel } from '@renderer/features/workspace/Panel'
import { useFormat } from '@renderer/i18n/format'
import { cx } from '@renderer/lib/cx'
import { useDocument } from '@renderer/store/document'
import { useWorkspaceUi, type PeopleSort } from '@renderer/store/workspaceUi'
import styles from './PeopleSidebar.module.css'

const ROW_HEIGHT = 52
const OVERSCAN = 8
const SORTS: PeopleSort[] = ['surname', 'givenNames', 'birth']

function Highlighted({ text, query }: { text: string; query: string }): React.JSX.Element {
  const ranges = matchRanges(text, query)
  if (!ranges.length) return <>{text}</>
  const parts: React.ReactNode[] = []
  let last = 0
  for (const [start, end] of ranges) {
    if (start > last) parts.push(text.slice(last, start))
    parts.push(<mark key={start}>{text.slice(start, end)}</mark>)
    last = end
  }
  parts.push(text.slice(last))
  return <>{parts}</>
}

/** Searchable, sortable, virtualised list of everyone in the tree. */
export function PeopleSidebar({ onCollapse }: { onCollapse: () => void }): React.JSX.Element {
  const { t } = useTranslation()
  const format = useFormat()
  const tree = useDocument((s) => s.tree)
  const selectedId = useDocument((s) => s.selectedPersonId)
  const select = useDocument((s) => s.select)
  const query = useWorkspaceUi((s) => s.query)
  const sort = useWorkspaceUi((s) => s.sort)
  const setSort = useWorkspaceUi((s) => s.setSort)
  const [menu, setMenu] = useState<MenuAnchor | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [height, setHeight] = useState(600)
  const listRef = useRef<HTMLDivElement>(null)

  const total = tree ? Object.keys(tree.persons).length : 0
  const people = useMemo(() => {
    if (!tree) return []
    const list = searchPersons(tree, query)
    const bySurname = (a: Person, b: Person): number =>
      format.compare(a.surname, b.surname) || format.compare(a.givenNames, b.givenNames)
    const byGiven = (a: Person, b: Person): number =>
      format.compare(a.givenNames, b.givenNames) || format.compare(a.surname, b.surname)
    const byBirth = (a: Person, b: Person): number =>
      compareFuzzyDates(a.birth?.date, b.birth?.date) || bySurname(a, b)
    return list.sort(sort === 'surname' ? bySurname : sort === 'givenNames' ? byGiven : byBirth)
  }, [tree, query, sort, format])

  const first = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN)
  const last = Math.min(people.length, Math.ceil((scrollTop + height) / ROW_HEIGHT) + OVERSCAN)

  const focusRow = (index: number): void => {
    const el = listRef.current
    if (!el || index < 0 || index >= people.length) return
    const top = index * ROW_HEIGHT
    if (top < el.scrollTop) el.scrollTop = top
    else if (top + ROW_HEIGHT > el.scrollTop + el.clientHeight)
      el.scrollTop = top + ROW_HEIGHT - el.clientHeight
    requestAnimationFrame(() => el.querySelector<HTMLElement>(`[data-index="${index}"]`)?.focus())
  }

  const title = query.trim()
    ? t('people.results', { count: people.length, total })
    : `${t('people.title')} · ${total}`

  return (
    <Panel
      label={t('people.title')}
      title={title}
      actions={
        <>
          <IconButton
            icon={ArrowDownUp}
            size="sm"
            label={t('people.sort')}
            aria-haspopup="menu"
            onClick={(e) => setMenu(anchorBelow(e.currentTarget, true))}
          />
          <IconButton
            icon={PanelLeftClose}
            label={t('workspace.hideSidebar')}
            size="sm"
            onClick={onCollapse}
          />
        </>
      }
    >
      {total === 0 ? (
        <p className={styles.empty}>{t('people.empty')}</p>
      ) : people.length === 0 ? (
        <div className={styles.noResults}>
          <SearchX size={22} strokeWidth={1.5} aria-hidden="true" />
          <p>{t('people.noResults', { query })}</p>
        </div>
      ) : (
        <div
          ref={(el) => {
            listRef.current = el
            if (el && el.clientHeight && el.clientHeight !== height) setHeight(el.clientHeight)
          }}
          id="people-list"
          className={styles.list}
          role="listbox"
          aria-label={t('people.title')}
          onScroll={(e) => {
            setScrollTop(e.currentTarget.scrollTop)
            setHeight(e.currentTarget.clientHeight)
          }}
        >
          <div style={{ height: people.length * ROW_HEIGHT, position: 'relative' }}>
            {people.slice(first, last).map((person, i) => {
              const index = first + i
              const name = displayName(person) || t('person.unnamed')
              return (
                <button
                  key={person.id}
                  type="button"
                  role="option"
                  aria-selected={person.id === selectedId}
                  data-index={index}
                  tabIndex={person.id === selectedId || (!selectedId && index === 0) ? 0 : -1}
                  className={cx(styles.row, person.id === selectedId && styles.selected)}
                  style={{ transform: `translateY(${index * ROW_HEIGHT}px)` }}
                  onClick={() => select(person.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault()
                      focusRow(index + 1)
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault()
                      if (index === 0) document.getElementById('workspace-search')?.focus()
                      else focusRow(index - 1)
                    }
                  }}
                  onFocus={() => {
                    if (person.id !== selectedId) select(person.id)
                  }}
                >
                  <Avatar
                    givenNames={person.givenNames}
                    surname={person.surname}
                    sex={person.sex}
                    photo={person.photo}
                    size={32}
                    deceased={isLiving(person) === false}
                  />
                  <span className={styles.text}>
                    <span className={styles.name}>
                      <Highlighted text={name} query={query} />
                    </span>
                    <span className={styles.meta}>
                      {[
                        format.lifespan(person),
                        person.birthSurname ? t('tree.born', { surname: person.birthSurname }) : ''
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
      <Menu
        anchor={menu}
        onClose={() => setMenu(null)}
        label={t('people.sort')}
        entries={[
          { type: 'heading', label: t('people.sort') },
          ...SORTS.map((value) => ({
            label: t(`people.sortBy.${value}`),
            checked: sort === value,
            onSelect: () => setSort(value)
          }))
        ]}
      />
    </Panel>
  )
}
