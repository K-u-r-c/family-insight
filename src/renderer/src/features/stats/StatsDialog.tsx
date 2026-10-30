import { useMemo } from 'react'
import { BarChart3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { displayName } from '@core/model/tree'
import { computeStats, type CountItem } from '@core/stats'
import { Dialog } from '@renderer/components/ui'
import { useFormat } from '@renderer/i18n/format'
import { useDocument } from '@renderer/store/document'
import { useWorkspaceUi } from '@renderer/store/workspaceUi'
import styles from './StatsDialog.module.css'

const TODO_LIMIT = 8

function Tile({ value, label }: { value: string; label: string }): React.JSX.Element {
  return (
    <div className={styles.tile}>
      <span className={styles.tileValue}>{value}</span>
      <span className={styles.tileLabel}>{label}</span>
    </div>
  )
}

function BarContent({
  label,
  count,
  max
}: {
  label: string
  count: number
  max: number
}): React.JSX.Element {
  return (
    <>
      <span className={styles.barLabel}>{label}</span>
      <span className={styles.track} aria-hidden="true">
        <span className={styles.fill} style={{ width: `${(count / max) * 100}%` }} />
      </span>
      <span className={styles.barValue}>{count}</span>
    </>
  )
}

/** Horizontal bars, one hue (magnitude), counts labelled directly; click filters the tree. */
function BarList({
  title,
  items,
  onPick,
  labelOf = (label) => label
}: {
  title: string
  items: CountItem[]
  /** Click a bar to search for it; without it the bars are not interactive. */
  onPick?: (label: string) => void
  labelOf?: (label: string) => string
}): React.JSX.Element {
  const { t } = useTranslation()
  const max = Math.max(1, ...items.map((i) => i.count))
  return (
    <section className={styles.card}>
      <h3 className={styles.cardTitle}>{title}</h3>
      {items.length === 0 ? (
        <p className={styles.empty}>{t('stats.noData')}</p>
      ) : (
        <ol className={styles.bars}>
          {items.map((item) => (
            <li key={item.label}>
              {onPick ? (
                <button
                  type="button"
                  className={styles.bar}
                  title={t('stats.barTooltip', { label: labelOf(item.label), count: item.count })}
                  onClick={() => onPick(item.label)}
                >
                  <BarContent label={labelOf(item.label)} count={item.count} max={max} />
                </button>
              ) : (
                <div className={styles.bar}>
                  <BarContent label={labelOf(item.label)} count={item.count} max={max} />
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export function StatsDialog({ onClose }: { onClose: () => void }): React.JSX.Element | null {
  const { t } = useTranslation()
  const format = useFormat()
  const tree = useDocument((s) => s.tree)
  const select = useDocument((s) => s.select)
  const setQuery = useWorkspaceUi((s) => s.setQuery)
  const stats = useMemo(
    () => (tree ? computeStats(tree, { language: format.language }) : null),
    [tree, format.language]
  )
  if (!tree || !stats) return null

  const pick = (label: string): void => {
    setQuery(label)
    onClose()
  }
  const goTo = (id: string): void => {
    select(id)
    onClose()
  }
  const name = (id: string): string => displayName(tree.persons[id]!) || t('person.unnamed')
  const todo = [
    ...stats.missingDates.map((id) => ({ id, reason: t('stats.noDates') })),
    ...stats.missingParents
      .filter((id) => !stats.missingDates.includes(id))
      .map((id) => ({ id, reason: t('stats.noParents') }))
  ]

  return (
    <Dialog
      open
      wide
      onClose={onClose}
      icon={BarChart3}
      title={t('stats.title')}
      description={tree.meta.name}
    >
      <div className={styles.body}>
        <div className={styles.tiles}>
          <Tile
            value={format.number(stats.people)}
            label={t('stats.people', { count: stats.people })}
          />
          <Tile value={format.number(stats.living)} label={t('stats.living')} />
          <Tile value={format.number(stats.deceased)} label={t('stats.deceased')} />
          <Tile
            value={format.number(stats.generations)}
            label={t('stats.generations', { count: stats.generations })}
          />
          <Tile
            value={stats.averageLifespan === null ? '—' : format.number(stats.averageLifespan)}
            label={t('stats.averageLifespan')}
          />
        </div>
        {stats.longestLived && (
          <p className={styles.note}>
            {t('stats.longestLived', {
              name: name(stats.longestLived.personId),
              count: stats.longestLived.years
            })}{' '}
            <button
              type="button"
              className={styles.link}
              onClick={() => goTo(stats.longestLived!.personId)}
            >
              {t('stats.show')}
            </button>
          </p>
        )}
        <div className={styles.grid}>
          <BarList title={t('stats.givenNames')} items={stats.givenNames} onPick={pick} />
          <BarList title={t('stats.surnames')} items={stats.surnames} onPick={pick} />
          <BarList title={t('stats.birthPlaces')} items={stats.birthPlaces} onPick={pick} />
          <BarList
            title={t('stats.eventTypes')}
            items={stats.eventTypes}
            labelOf={(type) => t(`events.type.${type}` as never) as unknown as string}
          />
          <BarList title={t('stats.eventPlaces')} items={stats.eventPlaces} onPick={pick} />
        </div>
        <p className={styles.note}>
          {t('stats.withoutEvents', { count: stats.withoutEvents.length })}
        </p>
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>{t('stats.todo', { count: todo.length })}</h3>
          {todo.length === 0 ? (
            <p className={styles.empty}>{t('stats.todoDone')}</p>
          ) : (
            <ul className={styles.todo}>
              {todo.slice(0, TODO_LIMIT).map((item) => (
                <li key={item.id}>
                  <button type="button" className={styles.link} onClick={() => goTo(item.id)}>
                    {name(item.id)}
                  </button>
                  <span className={styles.reason}>{item.reason}</span>
                </li>
              ))}
              {todo.length > TODO_LIMIT && (
                <li className={styles.reason}>
                  {t('csv.more', { count: todo.length - TODO_LIMIT })}
                </li>
              )}
            </ul>
          )}
        </section>
      </div>
    </Dialog>
  )
}
