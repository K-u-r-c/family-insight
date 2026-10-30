import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Home, Pencil, Sprout, Trash2, UserPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { layoutFamily, type Layout } from '@core/layout/layout'
import { searchPersons } from '@core/search'
import { displayName, getChildren, getParents, getPartners } from '@core/model/tree'
import { Button, EmptyState, Menu, type MenuAnchor, type MenuEntry } from '@renderer/components/ui'
import { deletePersonWithConfirm } from '@renderer/features/person/deletePerson'
import { addNewRelative, runCommand } from '@renderer/features/person/relationActions'
import { setRootCommand } from '@renderer/store/commands'
import { useDocument } from '@renderer/store/document'
import { useSettings } from '@renderer/store/settings'
import { navigate, type Direction } from '@core/layout/navigation'
import {
  centerViewport,
  fitViewport,
  savedViewports,
  useTreeView,
  zoomViewport
} from '@renderer/store/treeView'
import { useWorkspaceUi } from '@renderer/store/workspaceUi'
import { CanvasControls, fitAll, resetZoom, zoomBy } from './CanvasControls'
import { EdgesLayer } from './EdgesLayer'
import { Minimap } from './Minimap'
import { PersonCard } from './PersonCard'
import styles from './TreeCanvas.module.css'

const SIZES = {
  comfortable: {
    nodeWidth: 220,
    nodeHeight: 64,
    partnerGap: 28,
    siblingGap: 32,
    generationGap: 76
  },
  compact: { nodeWidth: 172, nodeHeight: 48, partnerGap: 20, siblingGap: 22, generationGap: 56 }
}

/** Switches the selected person's panel to edit mode and focuses the first field. */
export function focusEditor(): void {
  const id = useDocument.getState().selectedPersonId
  if (id) useWorkspaceUi.getState().setEditing(id)
  requestAnimationFrame(() =>
    requestAnimationFrame(() => document.getElementById('person-given-names')?.focus())
  )
}

/** Layout options for the current document and view (shared by the canvas and exports). */
export function layoutOptions(): Parameters<typeof layoutFamily>[1] | null {
  const tree = useDocument.getState().tree
  if (!tree) return null
  const { mode, depth, collapsed } = useTreeView.getState()
  const density = useSettings.getState().settings.density
  const focusId = tree.meta.rootPersonId ?? useDocument.getState().selectedPersonId ?? undefined
  return {
    ...SIZES[density],
    mode,
    depth,
    collapsed,
    focusId: mode === 'family' ? tree.meta.rootPersonId : focusId
  }
}

export function useLayout(): Layout | null {
  const tree = useDocument((s) => s.tree)
  const density = useSettings((s) => s.settings.density)
  const mode = useTreeView((s) => s.mode)
  const depth = useTreeView((s) => s.depth)
  const collapsed = useTreeView((s) => s.collapsed)
  const selected = useDocument((s) => s.selectedPersonId)
  const focusId = tree?.meta.rootPersonId ?? selected ?? undefined
  return useMemo(
    () =>
      tree
        ? layoutFamily(tree, {
            ...SIZES[density],
            mode,
            depth,
            collapsed,
            focusId: mode === 'family' ? tree.meta.rootPersonId : (focusId ?? undefined)
          })
        : null,
    [tree, density, mode, depth, collapsed, focusId]
  )
}

