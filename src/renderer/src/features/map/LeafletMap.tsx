import { useEffect, useLayoutEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet/dist/leaflet.css'
import type { MapMarker } from '@core/mapData'
import styles from './Map.module.css'

export interface LeafletMapProps {
  markers: MapMarker[]
  /** Class of each marker (generation colour, selection). */
  markerClass: (marker: MapMarker) => string
  markerLabel: (marker: MapMarker) => string
  /** Points of the selected person's migration path, in order. */
  path: [number, number][]
  /** Load tiles (online maps allowed); otherwise only markers on a plain background. */
  tiles: boolean
  attribution: string
  onPick: (key: string) => void
  onTileError: () => void
  /** Marker to centre on (e.g. after picking a place in the list). */
  focus?: string | null
}

/** Imperative Leaflet map; React owns the data, this component only draws it. */
export function LeafletMap(props: LeafletMapProps): React.JSX.Element {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const cluster = useRef<L.MarkerClusterGroup | null>(null)
  const line = useRef<L.Polyline | null>(null)
  const tiles = useRef<L.TileLayer | null>(null)
  const byKey = useRef(new Map<string, L.Marker>())
  const fitted = useRef(false)
  const latest = useRef(props)
  // Event handlers registered on Leaflet objects always call the latest callbacks.
  useLayoutEffect(() => {
    latest.current = props
  })

  useEffect(() => {
    const m = L.map(container.current!, {
      zoomControl: true,
      attributionControl: true,
      worldCopyJump: true,
      minZoom: 2,
      maxZoom: 18
    }).setView([50, 15], 4)
    m.attributionControl.setPrefix(false)
    cluster.current = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 40,
      iconCreateFunction: (c) =>
        L.divIcon({
          className: styles.cluster,
          html: `<span>${c.getChildCount()}</span>`,
          iconSize: [40, 40]
        })
    }).addTo(m)
    map.current = m
    // The map area changes when panels open or close; Leaflet only watches the window.
    const resize = new ResizeObserver(() => m.invalidateSize())
    resize.observe(container.current!)
    return () => {
      resize.disconnect()
      m.remove()
      map.current = null
    }
  }, [])

  // Tiles come from the main process (`fi-tile:`), only when online maps are allowed.
  useEffect(() => {
    const m = map.current
    if (!m) return
    tiles.current?.remove()
    tiles.current = null
    if (!props.tiles) return
    const layer = L.tileLayer('fi-tile://map/{z}/{x}/{y}.png', {
      attribution: props.attribution,
      maxZoom: 18,
      crossOrigin: false
    })
    layer.on('tileerror', () => latest.current.onTileError())
    tiles.current = layer.addTo(m)
  }, [props.tiles, props.attribution])

  useEffect(() => {
    const group = cluster.current
    const m = map.current
    if (!group || !m) return
    group.clearLayers()
    byKey.current.clear()
    for (const marker of props.markers) {
      const count = marker.personIds.length
      const leaflet = L.marker([marker.lat, marker.lon], {
        title: latest.current.markerLabel(marker),
        alt: latest.current.markerLabel(marker),
        keyboard: true,
        icon: L.divIcon({
          className: `${styles.marker} ${latest.current.markerClass(marker)}`,
          html: `<span>${count > 1 ? count : ''}</span>`,
          iconSize: [count > 1 ? 30 : 22, count > 1 ? 30 : 22]
        })
      })
      leaflet.on('add', () => {
        const el = leaflet.getElement()
        el?.setAttribute('role', 'button')
        el?.setAttribute('aria-label', latest.current.markerLabel(marker))
      })
      leaflet.on('click', () => latest.current.onPick(marker.key))
      leaflet.on('keypress', (e: L.LeafletKeyboardEvent) => {
        if (e.originalEvent.key === 'Enter' || e.originalEvent.key === ' ') {
          latest.current.onPick(marker.key)
        }
      })
      byKey.current.set(marker.key, leaflet)
      group.addLayer(leaflet)
    }
    if (!fitted.current && props.markers.length) {
      fitted.current = true
      const bounds = L.latLngBounds(props.markers.map((mk) => [mk.lat, mk.lon]))
      m.fitBounds(bounds.pad(0.2), { maxZoom: 9 })
    }
  }, [props.markers, props.markerClass])

  useEffect(() => {
    const m = map.current
    if (!m) return
    line.current?.remove()
    line.current = null
    if (props.path.length > 1) {
      line.current = L.polyline(props.path, {
        className: styles.path,
        weight: 3,
        dashArray: '6 6'
      }).addTo(m)
    }
  }, [props.path])

  useEffect(() => {
    const m = map.current
    const marker = props.focus ? byKey.current.get(props.focus) : undefined
    if (!m || !marker) return
    cluster.current?.zoomToShowLayer(marker, () => undefined)
  }, [props.focus])

  return <div ref={container} className={styles.map} data-testid="map" />
}
