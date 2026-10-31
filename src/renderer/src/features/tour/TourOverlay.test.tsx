// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultSettings, type Settings } from '@core/settings'
import { setupI18n } from '@renderer/test/i18n'
import { useSettings } from '@renderer/store/settings'
import { TourOverlay } from './TourOverlay'
import { useTour } from './tourStore'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  useTour.setState({ position: null })
})

/** The first target of the first-run tour (the welcome screen’s New family tree) at a known place. */
function renderWithTarget(): HTMLElement {
  const { container } = render(
    <>
      <button type="button" data-tour="new-tree">
        New family tree
      </button>
      <TourOverlay />
    </>
  )
  const target = container.querySelector<HTMLElement>('[data-tour="new-tree"]')!
  target.getBoundingClientRect = () =>
    ({
      x: 100,
      y: 40,
      width: 120,
      height: 32,
      top: 40,
      left: 100,
      right: 220,
      bottom: 72
    }) as DOMRect
  return target
}

describe('TourOverlay', () => {
  const updates: Partial<Settings>[] = []
  beforeEach(() => {
    setupI18n('en')
    updates.length = 0
    useSettings.setState({ settings: defaultSettings('en') })
    Object.assign(window, {
      familyInsight: {
        updateSettings: async (patch: Partial<Settings>) => {
          updates.push(patch)
          return { ...useSettings.getState().settings, ...patch }
        }
      }
    })
  })

  it('shows the step in a labelled popover that takes the focus, and spotlights the target', () => {
    vi.useFakeTimers()
    renderWithTarget()
    act(() => useTour.getState().start('first-run'))
    act(() => vi.advanceTimersByTime(250))
    const dialog = screen.getByRole('dialog', { name: 'Start your tree' })
    expect(document.activeElement).toBe(dialog)
    expect(dialog.textContent).toContain('Step 1 of 8')
    // The dim layer has a hole around the target (8 px padding).
    const paths = document.querySelectorAll('[data-tour-overlay] > svg path')
    expect(paths[0]!.getAttribute('d')).toContain('M102 32')
    expect(paths).toHaveLength(2)
    // Placed below the target.
    expect(parseFloat(dialog.style.top)).toBeGreaterThan(72)
  })

  it('moves with the arrow keys and the buttons, and is remembered when finished', async () => {
    renderWithTarget()
    act(() => useTour.getState().start('first-run'))
    const dialog = (): HTMLElement => screen.getByRole('dialog')
    fireEvent.keyDown(dialog(), { key: 'ArrowRight' })
    expect(dialog().textContent).toContain('Step 2 of 8')
    fireEvent.keyDown(dialog(), { key: 'ArrowLeft' })
    expect(dialog().textContent).toContain('Step 1 of 8')
    expect(screen.getByRole('button', { name: 'Back' })).toHaveProperty('disabled', true)
    for (let i = 0; i < 7; i++) fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(dialog().textContent).toContain('Step 8 of 8')
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Done' })))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(updates).toEqual([{ tours: ['first-run'] }])
  })

  it('is skipped with Esc or the close button, and shows centred without a target', async () => {
    render(<TourOverlay />)
    act(() => useTour.getState().start('first-run'))
    expect(document.querySelectorAll('[data-tour-overlay] > svg path')).toHaveLength(1)
    await act(async () => fireEvent.keyDown(window, { key: 'Escape' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(updates).toEqual([{ tours: ['first-run'] }])
    act(() => useTour.getState().start('first-run'))
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Close the guided tour' }))
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
