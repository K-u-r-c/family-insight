import { useId, useMemo, useState } from 'react'
import { Link2, MoreHorizontal, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  displayName,
  getChildLinks,
  getParentLinks,
  getPartnerships,
  getSiblingGroups,
  isLiving,
  otherPartner
} from '@core/model/tree'
import type {
  ParentChildKind,
  ParentChildRelationship,
  PartnershipRelationship,
  Person,
  PersonId
} from '@core/model/types'
import { compareFuzzyDates } from '@core/date/fuzzyDate'
import {
  anchorBelow,
  Avatar,
  Button,
  IconButton,
  Menu,
  type MenuAnchor,
  type MenuEntry
} from '@renderer/components/ui'
import { useFormat } from '@renderer/i18n/format'
import { updateRelationshipCommand } from '@renderer/store/commands'
import { useDocument } from '@renderer/store/document'
import { PartnershipDialog } from './PartnershipDialog'
import { PersonPickerDialog } from './PersonPickerDialog'
import {
  addNewRelative,
  linkExistingRelative,
  removeRelationshipWithUndo,
  runCommand,
  type Role
} from './relationActions'
import styles from './FamilySection.module.css'

const KINDS: ParentChildKind[] = ['biological', 'adoptive', 'step', 'foster']

interface Row {
  person: Person
  detail?: string
  link?: ParentChildRelationship | PartnershipRelationship
}

function RelativeRow({
  row,
  onMenu
}: {
  row: Row
  onMenu?: (anchor: MenuAnchor) => void
}): React.JSX.Element {
  const { t } = useTranslation()
  const select = useDocument((s) => s.select)
  const format = useFormat()
  const { person } = row
  const name = displayName(person) || t('person.unnamed')
  const meta = [format.lifespan(person), row.detail].filter(Boolean).join(' · ')
  const metaId = useId()
  return (
    <li className={styles.row}>
      <button
        type="button"
        className={styles.person}
        onClick={() => select(person.id)}
        title={t('relations.goTo', { name })}
        aria-label={name}
        aria-describedby={meta ? metaId : undefined}
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
          <span className={styles.name}>{name}</span>
          {meta && (
            <span id={metaId} className={styles.meta}>
              {meta}
            </span>
          )}
        </span>
      </button>
      {onMenu && (
        <IconButton
          icon={MoreHorizontal}
          size="sm"
          label={t('relations.options', { name })}
          onClick={(e) => onMenu(anchorBelow(e.currentTarget, true))}
        />
      )}
    </li>
  )
}

interface GroupProps {
  title: string
  rows: Row[]
  actions: { role: Role; label: string; disabled?: boolean; hint?: string }[]
  linkRole: Role
  person: Person
  onRowMenu?: (row: Row, anchor: MenuAnchor) => void
  onLink: (role: Role) => void
  note?: string
}

function Group({
  title,
  rows,
  actions,
  linkRole,
  person,
  onRowMenu,
  onLink,
  note
}: GroupProps): React.JSX.Element {
  const { t } = useTranslation()
  return (
    <section className={styles.group}>
      <div className={styles.groupHeader}>
        <h4 className={styles.groupTitle}>{title}</h4>
        <IconButton
          icon={Link2}
          size="sm"
          label={t('relations.linkExisting')}
          onClick={() => onLink(linkRole)}
        />
      </div>
      {rows.length > 0 && (
        <ul className={styles.rows}>
          {rows.map((row) => (
            <RelativeRow
              key={row.person.id + (row.link?.id ?? '')}
              row={row}
              onMenu={onRowMenu ? (a) => onRowMenu(row, a) : undefined}
            />
          ))}
        </ul>
      )}
      <div className={styles.actions}>
        {actions.map((a) => (
          <Button
            key={a.role}
            size="sm"
            variant="ghost"
            icon={Plus}
            disabled={a.disabled}
            title={a.hint}
            onClick={() => void addNewRelative(person, a.role)}
          >
            {a.label}
          </Button>
        ))}
      </div>
      {note && <p className={styles.note}>{note}</p>}
    </section>
  )
}

