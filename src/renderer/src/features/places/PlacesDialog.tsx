import { useMemo, useState } from 'react'
import { Globe, MapPin, MapPinOff, Merge, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { isLatitude, isLongitude, listPlaces, type PlaceSummary } from '@core/model/places'
import { displayName } from '@core/model/tree'
import { foldText } from '@core/text'
import type { PlaceLookupResult } from '@shared/ipc'
import { Button, confirm, Dialog, EmptyState, Select, TextField } from '@renderer/components/ui'
import { useFormat } from '@renderer/i18n/format'
import { mergePlacesCommand, setPlaceCommand } from '@renderer/store/commands'
import { useDocument } from '@renderer/store/document'
import { useSettings } from '@renderer/store/settings'
import styles from './Places.module.css'

const LOOKUP_ID = 'places-dialog'

/** Asks before place names are sent to OpenStreetMap the first time. */
export async function ensureLookupAllowed(t: (key: string) => string): Promise<boolean> {
  const { settings, update } = useSettings.getState()
  if (settings.onlinePlaceLookup) return true
  const ok = await confirm({
    title: t('places.consentTitle'),
    message: t('places.consentText'),
    confirmLabel: t('places.consentAllow')
  })
  if (ok) await update({ onlinePlaceLookup: true })
  return ok
}

/** Formats coordinates for people: 50.0619° N, 19.9369° E. */
export function formatCoordinates(lat: number, lon: number, language: string): string {
  const n = (v: number): string =>
    new Intl.NumberFormat(language, { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(
      Math.abs(v)
    )
  return `${n(lat)}° ${lat >= 0 ? 'N' : 'S'}, ${n(lon)}° ${lon >= 0 ? 'E' : 'W'}`
}

/** All places of the tree: how often they are used, their location, lookup, merging. */
export function PlacesDialog({ onClose }: { onClose: () => void }): React.JSX.Element | null {
  const { t } = useTranslation()
  const tree = useDocument((s) => s.tree)
  const [query, setQuery] = useState('')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const places = useMemo(() => (tree ? listPlaces(tree) : []), [tree])
  if (!tree) return null
  const q = foldText(query.trim())
  const shown = places.filter((p) => !q || p.spellings.some((s) => foldText(s).includes(q)))
  const selected = places.find((p) => p.key === selectedKey)
  const located = places.filter((p) => p.place).length

  return (
    <Dialog
      open
      wide
      onClose={onClose}
      icon={MapPin}
      title={t('places.title')}
      description={t('places.description', { count: places.length, located })}
      footer={
        <Button variant="primary" onClick={onClose}>
          {t('common.done')}
        </Button>
      }
    >
      <div className={styles.manager}>
        <div className={styles.sidebar}>
          <TextField
            type="search"
            icon={Search}
            label={t('places.search')}
            hideLabel
            placeholder={t('places.search')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <ul className={styles.list} aria-label={t('places.title')}>
            {shown.map((p) => (
              <li key={p.key}>
                <button
                  type="button"
                  className={styles.row}
                  aria-current={p.key === selectedKey || undefined}
                  onClick={() => setSelectedKey(p.key)}
                >
                  <span className={styles.rowName}>{p.name}</span>
                  <span className={styles.muted}>
                    {t('places.used', { count: p.count })}
                    {' · '}
                    {p.place ? t('places.located') : t('places.notLocated')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {shown.length === 0 && (
            <p className={styles.muted}>
              {places.length ? t('people.noResults', { query }) : t('places.empty')}
            </p>
          )}
        </div>
        <div className={styles.editor}>
          {selected ? (
            <PlaceEditor key={selected.key} place={selected} places={places} />
          ) : (
            <EmptyState
              icon={MapPin}
              title={t('places.pickTitle')}
              description={t('places.pickText')}
            />
          )}
        </div>
      </div>
    </Dialog>
  )
}

function PlaceEditor({
  place,
  places
}: {
  place: PlaceSummary
  places: PlaceSummary[]
}): React.JSX.Element {
  const { t } = useTranslation()
  const format = useFormat()
  const tree = useDocument((s) => s.tree)!
  const dispatch = useDocument((s) => s.dispatch)
  const [lat, setLat] = useState(place.place ? String(place.place.lat) : '')
  const [lon, setLon] = useState(place.place ? String(place.place.lon) : '')
  const [lookup, setLookup] = useState<PlaceLookupResult | 'busy' | null>(null)
  const [mergeInto, setMergeInto] = useState('')
  const tt = (key: string): string => t(key as never) as unknown as string

  const parse = (v: string): number => Number(v.trim().replace(',', '.'))
  const latitude = parse(lat)
  const longitude = parse(lon)
  const valid =
    lat.trim() !== '' && lon.trim() !== '' && isLatitude(latitude) && isLongitude(longitude)

  const saveManual = (): void => {
    if (valid)
      dispatch(setPlaceCommand(place.name, { lat: latitude, lon: longitude, source: 'manual' }))
  }
  const runLookup = async (): Promise<void> => {
    if (!(await ensureLookupAllowed(tt))) return
    setLookup('busy')
    setLookup(await window.familyInsight.lookupPlace(LOOKUP_ID, place.name))
  }
  const pick = (r: { lat: number; lon: number; displayName: string }): void => {
    dispatch(
      setPlaceCommand(place.name, {
        lat: r.lat,
        lon: r.lon,
        source: 'geocoded',
        displayName: r.displayName
      })
    )
    setLat(String(r.lat))
    setLon(String(r.lon))
    setLookup(null)
  }
  const merge = (): void => {
    const target = places.find((p) => p.key === mergeInto)
    if (!target) return
    dispatch(mergePlacesCommand([...place.spellings, ...target.spellings], target.name))
  }
  const people = place.personIds
    .map((id) => tree.persons[id])
    .filter(Boolean)
    .map((p) => displayName(p!) || t('person.unnamed'))

  return (
    <div className={styles.fields}>
      <div>
        <h3 className={styles.name}>{place.name}</h3>
        {place.spellings.length > 1 && (
          <p className={styles.muted}>
            {t('places.spellings', { list: format.list(place.spellings.slice(1)) })}
          </p>
        )}
        <p className={styles.muted}>
          {t('places.usedBy', { count: place.count, people: format.list(people.slice(0, 6)) })}
          {people.length > 6 && ` ${t('places.andMore', { count: people.length - 6 })}`}
        </p>
      </div>

      <section aria-labelledby="place-location">
        <h4 id="place-location" className={styles.subheading}>
          {t('places.location')}
        </h4>
        {place.place ? (
          <p>
            {formatCoordinates(place.place.lat, place.place.lon, format.language)}
            <span className={styles.muted}>
              {' · '}
              {place.place.source === 'manual' ? t('places.manual') : t('places.geocoded')}
            </span>
            {place.place.displayName && (
              <span className={styles.muted}> · {place.place.displayName}</span>
            )}
          </p>
        ) : (
          <p className={styles.muted}>{t('places.noLocation')}</p>
        )}
        <div className={styles.row2}>
          <TextField
            label={t('places.latitude')}
            inputMode="decimal"
            placeholder="50.0619"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
          />
          <TextField
            label={t('places.longitude')}
            inputMode="decimal"
            placeholder="19.9369"
            value={lon}
            onChange={(e) => setLon(e.target.value)}
          />
        </div>
        {(lat || lon) && !valid && <p className={styles.error}>{t('places.invalid')}</p>}
        <div className={styles.actions}>
          <Button size="sm" icon={MapPin} disabled={!valid} onClick={saveManual}>
            {t('places.save')}
          </Button>
          <Button
            size="sm"
            icon={Globe}
            onClick={() => void runLookup()}
            disabled={lookup === 'busy'}
          >
            {lookup === 'busy' ? t('places.searching') : t('places.lookup')}
          </Button>
          {place.place && (
            <Button
              size="sm"
              variant="ghost"
              icon={MapPinOff}
              onClick={() => {
                dispatch(setPlaceCommand(place.name, undefined))
                setLat('')
                setLon('')
              }}
            >
              {t('places.clear')}
            </Button>
          )}
        </div>
        {lookup && lookup !== 'busy' && (
          <div className={styles.results} role="region" aria-label={t('places.results')}>
            {lookup.ok ? (
              lookup.results.length ? (
                <ul className={styles.resultList}>
                  {lookup.results.map((r) => (
                    <li key={`${r.lat},${r.lon}`}>
                      <button type="button" className={styles.result} onClick={() => pick(r)}>
                        <span>{r.displayName}</span>
                        <span className={styles.muted}>
                          {formatCoordinates(r.lat, r.lon, format.language)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.muted}>{t('places.noResults')}</p>
              )
            ) : (
              <p className={styles.error}>{t(`places.error.${lookup.error}`)}</p>
            )}
            <p className={styles.attribution}>
              {t('places.attribution')}{' '}
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
                © OpenStreetMap
              </a>
            </p>
          </div>
        )}
      </section>

      {places.length > 1 && (
        <section aria-labelledby="place-merge">
          <h4 id="place-merge" className={styles.subheading}>
            {t('places.merge')}
          </h4>
          <p className={styles.muted}>{t('places.mergeText')}</p>
          <div className={styles.row2}>
            <Select
              label={t('places.mergeInto')}
              value={mergeInto}
              options={[
                { value: '', label: t('places.choose') },
                ...places
                  .filter((p) => p.key !== place.key)
                  .map((p) => ({ value: p.key, label: p.name }))
              ]}
              onChange={setMergeInto}
            />
            <Button
              size="sm"
              icon={Merge}
              disabled={!mergeInto}
              className={styles.end}
              onClick={merge}
            >
              {t('places.mergeButton')}
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}
