import { create } from 'zustand'
import { canShowHint, markHintSeen, type HintId } from '@core/hints'
import { useSettings } from '@renderer/store/settings'

interface HintStore {
  /** The hint shown since the app started (at most one per start). */
  shown: HintId | null
  /** Hints closed in this session. */
  dismissed: HintId[]
  /** Claims the session's hint slot for `id` and records it as seen; false when not allowed. */
  claim: (id: HintId) => boolean
  dismiss: (id: HintId) => void
}

export const useHints = create<HintStore>((set, get) => ({
  shown: null,
  dismissed: [],
  claim: (id) => {
    const { shown, dismissed } = get()
    if (dismissed.includes(id)) return false
    if (shown === id) return true
    const { settings, update } = useSettings.getState()
    // Settings not loaded (component tests render dialogs without them): no hints.
    if (!settings?.tips || !canShowHint(id, settings, shown)) return false
    set({ shown: id })
    // If this can't be saved the hint simply shows again next time.
    update({ tips: markHintSeen(settings.tips, id) }).catch(() => undefined)
    return true
  },
  dismiss: (id) => set((s) => ({ dismissed: [...s.dismissed, id] }))
}))

/** Turns all tips off (the current hint closes too). */
export function disableTips(id: HintId): void {
  useHints.getState().dismiss(id)
  void useSettings.getState().update({ showTips: false })
}
