// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultSettings, type Settings } from '@core/settings'
import { setupI18n } from '@renderer/test/i18n'
import { ConfirmHost } from '@renderer/components/ui'
import { addPersonCommand } from '@renderer/store/commands'
import { useDocument } from '@renderer/store/document'
import { useSettings } from '@renderer/store/settings'
import { formatCoordinates, PlacesDialog } from './PlacesDialog'

afterEach(cleanup)

HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.setAttribute('open', '')
}
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  this.removeAttribute('open')
}

const api = {
  lookupPlace: vi.fn(async () => ({
    ok: true as const,
    results: [{ lat: 50.0619, lon: 19.9369, displayName: 'Kraków, Lesser Poland, Poland' }]
  })),
  updateSettings: vi.fn(async (patch: Partial<Settings>) => ({
    ...useSettings.getState().settings,
    ...patch
  }))
}
;(window as unknown as { familyInsight: unknown }).familyInsight = api

const tree = () => useDocument.getState().tree!

beforeEach(() => {
  setupI18n('en')
  api.lookupPlace.mockClear()
  useSettings.setState({ settings: defaultSettings('en') })
  useDocument.getState().newDocument('Test')
  const dispatch = useDocument.getState().dispatch
  dispatch(
    addPersonCommand({ givenNames: 'Jan', surname: 'K', sex: 'male', birth: { place: 'Kraków' } })
  )
  dispatch(
    addPersonCommand({
      givenNames: 'Anna',
      surname: 'K',
      sex: 'female',
      birth: { place: 'Cracow' }
    })
  )
  dispatch(
    addPersonCommand({ givenNames: 'Ewa', surname: 'K', sex: 'female', death: { place: 'Krakow' } })
  )
})

function open(): void {
  render(
    <>
      <PlacesDialog onClose={() => {}} />
      <ConfirmHost />
    </>
  )
}

describe('PlacesDialog', () => {
  it('lists places with usage and location status', () => {
    open()
    expect(screen.getByText('2 places in your tree, 0 with a location.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /^Kraków/ }))
    expect(screen.getByText('Also written as Krakow')).toBeTruthy()
    expect(screen.getByText('Used 2 times: Jan K and Ewa K')).toBeTruthy()
  })

  it('saves coordinates entered by hand and rejects impossible ones', () => {
    open()
    fireEvent.click(screen.getByRole('button', { name: /^Cracow/ }))
    fireEvent.change(screen.getByLabelText('Latitude'), { target: { value: '95' } })
    fireEvent.change(screen.getByLabelText('Longitude'), { target: { value: '19,9369' } })
    expect(screen.getByText(/Latitude must be between/)).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Latitude'), { target: { value: '50,0619' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save location' }))
    expect(tree().places.cracow).toEqual({ lat: 50.0619, lon: 19.9369, source: 'manual' })
  })

  it('asks before the first online lookup, then uses the chosen result', async () => {
    open()
    fireEvent.click(screen.getByRole('button', { name: /^Kraków/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Look up online' }))
    expect(await screen.findByText('Look up places online?')).toBeTruthy()
    expect(api.lookupPlace).not.toHaveBeenCalled()
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Allow' })))
    expect(useSettings.getState().settings.onlinePlaceLookup).toBe(true)
    await waitFor(() => expect(api.lookupPlace).toHaveBeenCalledWith('places-dialog', 'Kraków'))
    fireEvent.click(await screen.findByRole('button', { name: /Lesser Poland/ }))
    expect(tree().places.krakow).toMatchObject({ lat: 50.0619, source: 'geocoded' })
    expect(screen.getByText(/50\.0619° N, 19\.9369° E/)).toBeTruthy()
  })

  it('merges two spellings into one place', () => {
    open()
    fireEvent.click(screen.getByRole('button', { name: /^Cracow/ }))
    fireEvent.change(screen.getByLabelText('Merge into'), { target: { value: 'krakow' } })
    fireEvent.click(screen.getByRole('button', { name: 'Merge' }))
    const places = Object.values(tree().persons).map((p) => p.birth?.place ?? p.death?.place)
    expect(places).toEqual(['Kraków', 'Kraków', 'Kraków'])
  })

  it('formats coordinates with hemispheres', () => {
    expect(formatCoordinates(-33.8688, -151.2093, 'en')).toBe('33.8688° S, 151.2093° W')
    expect(formatCoordinates(50.0619, 19.9369, 'pl')).toBe('50,0619° N, 19,9369° E')
  })
})
