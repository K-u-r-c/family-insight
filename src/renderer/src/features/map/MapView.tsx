import { useCallback, useMemo, useRef, useState } from 'react'
import { Globe, ImageDown, MapPin, MapPinOff, Route } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Hint } from '@renderer/features/hints/Hint'
import {
  filterFacts,
  generations,
  groupByPlace,
  MAP_KINDS,
  mapFacts,
  markerGeneration,
  migrationPath,
  unlocatedPlaces,
  yearRange,
  type MapFact,
  type MapKind,
  type MapMarker
} from '@core/mapData'
import { displayName } from '@core/model/tree'
import { Button, confirm, toast } from '@renderer/components/ui'
import { cx } from '@renderer/lib/cx'
import { useFormat } from '@renderer/i18n/format'
import { useDocument } from '@renderer/store/document'
import { useSettings } from '@renderer/store/settings'
import { useWorkspaceUi } from '@renderer/store/workspaceUi'
import { eventName } from '@renderer/features/person/eventTypes'
import { LeafletMap } from './LeafletMap'
import styles from './Map.module.css'

const GENERATION_CLASS: Record<string, string> = {
  '-3': 'm3',
  '-2': 'm2',
  '-1': 'm1',
  '0': 'g0',
  '1': 'p1',
  '2': 'p2',
  '3': 'p3'
}
const genClass = (g: number | undefined): string =>
  g === undefined ? styles.none! : styles[GENERATION_CLASS[String(Math.max(-3, Math.min(3, g)))]!]!

/** Asks before map tiles are loaded from the internet the first time. */
async function allowOnlineMaps(t: (key: string) => string): Promise<boolean> {
  const ok = await confirm({
    title: t('map.consentTitle'),
    message: t('map.consentText'),
    confirmLabel: t('map.consentAllow')
  })
  if (ok) await useSettings.getState().update({ onlineMaps: true })
  return ok
}

