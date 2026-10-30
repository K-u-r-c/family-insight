// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultSettings, type Settings } from '@core/settings'
import type { UpdateStatus } from '@shared/ipc'
import { setupI18n } from '@renderer/test/i18n'
import { ConfirmHost } from '@renderer/components/ui'
import { useDocument } from '@renderer/store/document'
import { useSettings } from '@renderer/store/settings'
import { SettingsMenu } from '@renderer/features/workspace/SettingsMenu'
import { parseBlocks } from './markdown'
import { UpdateNotice } from './UpdateNotice'
import { checkForUpdatesManually, useUpdates } from './updates'

afterEach(cleanup)

HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.setAttribute('open', '')
}
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  this.removeAttribute('open')
}

const api = {
  downloadUpdate: vi.fn(async () => {}),
  installUpdate: vi.fn(async () => {}),
  checkForUpdates: vi.fn(async (): Promise<UpdateStatus> => ({
    state: 'not-available',
    support: 'auto',
    manual: true
  })),
  getAppInfo: vi.fn(async () => ({
    name: 'Family Insight',
    version: '1.1.0',
    platform: 'linux',
    locale: 'en'
  })),
  updateSettings: vi.fn(async (patch: Partial<Settings>) => ({
    ...useSettings.getState().settings,
    ...patch
  })),
  askUnsaved: vi.fn(async () => 'cancel' as const)
}
;(window as unknown as { familyInsight: unknown }).familyInsight = api
const open = vi.fn()
window.open = open as never

const status = (s: Partial<UpdateStatus>): void =>
  void useUpdates.setState({
    status: { state: 'idle', support: 'auto', ...s } as UpdateStatus,
    dismissed: null,
    notesOpen: false
  })

beforeEach(() => {
  setupI18n('en')
  vi.clearAllMocks()
  useSettings.setState({ settings: defaultSettings('en') })
  useDocument.getState().closeDocument()
})

describe('UpdateNotice', () => {
  it('shows nothing while idle, checking or up to date', () => {
    for (const state of ['idle', 'checking', 'not-available'] as const) {
      status({ state })
      const { container } = render(<UpdateNotice />)
      expect(container.textContent).toBe('')
      cleanup()
    }
  })

  it('offers an available update: download, release notes, later, skip', () => {
    status({ state: 'available', version: '1.2.0', notes: '## New\n- **Maps**\n- <b>html</b>' })
    render(<UpdateNotice />)
    expect(screen.getByText('Family Insight 1.2.0 is available')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Download' }))
    expect(api.downloadUpdate).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Release notes' }))
    expect(screen.getByRole('heading', { name: "What's new in 1.2.0" }).textContent).toBeTruthy()
    expect(screen.getByText('Maps').tagName).toBe('STRONG')
    expect(screen.getByText('<b>html</b>')).toBeTruthy() // shown as text, never as HTML
    fireEvent.click(screen.getAllByRole('button', { name: 'Close' })[0]!)
    fireEvent.click(screen.getByRole('button', { name: 'Skip this version' }))
    expect(api.updateSettings).toHaveBeenCalledWith({
      updates: { checkAutomatically: true, skippedVersion: '1.2.0' }
    })
    expect(screen.queryByText('Family Insight 1.2.0 is available')).toBeNull()
  })

  it('points builds that cannot update themselves to the download page', () => {
    status({ state: 'available', support: 'notify', version: '1.2.0' })
    render(<UpdateNotice />)
    expect(screen.getByRole('button', { name: 'Download page' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Release notes' })).toBeNull()
  })

  it('shows download progress', () => {
    status({ state: 'downloading', version: '1.2.0', progress: 42 })
    render(<UpdateNotice />)
    expect(screen.getByText('Downloading Family Insight 1.2.0…')).toBeTruthy()
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('42')
    expect(screen.queryByRole('button', { name: 'Later' })).toBeNull()
  })

  it('restarts into a ready update only after the unsaved-changes question', async () => {
    status({ state: 'ready', version: '1.2.0' })
    render(<UpdateNotice />)
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Restart now' })))
    expect(api.installUpdate).toHaveBeenCalled()
    // With unsaved changes and "Cancel", nothing happens.
    api.installUpdate.mockClear()
    useDocument.getState().newDocument('Test')
    useDocument.getState().dispatch({
      label: 'x',
      run: (tree) => ({
        tree: { ...tree, meta: { ...tree.meta, name: 'Changed' } },
        result: undefined
      })
    })
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Restart now' })))
    expect(api.askUnsaved).toHaveBeenCalled()
    expect(api.installUpdate).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'When I quit' }))
    expect(screen.queryByText('Family Insight 1.2.0 is ready to install')).toBeNull()
  })

  it('offers a retry after a failed download', () => {
    status({ state: 'error', version: '1.2.0', error: 'boom' })
    render(<UpdateNotice />)
    expect(screen.getByText("The update couldn't be downloaded.")).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(api.downloadUpdate).toHaveBeenCalled()
  })
})

describe('manual checks and the settings menu', () => {
  it('reports "up to date" and errors of a manual check', async () => {
    render(<ConfirmHost />)
    await act(async () => void checkForUpdatesManually())
    expect(await screen.findByText('Family Insight 1.1.0 is the newest version.')).toBeTruthy()
    cleanup()
    api.checkForUpdates.mockResolvedValueOnce({ state: 'error', support: 'auto', manual: true })
    render(<ConfirmHost />)
    await act(async () => void checkForUpdatesManually())
    expect(await screen.findByText("Couldn't check for updates")).toBeTruthy()
  })

  it('switches automatic checks and shows the last check time', () => {
    useSettings.setState({
      settings: {
        ...defaultSettings('en'),
        updates: { checkAutomatically: true, lastCheck: '2026-10-30T10:15:00Z' }
      }
    })
    render(<SettingsMenu />)
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
    expect(
      screen
        .getByRole('menuitemradio', { name: 'Check for updates automatically' })
        .getAttribute('aria-checked')
    ).toBe('true')
    expect(screen.getByRole('menuitem', { name: /Check now… \(last: / })).toBeTruthy()
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Check for updates automatically' }))
    expect(api.updateSettings).toHaveBeenCalledWith({
      updates: { checkAutomatically: false, lastCheck: '2026-10-30T10:15:00Z' }
    })
  })
})

describe('release notes Markdown', () => {
  it('parses headings, lists and paragraphs', () => {
    expect(parseBlocks('# Title\n\nSome text\ncontinues\n\n- one\n- two\n  more')).toEqual([
      { type: 'heading', level: 1, text: 'Title' },
      { type: 'paragraph', text: 'Some text continues' },
      { type: 'list', items: ['one', 'two more'] }
    ])
  })
})
