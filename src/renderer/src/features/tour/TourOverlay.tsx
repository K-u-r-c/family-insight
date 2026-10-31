import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, IconButton } from '@renderer/components/ui'
import { useTour } from './tourStore'
import { TOURS, tourContext } from './tours'
import styles from './TourOverlay.module.css'

interface Box {
  x: number
  y: number
  width: number
  height: number
}

const PAD = 8
const GAP = 14
const EDGE = 12

const sameBox = (a: Box | null, b: Box | null): boolean =>
  a === b ||
  (!!a &&
    !!b &&
    Math.abs(a.x - b.x) < 0.5 &&
    Math.abs(a.y - b.y) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5)

/** The rectangle around the target, as an SVG path with rounded corners. */
function hole(b: Box, r = 10): string {
  const x = b.x - PAD
  const y = b.y - PAD
  const w = b.width + PAD * 2
  const h = b.height + PAD * 2
  return `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
}

/** Where the popover goes: below the target, else above, else beside it; centred without one. */
function place(target: Box | null, pop: { width: number; height: number }, view: Box): Box {
  const clampX = (x: number): number => Math.min(Math.max(x, EDGE), view.width - pop.width - EDGE)
  const clampY = (y: number): number => Math.min(Math.max(y, EDGE), view.height - pop.height - EDGE)
  if (!target) {
    return {
      x: clampX((view.width - pop.width) / 2),
      y: clampY((view.height - pop.height) / 2),
      ...pop
    }
  }
  const centreX = clampX(target.x + target.width / 2 - pop.width / 2)
  const below = target.y + target.height + PAD + GAP
  if (below + pop.height <= view.height - EDGE) return { x: centreX, y: below, ...pop }
  const above = target.y - PAD - GAP - pop.height
  if (above >= EDGE) return { x: centreX, y: above, ...pop }
  const right = target.x + target.width + PAD + GAP
  const y = clampY(target.y + target.height / 2 - pop.height / 2)
  if (right + pop.width <= view.width - EDGE) return { x: right, y, ...pop }
  return { x: clampX(target.x - PAD - GAP - pop.width), y, ...pop }
}

/**
 * The guided tour: dims the window around the element a step points at and shows the step in a
 * popover (Back / Next / Skip; Esc skips, ← → move). The dimming never blocks the app, so a step
 * can ask the user to do something and advance by itself when it is done.
 */
export function TourOverlay(): React.JSX.Element | null {
  const { t } = useTranslation()
  const position = useTour((s) => s.position)
  const send = useTour((s) => s.send)
  const titleId = useId()
  const bodyId = useId()
  const popover = useRef<HTMLDivElement>(null)
  const [target, setTarget] = useState<Box | null>(null)
  const [view, setView] = useState<Box>({ x: 0, y: 0, width: 0, height: 0 })
  const [popSize, setPopSize] = useState({ width: 340, height: 180 })
  const steps = position ? TOURS[position.tourId] : undefined
  const step = position ? steps?.[position.index] : undefined

  // Follow the target (panels open, windows resize) and advance when a condition holds.
  useEffect(() => {
    if (!step) return
    const update = (): void => {
      const el = step.target
        ? document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`)
        : null
      const r = el?.getBoundingClientRect()
      const next =
        r && r.width > 0 && r.height > 0
          ? { x: r.x, y: r.y, width: r.width, height: r.height }
          : null
      setTarget((prev) => (sameBox(prev, next) ? prev : next))
      const v = { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight }
      setView((prev) => (sameBox(prev, v) ? prev : v))
      send({ type: 'check', context: tourContext() })
    }
    update()
    const timer = window.setInterval(update, 200)
    window.addEventListener('resize', update)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('resize', update)
    }
  }, [step, send])

  // Each step takes the focus, so screen readers read it and the arrow keys work.
  useLayoutEffect(() => {
    const el = popover.current
    if (!el) return
    el.focus()
    const r = el.getBoundingClientRect()
    if (r.width && r.height) {
      setPopSize((prev) =>
        Math.abs(prev.width - r.width) < 1 && Math.abs(prev.height - r.height) < 1
          ? prev
          : { width: r.width, height: r.height }
      )
    }
  }, [position?.tourId, position?.index])

  useEffect(() => {
    if (!position) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        send({ type: 'skip' })
      } else if (popover.current?.contains(document.activeElement)) {
        if (e.key === 'ArrowRight') {
          e.preventDefault()
          send({ type: 'next' })
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault()
          send({ type: 'back' })
        }
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [position, send])

  if (!position || !steps || !step) return null
  const last = position.index === steps.length - 1
  const box = place(target, popSize, view)
  return (
    <div className={styles.layer} data-tour-overlay>
      {view.width > 0 && (
        <svg className={styles.dim} width={view.width} height={view.height} aria-hidden="true">
          <path
            fillRule="evenodd"
            d={`M0 0H${view.width}V${view.height}H0Z${target ? hole(target) : ''}`}
          />
          {target && <path className={styles.ring} d={hole(target)} />}
        </svg>
      )}
      <div
        ref={popover}
        className={styles.popover}
        style={{ left: box.x, top: box.y }}
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        tabIndex={-1}
      >
        <div className={styles.head}>
          <span className={styles.counter}>
            {t('tour.step', { current: position.index + 1, total: steps.length })}
          </span>
          <IconButton
            icon={X}
            size="sm"
            label={t('tour.close')}
            onClick={() => send({ type: 'skip' })}
          />
        </div>
        <h2 id={titleId} className={styles.title}>
          {t(step.title as never)}
        </h2>
        <p id={bodyId} className={styles.body}>
          {t(step.body as never)}
        </p>
        <div className={styles.actions}>
          <Button variant="ghost" size="sm" onClick={() => send({ type: 'skip' })}>
            {t('tour.skip')}
          </Button>
          <span className={styles.spacer} />
          <Button size="sm" disabled={position.index === 0} onClick={() => send({ type: 'back' })}>
            {t('tour.back')}
          </Button>
          <Button variant="primary" size="sm" onClick={() => send({ type: 'next' })}>
            {last ? t('tour.done') : t('tour.next')}
          </Button>
        </div>
      </div>
    </div>
  )
}
