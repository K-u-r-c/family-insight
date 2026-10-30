// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { checkPersonDates } from '@core/date/plausibility'
import { setupI18n } from '@renderer/test/i18n'
import { addEventCommand, addPersonCommand } from '@renderer/store/commands'
import { useDocument } from '@renderer/store/document'
import { Toaster } from '@renderer/components/ui'
import { EventsSection } from './EventsSection'

afterEach(cleanup)

let personId = ''

function person() {
  return useDocument.getState().tree!.persons[personId]!
}

/** Renders the section for the current state of the person (re-render after changes). */
function renderSection() {
  const result = render(
    <>
      <EventsSection person={person()} warnings={checkPersonDates(person())} />
      <Toaster />
    </>
  )
  const rerender = () =>
    result.rerender(
      <>
        <EventsSection person={person()} warnings={checkPersonDates(person())} />
        <Toaster />
      </>
    )
  return { rerender }
}

describe('EventsSection', () => {
  beforeEach(() => {
    setupI18n('en')
    useDocument.getState().newDocument('Test')
    personId = useDocument.getState().dispatch(
      addPersonCommand({
        givenNames: 'Jan',
        surname: 'Kowalski',
        sex: 'male',
        birth: { date: { value: '1890', qualifier: 'exact' } }
      })
    ).id
  })

  it('adds an event from the type menu and opens it for editing', () => {
    const { rerender } = renderSection()
    expect(screen.getByText(/add what you know/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Add event' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Military service' }))
    rerender()
    expect(person().events.map((e) => e.type)).toEqual(['military-service'])
    expect(screen.getByLabelText('Date (or start)')).toBeTruthy()
    expect(screen.getByLabelText('End date (optional)')).toBeTruthy()
  })

  it('edits the fields of an event', () => {
    useDocument.getState().dispatch(addEventCommand(personId, { type: 'occupation' }))
    const { rerender } = renderSection()
    fireEvent.click(screen.getByRole('button', { name: 'Edit Occupation' }))
    const description = screen.getByLabelText('Description')
    fireEvent.change(description, { target: { value: 'Blacksmith' } })
    fireEvent.blur(description)
    const date = screen.getByLabelText('Date (or start)')
    fireEvent.change(date, { target: { value: '1912' } })
    fireEvent.blur(date)
    rerender()
    expect(person().events[0]).toMatchObject({
      type: 'occupation',
      description: 'Blacksmith',
      date: { value: '1912', qualifier: 'exact' }
    })
    expect(screen.getByText('1912 · Blacksmith')).toBeTruthy()
  })

  it('removes an event and brings it back with undo', () => {
    useDocument.getState().dispatch(addEventCommand(personId, { type: 'baptism' }))
    const { rerender } = renderSection()
    fireEvent.click(screen.getByRole('button', { name: 'Remove Baptism' }))
    rerender()
    expect(person().events).toEqual([])
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Undo' })))
    rerender()
    expect(person().events.map((e) => e.type)).toEqual(['baptism'])
  })

  it('reorders events with the arrow buttons', () => {
    useDocument.getState().dispatch(addEventCommand(personId, { type: 'baptism' }))
    useDocument.getState().dispatch(addEventCommand(personId, { type: 'burial' }))
    const { rerender } = renderSection()
    expect(screen.getByRole('button', { name: 'Move Baptism up' }).hasAttribute('disabled')).toBe(
      true
    )
    fireEvent.click(screen.getByRole('button', { name: 'Move Burial up' }))
    rerender()
    expect(person().events.map((e) => e.type)).toEqual(['burial', 'baptism'])
  })

  it('shows plausibility warnings next to the event', () => {
    useDocument.getState().dispatch(
      addEventCommand(personId, {
        type: 'residence',
        date: { value: '1880', qualifier: 'exact' }
      })
    )
    renderSection()
    expect(screen.getByRole('status').textContent).toBe(
      'An event of Jan Kowalski is dated before their birth.'
    )
  })
})
