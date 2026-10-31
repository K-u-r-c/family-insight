/**
 * Guided tours: a list of steps shown one after another. Pure state logic – the renderer supplies
 * the step definitions (what to point at, texts, "wait for" conditions) and draws the overlay.
 */

export interface TourStep<Context = unknown> {
  id: string
  /** `data-tour` value of the element to point at; without one the step is shown centred. */
  target?: string
  /** The step advances by itself once this is true (e.g. "a person exists"). */
  waitFor?: (context: Context) => boolean
}

export interface TourPosition {
  tourId: string
  index: number
  /** Reached by going back: the step's condition does not move it on until "Next". */
  manual?: boolean
}

export type TourResult =
  | { kind: 'step'; position: TourPosition }
  | { kind: 'done'; tourId: string }
  | { kind: 'skipped'; tourId: string }

export type TourEvent<Context = unknown> =
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'skip' }
  /** Something changed in the app: advance past steps whose condition now holds. */
  | { type: 'check'; context: Context }

export function startTour(tourId: string): TourPosition {
  return { tourId, index: 0 }
}

/** The position after an event (`done` after the last step, `skipped` when the user quits). */
export function advanceTour<Context>(
  steps: readonly TourStep<Context>[],
  position: TourPosition,
  event: TourEvent<Context>
): TourResult {
  const at = (index: number, manual = false): TourResult =>
    index >= steps.length
      ? { kind: 'done', tourId: position.tourId }
      : {
          kind: 'step',
          position: {
            tourId: position.tourId,
            index: Math.max(0, index),
            ...(manual ? { manual } : {})
          }
        }
  switch (event.type) {
    case 'next':
      return at(position.index + 1)
    case 'back':
      return at(position.index - 1, true)
    case 'skip':
      return { kind: 'skipped', tourId: position.tourId }
    case 'check': {
      const step = steps[position.index]
      return !position.manual && step?.waitFor?.(event.context)
        ? at(position.index + 1)
        : { kind: 'step', position }
    }
  }
}

/** Tours the user finished or skipped, with `tourId` added once. */
export function markTourSeen(seen: readonly string[], tourId: string): string[] {
  return seen.includes(tourId) ? [...seen] : [...seen, tourId]
}