export function TreeCanvas({ onAddPerson }: { onAddPerson: () => void }): React.JSX.Element {
  const { t } = useTranslation()
  const tree = useDocument((s) => s.tree)!
  const selectedId = useDocument((s) => s.selectedPersonId)
  const select = useDocument((s) => s.select)
  const density = useSettings((s) => s.settings.density)
  const query = useWorkspaceUi((s) => s.query)
  const viewport = useTreeView((s) => s.viewport)
  const animate = useTreeView((s) => s.animate)
  const size = useTreeView((s) => s.size)
  const collapsed = useTreeView((s) => s.collapsed)
  const showMinimap = useSettings((s) => s.settings.showMinimap)
  const { setViewport, setSize, toggleCollapsed } = useTreeView.getState()
  const layout = useLayout()
  const ref = useRef<HTMLDivElement>(null)
  const [menu, setMenu] = useState<{ anchor: MenuAnchor; entries: MenuEntry[] } | null>(null)
  const [panning, setPanning] = useState(false)
  // Screen reader summary of the person reached with the arrow keys.
  const [announcement, setAnnouncement] = useState('')
  const describePerson = (id: string): string => {
    const names = (people: { givenNames: string; surname: string }[]): string =>
      people.map((p) => displayName(p) || t('person.unnamed')).join(', ')
    const person = tree.persons[id]
    if (!person) return ''
    const parts = [
      getParents(tree, id).length ? t('a11y.parents', { names: names(getParents(tree, id)) }) : '',
      getPartners(tree, id).length
        ? t('a11y.partners', { names: names(getPartners(tree, id)) })
        : '',
      getChildren(tree, id).length
        ? t('a11y.children', { names: names(getChildren(tree, id)) })
        : ''
    ].filter(Boolean)
    return t('a11y.selected', {
      name: displayName(person) || t('person.unnamed'),
      relatives: parts.length ? parts.join('. ') : t('a11y.noRelatives')
    })
  }

  const count = Object.keys(tree.persons).length
  const positions = useMemo(() => new Map(layout?.nodes.map((n) => [n.id, n]) ?? []), [layout])
  const matches = useMemo(
    () => (query.trim() ? new Set(searchPersons(tree, query).map((p) => p.id)) : null),
    [tree, query]
  )

  // Track the canvas size (measured immediately, then observed).
  const hasPeople = count > 0
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setSize(rect.width, rect.height)
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setSize(entry.contentRect.width, entry.contentRect.height)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [setSize, hasPeople])

  // Fit the whole tree when a document is opened (or the canvas first gets a size).
  const fittedFor = useRef<number | null>(null)
  const filePath = useDocument((s) => s.filePath)
  const docKey = useDocument((s) => s.documentId)
  useEffect(() => {
    if (!layout || !size.width || !layout.nodes.length) return
    if (fittedFor.current === docKey) return
    fittedFor.current = docKey
    const saved = filePath ? savedViewports.get(filePath) : undefined
    setViewport(
      saved ?? fitViewport({ x: 0, y: 0, width: layout.width, height: layout.height }, size)
    )
  }, [layout, size, docKey, setViewport, filePath])

  // Re-fit when the view mode or depth changes.
  const mode = useTreeView((s) => s.mode)
  const depth = useTreeView((s) => s.depth)
  const lastView = useRef(`${mode}:${depth}`)
  useEffect(() => {
    const key = `${mode}:${depth}`
    if (key === lastView.current || !layout || !size.width) return
    lastView.current = key
    setViewport(fitViewport({ x: 0, y: 0, width: layout.width, height: layout.height }, size), true)
  }, [mode, depth, layout, size, setViewport])

  // Remember where the user was looking in this file (only once it has been fitted).
  useEffect(() => {
    if (filePath && fittedFor.current === docKey) savedViewports.set(filePath, viewport)
  }, [filePath, viewport, docKey])

  // Bring the selected person into view when the selection changes.
  const lastSelected = useRef<string | null>(null)
  useEffect(() => {
    if (!selectedId || selectedId === lastSelected.current) return
    lastSelected.current = selectedId
    const node = positions.get(selectedId)
    if (!node) return
    // Wait for the details panel to open and the canvas to resize before checking.
    const timer = window.setTimeout(() => {
      const { viewport: vp, size: sz } = useTreeView.getState()
      if (!sz.width) return
      const left = node.x * vp.k + vp.x
      const top = node.y * vp.k + vp.y
      const inView =
        left > 40 &&
        top > 40 &&
        left + node.width * vp.k < sz.width - 40 &&
        top + node.height * vp.k < sz.height - 40
      if (!inView)
        setViewport(
          centerViewport({ x: node.x + node.width / 2, y: node.y + node.height / 2 }, vp, sz),
          true
        )
    }, 80)
    return () => window.clearTimeout(timer)
  }, [selectedId, positions, setViewport])

  // Wheel zoom around the cursor (non-passive so the page does not scroll).
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onWheel = (e: WheelEvent): void => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015))
      const { viewport: vp } = useTreeView.getState()
      setViewport(zoomViewport(vp, factor, { x: e.clientX - rect.left, y: e.clientY - rect.top }))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [setViewport])

  const drag = useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean } | null>(null)
  const onPointerDown = (e: React.PointerEvent): void => {
    if (e.button !== 0 && e.button !== 1) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, vx: viewport.x, vy: viewport.y, moved: false }
  }
  const onPointerMove = (e: React.PointerEvent): void => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (!d.moved && Math.hypot(dx, dy) < 3) return
    if (!d.moved) setPanning(true)
    d.moved = true
    setViewport({ ...useTreeView.getState().viewport, x: d.vx + dx, y: d.vy + dy })
  }
  const onPointerUp = (): void => {
    const d = drag.current
    drag.current = null
    setPanning(false)
    if (d && !d.moved) select(null)
  }

  // Keep a toggled (collapsed/expanded) person at the same place on screen.
  const anchor = useRef<{ id: string; x: number; y: number } | null>(null)
  const onToggleCollapse = useCallback(
    (id: string) => {
      const node = positions.get(id)
      const vp = useTreeView.getState().viewport
      if (node) anchor.current = { id, x: node.x * vp.k + vp.x, y: node.y * vp.k + vp.y }
      toggleCollapsed(id)
    },
    [positions, toggleCollapsed]
  )
  useEffect(() => {
    const a = anchor.current
    if (!a) return
    anchor.current = null
    const node = positions.get(a.id)
    if (!node) return
    const vp = useTreeView.getState().viewport
    setViewport({ k: vp.k, x: a.x - node.x * vp.k, y: a.y - node.y * vp.k })
  }, [positions, setViewport])

  const onEdit = useCallback(
    (id: string) => {
      select(id)
      focusEditor()
    },
    [select]
  )

  const onContextMenu = useCallback(
    (id: string, x: number, y: number) => {
      select(id)
      const person = useDocument.getState().tree?.persons[id]
      if (!person) return
      const isRoot = useDocument.getState().tree?.meta.rootPersonId === id
      setMenu({
        anchor: { x, y },
        entries: [
          { label: t('common.edit'), icon: Pencil, shortcut: 'Enter', onSelect: () => onEdit(id) },
          { type: 'separator' },
          { type: 'heading', label: t('tree.addRelative') },
          ...(['father', 'mother', 'partner', 'child', 'sibling'] as const).map((role) => ({
            label: t(`relations.add.${role}`),
            icon: UserPlus,
            onSelect: () => void addNewRelative(person, role).then(focusEditor)
          })),
          { type: 'separator' },
          {
            label: isRoot ? t('tree.unsetRoot') : t('tree.setRoot'),
            icon: Home,
            onSelect: () => void runCommand(setRootCommand(isRoot ? undefined : id))
          },
          {
            label: t('person.delete'),
            icon: Trash2,
            danger: true,
            shortcut: 'Del',
            onSelect: () => void deletePersonWithConfirm(id)
          }
        ]
      })
    },
    [select, t, onEdit]
  )

  const ARROWS: Record<string, Direction> = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right'
  }
  const onKeyDown = (e: React.KeyboardEvent): void => {
    if (e.target !== e.currentTarget && !(e.target as HTMLElement).closest('[data-person-id]'))
      return
    if (e.ctrlKey || e.metaKey || e.altKey) return
    const direction = ARROWS[e.key]
    if (direction && layout) {
      e.preventDefault()
      const current = useDocument.getState().selectedPersonId
      const next = current
        ? navigate(tree, layout, current, direction)
        : (tree.meta.rootPersonId ?? layout.nodes[0]?.id ?? null)
      if (next) {
        select(next)
        setAnnouncement(describePerson(next))
        requestAnimationFrame(() =>
          ref.current
            ?.querySelector<HTMLElement>(`[data-person-id="${CSS.escape(next)}"] button`)
            ?.focus()
        )
      }
      return
    }
    if (e.key === 'Enter' && selectedId) {
      e.preventDefault()
      focusEditor()
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault()
      fitAll(layout)
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault()
      zoomBy(1.25)
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault()
      zoomBy(1 / 1.25)
    } else if (e.key === '0') {
      e.preventDefault()
      resetZoom()
    } else if (e.key === 'Escape') {
      select(null)
    }
  }

  // Only render cards inside (or near) the visible area.
  const visible = useMemo(() => {
    if (!layout) return []
    if (!size.width) return layout.nodes
    const margin = 300
    const x0 = (-viewport.x - margin) / viewport.k
    const y0 = (-viewport.y - margin) / viewport.k
    const x1 = (size.width - viewport.x + margin) / viewport.k
    const y1 = (size.height - viewport.y + margin) / viewport.k
    return layout.nodes.filter(
      (n) => n.x + n.width > x0 && n.x < x1 && n.y + n.height > y0 && n.y < y1
    )
  }, [layout, viewport, size])

  const bounds = useMemo(() => {
    if (!layout || !layout.nodes.length) return { minX: 0, minY: 0, width: 1, height: 1 }
    const pad = 40
    return {
      minX: -pad,
      minY: -pad,
      width: layout.width + pad * 2,
      height: layout.height + pad * 2
    }
  }, [layout])

  if (count === 0) {
    return (
      <div className={styles.canvas}>
        <EmptyState
          icon={Sprout}
          title={t('tree.emptyTitle')}
          description={t('tree.emptyText')}
          action={
            <Button variant="primary" size="lg" icon={UserPlus} onClick={onAddPerson}>
              {t('tree.addFirst')}
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className={styles.canvas}
      data-panning={panning || undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="application"
      aria-label={t('tree.canvasLabel')}
      aria-roledescription={t('tree.canvasRole')}
      tabIndex={0}
      onKeyDown={onKeyDown}
      style={{
        backgroundPosition: `${viewport.x}px ${viewport.y}px`,
        backgroundSize: `${22 * viewport.k}px ${22 * viewport.k}px`
      }}
    >
      <div
        className={styles.world}
        data-animate={animate || undefined}
        style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.k})` }}
      >
        {layout && (
          <EdgesLayer
            edges={layout.edges}
            bounds={bounds}
            highlight={selectedId}
            dimmed={matches !== null}
          />
        )}
        {visible.map((node) => {
          const person = tree.persons[node.id]!
          return (
            <PersonCard
              key={node.id}
              person={person}
              node={node}
              compact={density === 'compact'}
              selected={node.id === selectedId}
              root={node.id === tree.meta.rootPersonId}
              match={matches?.has(node.id) ?? false}
              dimmed={matches !== null && !matches.has(node.id)}
              collapsed={collapsed.has(node.id)}
              canCollapse={mode !== 'ancestors'}
              onSelect={select}
              onEdit={onEdit}
              onContextMenu={onContextMenu}
              onToggleCollapse={onToggleCollapse}
            />
          )
        })}
      </div>
      {showMinimap && layout && layout.nodes.length > 1 && <Minimap layout={layout} />}
      <CanvasControls layout={layout} />
      <div className="visually-hidden" aria-live="polite" role="status">
        {announcement}
      </div>
      <Menu
        anchor={menu?.anchor ?? null}
        entries={menu?.entries ?? []}
        onClose={() => setMenu(null)}
      />
    </div>
  )
}
