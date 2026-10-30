// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultSettings } from '@core/settings'
import { setupI18n } from '@renderer/test/i18n'
import { addPersonCommand, setPlaceCommand } from '@renderer/store/commands'
import { useDocument } from '@renderer/store/document'
import { useSettings } from '@renderer/store/settings'
import { useWorkspaceUi } from '@renderer/store/workspaceUi'

/** A stand-in for Leaflet that records what the map draws. */
const drawn = vi.hoisted(() => ({
  markers: [] as { title: string; latlng: [number, number]; fire: (e: string) => void }[],
  tiles: [] as string[],
  polylines: [] as [number, number][][]
}))

vi.mock('leaflet.markercluster', () => ({}))
vi.mock('leaflet/dist/leaflet.css', () => ({}))
vi.mock('leaflet', () => {
  const layer = () => ({
    addTo: (m: unknown) => (void m, layerObj),
    remove: () => {},
    on: () => layerObj
  })
  const layerObj = { addTo: () => layerObj, remove: () => {}, on: () => layerObj }
  const L = {
    map: () => {
      const m = {
        setView: () => m,
        fitBounds: () => m,
        remove: () => {},
        invalidateSize: () => {},
        attributionControl: { setPrefix: () => {} }
      }
      return m
    },
    markerClusterGroup: () => ({
      addTo: function () {
        return this
      },
      clearLayers: () => {
        drawn.markers = []
      },
      addLayer: () => {},
      zoomToShowLayer: () => {}
    }),
    marker: (latlng: [number, number], options: { title: string }) => {
      const handlers = new Map<string, () => void>()
      const marker = {
        on: (event: string, handler: () => void) => {
          handlers.set(event, handler)
          return marker
        },
        getElement: () => undefined,
        fire: (event: string) => handlers.get(event)?.()
      }
      drawn.markers.push({ title: options.title, latlng, fire: marker.fire })
      return marker
    },
    divIcon: (o: unknown) => o,
    tileLayer: (url: string) => {
      drawn.tiles.push(url)
      return layer()
    },
    polyline: (points: [number, number][]) => {
      drawn.polylines.push(points)
      return layer()
    },
    latLngBounds: () => ({ pad: () => ({}) })
  }
  return { default: L }
})

const { default: MapView } = await import('./MapView')

afterEach(cleanup)

globalThis.ResizeObserver ??= class {
  observe(): void {}
  disconnect(): void {}
} as unknown as typeof ResizeObserver

HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.setAttribute('open', '')
}

let jan = ''
beforeEach(() => {
  setupI18n('en')
  drawn.markers = []
  drawn.tiles = []
  drawn.polylines = []
  useSettings.setState({ settings: defaultSettings('en') })
  useWorkspaceUi.setState({ dialog: null, placeKey: null })
  useDocument.getState().newDocument('Test')
  const dispatch = useDocument.getState().dispatch
  const d = (value: string) => ({ value, qualifier: 'exact' as const })
  jan = dispatch(
    addPersonCommand({
      givenNames: 'Jan',
      surname: 'Kowalski',
      sex: 'male',
      birth: { date: d('1890'), place: 'Kraków' },
      death: { date: d('1960'), place: 'Łódź' }
    })
  ).id
  dispatch(
    addPersonCommand({
      givenNames: 'Anna',
      surname: 'Nowak',
      sex: 'female',
      birth: { date: d('1895'), place: 'Kraków' }
    })
  )
  dispatch(
    addPersonCommand({
      givenNames: 'Ewa',
      surname: 'Lis',
      sex: 'female',
      birth: { place: 'Wieliczka' }
    })
  )
  dispatch(setPlaceCommand('Kraków', { lat: 50.06, lon: 19.94, source: 'manual' }))
  dispatch(setPlaceCommand('Łódź', { lat: 51.76, lon: 19.46, source: 'manual' }))
})

const titles = () => drawn.markers.map((m) => m.title).sort()

describe('MapView', () => {
  it('draws one marker per located place, without tiles while online maps are off', () => {
    render(<MapView />)
    expect(titles()).toEqual(['Kraków: 2 people', 'Łódź: 1 person'])
    expect(drawn.tiles).toEqual([])
    expect(screen.getByText(/comes from OpenStreetMap on the internet and is off/)).toBeTruthy()
    expect(screen.getByText('1 place without a location')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Set location' }))
    expect(useWorkspaceUi.getState()).toMatchObject({ dialog: 'places', placeKey: 'wieliczka' })
  })

  it('loads tiles through the app when online maps are allowed', () => {
    useSettings.setState({ settings: { ...defaultSettings('en'), onlineMaps: true } })
    render(<MapView />)
    expect(drawn.tiles).toEqual(['fi-tile://map/{z}/{x}/{y}.png'])
  })

  it('filters by kind and period', () => {
    render(<MapView />)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Births' }))
    expect(titles()).toEqual(['Łódź: 1 person'])
    fireEvent.click(screen.getByRole('checkbox', { name: 'Births' }))
    const [from] = screen.getAllByRole('slider')
    fireEvent.change(from!, { target: { value: '1950' } })
    expect(titles()).toEqual(['Łódź: 1 person'])
    expect(screen.getByText('Facts without a date are hidden while a period is set.')).toBeTruthy()
  })

  it('lists the people of a picked place and selects one; shows their path', () => {
    const view = render(<MapView />)
    act(() => drawn.markers.find((m) => m.title.startsWith('Kraków'))!.fire('click'))
    expect(screen.getByRole('heading', { name: 'Kraków' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Jan Kowalski' }))
    expect(useDocument.getState().selectedPersonId).toBe(jan)
    view.rerender(<MapView />)
    expect(drawn.polylines.at(-1)).toEqual([
      [50.06, 19.94],
      [51.76, 19.46]
    ])
    expect(screen.getByText('Places of Jan Kowalski, in order')).toBeTruthy()
  })
})
