import { useEffect, useRef } from 'react'
import { useTour } from '@renderer/features/tour/tourStore'
import { useSettings } from '@renderer/store/settings'
import { useHints } from './hintStore'

/**
 * The first switch to the Tapestry style shows a one-time hint (through the tour overlay: the
 * switch happens in a menu, with no dialog open).
 */
export function useStyleHint(): void {
  const style = useSettings((s) => s.settings.style)
  const previous = useRef(style)
  useEffect(() => {
    const from = previous.current
    previous.current = style
    if (from === style || style !== 'tapestry') return
    if (useTour.getState().position) return
    if (useHints.getState().claim('style')) useTour.getState().start('hint:style')
  }, [style])
}