/** Map of the tree's places: markers by place, filters, a person's path, places to locate. */
export default function MapView(): React.JSX.Element | null {
  const { t } = useTranslation()
  const format = useFormat()
  const tree = useDocument((s) => s.tree)
  const selectedId = useDocument((s) => s.selectedPersonId)
  const onlineMaps = useSettings((s) => s.settings.onlineMaps)
  const [kinds, setKinds] = useState<Set<MapKind>>(() => new Set(MAP_KINDS))
  const [period, setPeriod] = useState<{ from?: number; to?: number }>({})
  const [placeKey, setPlaceKey] = useState<string | null>(null)
  const [tileError, setTileError] = useState(false)
  const stage = useRef<HTMLDivElement>(null)
  const tt = (key: string): string => t(key as never) as unknown as string

  const facts = useMemo(() => (tree ? mapFacts(tree) : []), [tree])
  const range = useMemo(() => yearRange(facts), [facts])
  const gens = useMemo(
    () => (tree ? generations(tree, tree.meta.rootPersonId ?? selectedId ?? undefined) : new Map()),
    [tree, selectedId]
  )
  const filtered = useMemo(
    () => filterFacts(facts, { kinds, from: period.from, to: period.to }),
    [facts, kinds, period]
  )
  const markers = useMemo(() => groupByPlace(filtered), [filtered])
  const path = useMemo(
    () =>
      selectedId
        ? migrationPath(filtered, selectedId).map((f) => [f.lat, f.lon] as [number, number])
        : [],
    [filtered, selectedId]
  )
  const unlocated = useMemo(() => (tree ? unlocatedPlaces(tree) : []), [tree])
  const markerClass = useCallback(
    (m: MapMarker) =>
      cx(
        genClass(markerGeneration(m, gens)),
        selectedId && m.personIds.includes(selectedId) && styles.selected
      ),
    [gens, selectedId]
  )
  const markerLabel = useCallback(
    (m: MapMarker) => t('map.markerLabel', { place: m.name, count: m.personIds.length }),
    [t]
  )
  if (!tree) return null
  const selectedMarker = markers.find((m) => m.key === placeKey)
  const name = (id: string): string => {
    const p = tree.persons[id]
    return (p && displayName(p)) || t('person.unnamed')
  }
  const factLabel = (f: MapFact): string => {
    const what =
      f.kind === 'event' && f.eventType
        ? eventName({ type: f.eventType }, tt)
        : t(`map.kind.${f.kind}`)
    return [what, f.date ? format.date(f.date) : ''].filter(Boolean).join(' · ')
  }
  const toggleKind = (kind: MapKind): void =>
    setKinds((current) => {
      const next = new Set(current)
      if (next.has(kind)) next.delete(kind)
      else next.add(kind)
      return next
    })
  const exportPng = async (): Promise<void> => {
    const box = stage.current?.getBoundingClientRect()
    if (!box) return
    const path = await window.familyInsight.saveFileDialog(
      'png',
      `${tree.meta.name} – ${t('map.title')}`
    )
    if (!path) return
    const result = await window.familyInsight.capturePng(
      { x: box.x, y: box.y, width: box.width, height: box.height },
      path
    )
    toast(
      result.ok
        ? { message: t('map.exported'), tone: 'success' }
        : { message: t('files.error.io'), tone: 'error' }
    )
  }
  const usedGenerations = [...new Set(markers.map((m) => markerGeneration(m, gens)))]
    .filter((g): g is number => g !== undefined)
    .sort((a, b) => a - b)

  return (
    <div className={styles.view}>
      <aside className={styles.panel} aria-label={t('map.panel')}>
        <Hint id="map" />
        <section aria-labelledby="map-show">
          <h3 id="map-show" className={styles.heading}>
            {t('map.show')}
          </h3>
          <div className={styles.kinds}>
            {MAP_KINDS.map((kind) => (
              <label key={kind} className={styles.kind}>
                <input
                  type="checkbox"
                  checked={kinds.has(kind)}
                  onChange={() => toggleKind(kind)}
                />
                {t(`map.kinds.${kind}`)}
              </label>
            ))}
          </div>
        </section>
        {range && range.min < range.max && (
          <section aria-labelledby="map-period">
            <h3 id="map-period" className={styles.heading}>
              {t('map.period')}{' '}
              <span className={styles.periodValue}>
                {period.from ?? range.min} – {period.to ?? range.max}
              </span>
            </h3>
            <label className={styles.range}>
              <span>{t('map.from')}</span>
              <input
                type="range"
                min={range.min}
                max={range.max}
                value={period.from ?? range.min}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  setPeriod((p) => ({
                    ...p,
                    from: v <= range.min ? undefined : Math.min(v, p.to ?? range.max)
                  }))
                }}
              />
            </label>
            <label className={styles.range}>
              <span>{t('map.to')}</span>
              <input
                type="range"
                min={range.min}
                max={range.max}
                value={period.to ?? range.max}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  setPeriod((p) => ({
                    ...p,
                    to: v >= range.max ? undefined : Math.max(v, p.from ?? range.min)
                  }))
                }}
              />
            </label>
            {(period.from !== undefined || period.to !== undefined) && (
              <p className={styles.muted}>{t('map.undatedHidden')}</p>
            )}
          </section>
        )}
        {usedGenerations.length > 0 && (
          <section aria-labelledby="map-legend">
            <h3 id="map-legend" className={styles.heading}>
              {t('map.legend')}
            </h3>
            <ul className={styles.legend}>
              {usedGenerations.map((g) => (
                <li key={g}>
                  <span className={cx(styles.swatch, genClass(g))} aria-hidden="true" />
                  {g === 0
                    ? t('map.generation.root')
                    : g < 0
                      ? t('map.generation.up', { count: -g })
                      : t('map.generation.down', { count: g })}
                </li>
              ))}
              {selectedId && path.length > 1 && (
                <li>
                  <span className={styles.pathSwatch} aria-hidden="true" />
                  {t('map.pathOf', { name: name(selectedId) })}
                </li>
              )}
            </ul>
          </section>
        )}
        {selectedMarker && (
          <section aria-labelledby="map-place" className={styles.place}>
            <h3 id="map-place" className={styles.placeName}>
              <MapPin size={16} aria-hidden="true" /> {selectedMarker.name}
            </h3>
            <ul className={styles.facts}>
              {selectedMarker.facts.map((f, i) => (
                <li key={i}>
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() => useDocument.getState().select(f.personId)}
                  >
                    {name(f.personId)}
                  </button>
                  <span className={styles.muted}> · {factLabel(f)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        <section aria-labelledby="map-unlocated">
          <h3 id="map-unlocated" className={styles.heading}>
            {t('map.unlocated', { count: unlocated.length })}
          </h3>
          {unlocated.length === 0 ? (
            <p className={styles.muted}>{t('map.allLocated')}</p>
          ) : (
            <ul className={styles.unlocated}>
              {unlocated.slice(0, 50).map((p) => (
                <li key={p.key}>
                  <span>{p.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={MapPinOff}
                    onClick={() => useWorkspaceUi.getState().openPlaces(p.key)}
                  >
                    {t('map.setLocation')}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <Button
          size="sm"
          icon={ImageDown}
          onClick={() => void exportPng()}
          disabled={!markers.length}
        >
          {t('map.export')}
        </Button>
      </aside>
      <div ref={stage} className={styles.stage}>
        {facts.length === 0 && (
          <div className={styles.notice} role="status">
            <Route size={20} aria-hidden="true" />
            <p>{t('map.noFacts')}</p>
            <Button size="sm" icon={MapPin} onClick={() => useWorkspaceUi.getState().openPlaces()}>
              {t('menu.places')}
            </Button>
          </div>
        )}
        {!onlineMaps && facts.length > 0 && (
          <div className={styles.notice} role="status">
            <Globe size={20} aria-hidden="true" />
            <p>{t('map.offline')}</p>
            <Button size="sm" icon={Globe} onClick={() => void allowOnlineMaps(tt)}>
              {t('map.allow')}
            </Button>
          </div>
        )}
        {onlineMaps && tileError && (
          <div className={cx(styles.notice, styles.small)} role="status">
            <p>{t('map.tilesFailed')}</p>
          </div>
        )}
        <LeafletMap
          markers={markers}
          markerClass={markerClass}
          markerLabel={markerLabel}
          path={path}
          tiles={onlineMaps}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
          onPick={setPlaceKey}
          onTileError={() => setTileError(true)}
          focus={placeKey}
        />
      </div>
    </div>
  )
}
