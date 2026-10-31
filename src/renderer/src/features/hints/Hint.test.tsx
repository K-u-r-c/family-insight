// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defaultSettings, type Settings } from '@core/settings'
import { setupI18n } from '@renderer/test/i18n'
import { useSettings } from '@renderer/store/settings'
import { Hint } from './Hint'
import { useHints } from './hintStore'

afterEach(cleanup)

describe('Hint', () => {
  const updates: Partial<Settings>[] = []
  beforeEach(() => {
    setupI18n('en')
    updates.length = 0
    useHints.setState({ shown: null, dismissed: [] })
    useSettings.setState({ settings: defaultSettings('en') })
    Object.assign(window, {
      familyInsight: {
        updateSettings: async (patch: Partial<Settings>) => {
          updates.push(patch)
          useSettings.setState({ settings: { ...useSettings.getState().settings, ...patch } })
          return useSettings.getState().settings
        }
      }
    })
  })

  it('shows once, as a note that does not take the focus, and records it', () => {
    const { unmount } = render(<Hint id="map" />)
    const note = screen.getByRole('note', { name: 'Tip' })
    expect(note.textContent).toContain('Each place with coordinates is a marker')
    expect(document.activeElement).not.toBe(note)
    expect(updates).toEqual([{ tips: ['map'] }])
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }))
    expect(screen.queryByRole('note')).toBeNull()
    unmount()
    render(<Hint id="map" />)
    expect(screen.queryByRole('note')).toBeNull()
  })

  it('shows at most one hint per app start', () => {
    render(<Hint id="map" />)
    render(<Hint id="stats" />)
    expect(screen.getAllByRole('note')).toHaveLength(1)
  })

  it('closes for this session when the dialog closes, and stays off after “Don’t show tips”', async () => {
    const first = render(<Hint id="kinship" />)
    first.unmount()
    render(<Hint id="kinship" />)
    expect(screen.queryByRole('note')).toBeNull()
    cleanup()
    useHints.setState({ shown: null, dismissed: [] })
    render(<Hint id="sources" />)
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Don’t show tips' })))
    expect(screen.queryByRole('note')).toBeNull()
    expect(useSettings.getState().settings.showTips).toBe(false)
    // Next app start.
    cleanup()
    useHints.setState({ shown: null, dismissed: [] })
    render(<Hint id="stats" />)
    expect(screen.queryByRole('note')).toBeNull()
  })
})
