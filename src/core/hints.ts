/**
 * One-time feature hints: a short tip the first time the user reaches a feature. Each hint is
 * shown once, at most one per app start, and never when the user turned tips off.
 */

export const HINTS = [
  'map',
  'kinship',
  'sources',
  'media',
  'csvImport',
  'gedcom',
  'stats',
  'style'
] as const
export type HintId = (typeof HINTS)[number]

export interface HintSettings {
  showTips: boolean
  /** Hints already shown. */
  tips: string[]
}

/** Whether `id` may appear now (`shownThisSession`: the hint already shown since the app started). */
export function canShowHint(
  id: HintId,
  settings: HintSettings,
  shownThisSession: HintId | null
): boolean {
  if (shownThisSession !== null) return shownThisSession === id
  return settings.showTips && !settings.tips.includes(id)
}

export function markHintSeen(tips: readonly string[], id: HintId): string[] {
  return tips.includes(id) ? [...tips] : [...tips, id]
}