/** Parents, partners, children and siblings with quick actions to grow the tree. */
export function FamilySection({ person }: { person: Person }): React.JSX.Element {
  const { t } = useTranslation()
  const tree = useDocument((s) => s.tree)!
  const format = useFormat()
  const [menu, setMenu] = useState<{ anchor: MenuAnchor; entries: MenuEntry[] } | null>(null)
  const [picker, setPicker] = useState<Role | null>(null)
  const [editing, setEditing] = useState<string | null>(null)

  const data = useMemo(() => {
    const byBirth = (a: Row, b: Row): number =>
      compareFuzzyDates(a.person.birth?.date, b.person.birth?.date)
    const kindLabel = (kind: ParentChildKind): string | undefined =>
      kind === 'biological' ? undefined : t(`relations.kind.${kind}`)
    const parents: Row[] = getParentLinks(tree, person.id).map((link) => ({
      person: tree.persons[link.parentId]!,
      link,
      detail: kindLabel(link.kind)
    }))
    const partners: Row[] = getPartnerships(tree, person.id)
      .map((link) => {
        const start = link.start?.date ? format.date(link.start.date) : ''
        const end = link.end?.date
          ? t('relations.until', { date: format.date(link.end.date) })
          : link.end?.reason
            ? t(`relations.reason.${link.end.reason}`).toLocaleLowerCase()
            : link.end
              ? t('relations.ended')
              : ''
        const detail = [
          [t(`relations.partnership.${link.kind}`), start].filter(Boolean).join(' '),
          end
        ]
          .filter(Boolean)
          .join(', ')
        return { person: tree.persons[otherPartner(link, person.id)]!, link, detail }
      })
      .sort((a, b) =>
        compareFuzzyDates(
          (a.link as PartnershipRelationship).start?.date,
          (b.link as PartnershipRelationship).start?.date
        )
      )
    const children: Row[] = getChildLinks(tree, person.id)
      .map((link) => ({ person: tree.persons[link.childId]!, link, detail: kindLabel(link.kind) }))
      .sort(byBirth)
    const groups = getSiblingGroups(tree, person.id)
    const siblings: Row[] = [
      ...groups.full.map((p) => ({ person: p })),
      ...groups.half.map((p) => ({ person: p, detail: t('relations.halfSibling') }))
    ].sort(byBirth)
    const bioParents = parents.filter(
      (p) => (p.link as ParentChildRelationship).kind === 'biological'
    )
    return { parents, partners, children, siblings, bioParents }
  }, [tree, person.id, t, format])

  const exclude = useMemo(() => {
    const ids = new Set<PersonId>([person.id])
    const rows =
      picker === 'parent'
        ? data.parents
        : picker === 'partner'
          ? data.partners
          : picker === 'child'
            ? data.children
            : data.siblings
    for (const r of rows) ids.add(r.person.id)
    return ids
  }, [person.id, picker, data])

  const parentMenu = (row: Row, anchor: MenuAnchor): void => {
    const link = row.link as ParentChildRelationship
    setMenu({
      anchor,
      entries: [
        { type: 'heading', label: t('relations.kindLabel') },
        ...KINDS.map((kind) => ({
          label: t(`relations.kind.${kind}`),
          checked: link.kind === kind,
          onSelect: () => void runCommand(updateRelationshipCommand(link.id, { kind }))
        })),
        { type: 'separator' },
        {
          label: t('relations.removeLink'),
          danger: true,
          onSelect: () => removeRelationshipWithUndo(link.id)
        }
      ]
    })
  }
  const partnerMenu = (row: Row, anchor: MenuAnchor): void => {
    const link = row.link as PartnershipRelationship
    setMenu({
      anchor,
      entries: [
        { label: t('relations.editPartnership'), onSelect: () => setEditing(link.id) },
        { type: 'separator' },
        {
          label: t('relations.removeLink'),
          danger: true,
          onSelect: () => removeRelationshipWithUndo(link.id)
        }
      ]
    })
  }

  const missingFather =
    !data.bioParents.some((p) => p.person.sex === 'male') && data.bioParents.length < 2
  const missingMother =
    !data.bioParents.some((p) => p.person.sex === 'female') && data.bioParents.length < 2
  const noParents = data.parents.length === 0

  return (
    <div className={styles.family}>
      <Group
        title={t('relations.parents')}
        rows={data.parents}
        person={person}
        linkRole="parent"
        onLink={setPicker}
        onRowMenu={parentMenu}
        actions={[
          ...(missingFather ? [{ role: 'father' as const, label: t('relations.add.father') }] : []),
          ...(missingMother ? [{ role: 'mother' as const, label: t('relations.add.mother') }] : []),
          ...(!missingFather && !missingMother
            ? [{ role: 'parent' as const, label: t('relations.add.parent') }]
            : [])
        ]}
      />
      <Group
        title={t('relations.partners')}
        rows={data.partners}
        person={person}
        linkRole="partner"
        onLink={setPicker}
        onRowMenu={partnerMenu}
        actions={[{ role: 'partner', label: t('relations.add.partner') }]}
      />
      <Group
        title={t('relations.children')}
        rows={data.children}
        person={person}
        linkRole="child"
        onLink={setPicker}
        onRowMenu={parentMenu}
        actions={[{ role: 'child', label: t('relations.add.child') }]}
      />
      <Group
        title={t('relations.siblings')}
        rows={data.siblings}
        person={person}
        linkRole="sibling"
        onLink={setPicker}
        actions={[
          {
            role: 'sibling',
            label: t('relations.add.sibling'),
            disabled: noParents,
            hint: noParents ? t('relations.siblingNeedsParent') : undefined
          }
        ]}
        note={noParents ? t('relations.siblingNeedsParent') : undefined}
      />

      <Menu
        anchor={menu?.anchor ?? null}
        entries={menu?.entries ?? []}
        onClose={() => setMenu(null)}
      />
      <PersonPickerDialog
        open={picker !== null}
        title={picker ? t(`relations.linkAs.${picker}`) : ''}
        exclude={exclude}
        onClose={() => setPicker(null)}
        onPick={(other) => {
          const role = picker!
          setPicker(null)
          void linkExistingRelative(person, role, other)
        }}
      />
      {editing && <PartnershipDialog relationshipId={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
