// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { setupI18n } from '@renderer/test/i18n'
import { DateField, dateToInput } from './DateField'

afterEach(cleanup)

function setup(language: 'en' | 'pl', value?: { value: string; qualifier: 'exact' | 'about' }) {
  setupI18n(language)
  const onCommit = vi.fn()
  render(<DateField label="Birth" value={value} onCommit={onCommit} />)
  const input = screen.getByLabelText('Birth') as HTMLInputElement
  return { input, onCommit }
}

describe('DateField', () => {
  it('shows a live preview of the parsed date', () => {
    const { input } = setup('pl')
    fireEvent.change(input, { target: { value: '12.05.1890' } })
    expect(screen.getByText('12 maja 1890')).toBeTruthy()
    fireEvent.change(input, { target: { value: '~05.1890' } })
    expect(screen.getByText('ok. maja 1890')).toBeTruthy()
  })

  it('shows an inline error and does not commit invalid input', () => {
    const { input, onCommit } = setup('en')
    fireEvent.change(input, { target: { value: '31.02.1890' } })
    expect(screen.getByRole('alert').textContent).toContain("doesn't look like a date")
    expect(input.getAttribute('aria-invalid')).toBe('true')
    fireEvent.blur(input)
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('commits valid dates on blur and Enter, and clears with empty input', () => {
    const { input, onCommit } = setup('en', { value: '1890', qualifier: 'exact' })
    expect(input.value).toBe('1890')
    fireEvent.change(input, { target: { value: 'abt 1891-02' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onCommit).toHaveBeenLastCalledWith({ value: '1891-02', qualifier: 'about' })
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.blur(input)
    expect(onCommit).toHaveBeenLastCalledWith(undefined)
  })

  it('reverts the draft on Escape', () => {
    const { input, onCommit } = setup('en', { value: '1890', qualifier: 'exact' })
    input.focus()
    fireEvent.change(input, { target: { value: '1999' } })
    act(() => {
      fireEvent.keyDown(input, { key: 'Escape' })
    })
    expect(input.value).toBe('1890')
    expect(document.activeElement).not.toBe(input)
    expect(onCommit).not.toHaveBeenCalled()
  })

  it('applies the qualifier selector', () => {
    const { onCommit } = setup('en', { value: '1890', qualifier: 'exact' })
    fireEvent.change(screen.getByLabelText('Date precision'), { target: { value: 'before' } })
    expect(onCommit).toHaveBeenCalledWith({ value: '1890', qualifier: 'before' })
  })

  it('formats editable text per language', () => {
    expect(dateToInput({ value: '1890-05-12', qualifier: 'exact' }, 'pl')).toBe('12.05.1890')
    expect(dateToInput({ value: '1890-05', qualifier: 'exact' }, 'pl')).toBe('05.1890')
    expect(dateToInput({ value: '1890-05-12', qualifier: 'exact' }, 'en')).toBe('1890-05-12')
  })
})
