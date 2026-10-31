import { create } from 'zustand'
import { advanceTour, markTourSeen, startTour, type TourEvent, type TourPosition } from '@core/tour'
import { useSettings } from '@renderer/store/settings'
import { TOURS, type TourContext } from './tours'

interface TourStore {
  /** The running tour and step, or `null`. */
  position: TourPosition | null
  start: (tourId: string) => void
  send: (event: TourEvent<TourContext>) => void
}

/** Hints shown through the overlay are tours named `hint:<id>`; they count as shown hints. */
export const HINT_PREFIX = 'hint:'

function remember(tourId: string): void {
  if (tourId.startsWith(HINT_PREFIX)) return // recorded when the hint was claimed
  const { settings, update } = useSettings.getState()
  void update({ tours: markTourSeen(settings.tours, tourId) })
}

export const useTour = create<TourStore>((set, get) => ({
  position: null,
  start: (tourId) => {
    if (TOURS[tourId]?.length) set({ position: startTour(tourId) })
  },
  send: (event) => {
    const position = get().position
    if (!position) return
    const result = advanceTour(TOURS[position.tourId] ?? [], position, event)
    if (result.kind === 'step') {
      if (result.position.index !== position.index) set({ position: result.position })
      return
    }
    set({ position: null })
    remember(result.tourId)
  }
}))
