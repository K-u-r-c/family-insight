import { memo } from 'react'
import { Home, Minus, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { LayoutNode } from '@core/layout/layout'
import { displayName, isLiving } from '@core/model/tree'
import type { Person } from '@core/model/types'
import { Icon } from '@renderer/components/ui'
import { useFormat } from '@renderer/i18n/format'
import { cx } from '@renderer/lib/cx'
import styles from './PersonCard.module.css'
import { PersonAvatar } from '@renderer/features/person/PersonAvatar'

interface PersonCardProps {
  person: Person
  node: LayoutNode
  compact: boolean
  selected: boolean
  root: boolean
  match: boolean
  dimmed: boolean
  collapsed: boolean
  /** Collapsing branches makes sense in this view mode. */
  canCollapse: boolean
  onSelect: (id: string) => void
  onEdit: (id: string) => void
  onContextMenu: (id: string, x: number, y: number) => void
  onToggleCollapse: (id: string) => void
}

export const PersonCard = memo(function PersonCard({
  person,
  node,
  compact,
  selected,
  root,
  match,
  dimmed,
  collapsed,
  canCollapse,
  onSelect,
  onEdit,
  onContextMenu,
  onToggleCollapse
}: PersonCardProps): React.JSX.Element {
  const { t } = useTranslation()
  const format = useFormat()
  const name = displayName(person) || t('person.unnamed')
  const deceased = isLiving(person) === false
  const lifespan = format.lifespan(person)
  const born = person.birthSurname ? t('tree.born', { surname: person.birthSurname }) : ''
  // Collapse a visible branch, or expand a collapsed one (not children hidden by depth).
  const showToggle = canCollapse && (collapsed || (node.hasChildren && !node.hasHiddenChildren))

  return (
    <div
      className={cx(styles.wrap, dimmed && styles.dimmed)}
      style={{
        transform: `translate(${node.x}px, ${node.y}px)`,
        width: node.width,
        height: node.height
      }}
      data-person-id={person.id}
    >
      <button
        type="button"
        className={cx(
          styles.card,
          styles[person.sex],
          compact && styles.compact,
          selected && styles.selected,
          match && styles.match,
          deceased && styles.deceased
        )}
        aria-pressed={selected}
        aria-label={[name, lifespan, born].filter(Boolean).join(', ')}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(person.id)
        }}
        onDoubleClick={(e) => {
          e.stopPropagation()
          onEdit(person.id)
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onContextMenu(person.id, e.clientX, e.clientY)
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <PersonAvatar person={person} size={compact ? 30 : 40} deceased={deceased} />
        <span className={styles.text}>
          <span className={styles.name}>{name}</span>
          {(lifespan || born) && (
            <span className={styles.meta}>
              {lifespan}
              {deceased && lifespan && <span className={styles.cross}> †</span>}
              {born && !compact && (
                <span className={styles.born}>{lifespan ? ` · ${born}` : born}</span>
              )}
            </span>
          )}
        </span>
        {root && (
          <span className={styles.rootBadge} title={t('tree.rootPerson')}>
            <Icon icon={Home} size={11} />
          </span>
        )}
      </button>
      {showToggle && (
        <button
          type="button"
          className={cx(styles.toggle, collapsed && styles.toggleCollapsed)}
          aria-label={collapsed ? t('tree.expand', { name }) : t('tree.collapse', { name })}
          title={collapsed ? t('tree.expand', { name }) : t('tree.collapse', { name })}
          onClick={(e) => {
            e.stopPropagation()
            onToggleCollapse(person.id)
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Icon icon={collapsed ? Plus : Minus} size={12} />
        </button>
      )}
    </div>
  )
})
