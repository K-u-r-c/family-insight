/**
 * Generic snapshot-based undo history. States are immutable, so snapshots are cheap
 * (unchanged parts are shared between versions).
 */

export interface HistoryEntry<T> {
  state: T
  label: string
}

export interface History<T> {
  past: HistoryEntry<T>[]
  present: T
  /** Label of the change that produced `present`. */
  presentLabel: string
  future: HistoryEntry<T>[]
  /** Coalescing info for the last change. */
  lastKey?: string
  lastAt?: number
}

export const HISTORY_LIMIT = 200
export const COALESCE_MS = 1500

export function createHistory<T>(present: T): History<T> {
  return { past: [], present, presentLabel: '', future: [] }
}

export interface PushOptions {
  label: string
  /** Consecutive changes with the same key within COALESCE_MS merge into one undo step. */
  coalesceKey?: string
  now?: number
  limit?: number
}

export function pushHistory<T>(history: History<T>, next: T, options: PushOptions): History<T> {
  if (next === history.present) return history
  const now = options.now ?? Date.now()
  const coalesce =
    options.coalesceKey !== undefined &&
    options.coalesceKey === history.lastKey &&
    history.lastAt !== undefined &&
    now - history.lastAt < COALESCE_MS &&
    history.future.length === 0
  if (coalesce) {
    return { ...history, present: next, lastAt: now }
  }
  const past = [...history.past, { state: history.present, label: options.label }]
  const limit = options.limit ?? HISTORY_LIMIT
  return {
    past: past.length > limit ? past.slice(past.length - limit) : past,
    present: next,
    presentLabel: options.label,
    future: [],
    lastKey: options.coalesceKey,
    lastAt: now
  }
}

export function undoHistory<T>(history: History<T>): History<T> {
  const previous = history.past[history.past.length - 1]
  if (!previous) return history
  return {
    past: history.past.slice(0, -1),
    present: previous.state,
    presentLabel: '',
    future: [{ state: history.present, label: previous.label }, ...history.future]
  }
}

export function redoHistory<T>(history: History<T>): History<T> {
  const [next, ...rest] = history.future
  if (!next) return history
  return {
    past: [...history.past, { state: history.present, label: next.label }],
    present: next.state,
    presentLabel: next.label,
    future: rest
  }
}

export const canUndo = (h: History<unknown>): boolean => h.past.length > 0
export const canRedo = (h: History<unknown>): boolean => h.future.length > 0
/** Label of the change that undo would revert. */
export const undoLabel = (h: History<unknown>): string | undefined =>
  h.past[h.past.length - 1]?.label
export const redoLabel = (h: History<unknown>): string | undefined => h.future[0]?.label
