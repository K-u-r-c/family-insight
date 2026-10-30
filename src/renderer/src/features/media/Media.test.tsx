// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { peopleOfMedia } from '@core/model/media'
import type { MediaMime } from '@core/model/types'
import { setupI18n } from '@renderer/test/i18n'
import { Toaster } from '@renderer/components/ui'
import { useMedia } from '@renderer/services/media'
import { addPersonCommand, addPersonMediaCommand } from '@renderer/store/commands'
import { useDocument } from '@renderer/store/document'
import { useWorkspaceUi } from '@renderer/store/workspaceUi'
import { GallerySection } from './GallerySection'
import { MediaDetailsDialog } from './MediaDetailsDialog'
import { MediaViewer } from './MediaViewer'

afterEach(cleanup)

// jsdom has no <dialog> methods and no object URLs.
HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.setAttribute('open', '')
}
URL.createObjectURL ??= () => 'blob:test'
URL.revokeObjectURL ??= () => {}

const api = {
  getMedia: vi.fn(async () => new Uint8Array([1, 2, 3])),
  releaseMediaLibrary: vi.fn(async () => {})
}
;(window as unknown as { familyInsight: unknown }).familyInsight = api

let jan = ''
let anna = ''
const tree = () => useDocument.getState().tree!
const person = () => tree().persons[jan]!
const item = (fileName: string, mime: MediaMime = 'image/jpeg') => ({
  hash: fileName.charCodeAt(0).toString(16).padStart(2, '0').repeat(32),
  mime,
  fileName
})

beforeEach(() => {
  setupI18n('en')
  useDocument.getState().newDocument('Test')
  useMedia.setState({ documentId: useDocument.getState().documentId, library: 'lib', thumbs: {} })
  useWorkspaceUi.setState({ viewing: null, editingMedia: null })
  const dispatch = useDocument.getState().dispatch
  jan = dispatch(addPersonCommand({ givenNames: 'Jan', surname: 'Kowalski', sex: 'male' })).id
  anna = dispatch(addPersonCommand({ givenNames: 'Anna', surname: 'Nowak', sex: 'female' })).id
  dispatch(
    addPersonMediaCommand(jan, [
      { ...item('a-wedding.jpg'), title: 'Wedding', date: { value: '1950', qualifier: 'exact' } },
      item('b-house.jpg'),
      item('c-akt.pdf', 'application/pdf')
    ])
  )
})

function renderGallery() {
  const result = render(
    <>
      <GallerySection person={person()} />
      <Toaster />
    </>
  )
  return () =>
    result.rerender(
      <>
        <GallerySection person={person()} />
        <Toaster />
      </>
    )
}

describe('GallerySection', () => {
  it('lists the items with titles and opens the viewer at the clicked one', () => {
    renderGallery()
    expect(screen.getByRole('heading', { name: /Photos and documents/ }).textContent).toContain('3')
    expect(screen.getByText('Wedding')).toBeTruthy()
    expect(screen.getByText('PDF')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Open b-house.jpg' }))
    expect(useWorkspaceUi.getState().viewing).toEqual({
      mediaIds: person().mediaIds,
      index: 1,
      personId: jan
    })
  })

  it('reorders items from the menu', () => {
    renderGallery()
    fireEvent.click(screen.getByRole('button', { name: 'Actions for Wedding' }))
    expect(
      screen.getByRole('menuitem', { name: 'Move earlier' }).hasAttribute('disabled') ||
        screen.getByRole('menuitem', { name: 'Move earlier' }).getAttribute('aria-disabled')
    ).toBeTruthy()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Move later' }))
    const titles = person().mediaIds!.map((id) => tree().media[id]!.fileName)
    expect(titles).toEqual(['b-house.jpg', 'a-wedding.jpg', 'c-akt.pdf'])
  })

  it('removes an item (and its unused file) with undo', () => {
    const rerender = renderGallery()
    fireEvent.click(screen.getByRole('button', { name: 'Actions for b-house.jpg' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Remove from Jan' }))
    rerender()
    expect(person().mediaIds).toHaveLength(2)
    expect(Object.values(tree().media).map((m) => m.fileName)).not.toContain('b-house.jpg')
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Undo' })))
    expect(person().mediaIds).toHaveLength(3)
  })

  it('offers the portrait only for images', () => {
    renderGallery()
    fireEvent.click(screen.getByRole('button', { name: 'Actions for c-akt.pdf' }))
    expect(screen.queryByRole('menuitem', { name: 'Use as portrait…' })).toBeNull()
  })
})

describe('MediaViewer', () => {
  it('shows the item with its position and moves with the arrow keys', async () => {
    useWorkspaceUi.getState().viewMedia(person().mediaIds!, 0, jan)
    const view = render(<MediaViewer />)
    expect(screen.getByRole('heading', { name: 'Wedding' })).toBeTruthy()
    expect(screen.getByText('1 of 3 · 1950')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement).disabled).toBe(
      true
    )
    await waitFor(() => expect(screen.getByRole('img', { name: 'Wedding' })).toBeTruthy())
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'ArrowRight' })
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'ArrowRight' })
    view.rerender(<MediaViewer />)
    expect(useWorkspaceUi.getState().viewing!.index).toBe(2)
    // PDFs open in the built-in PDF viewer.
    await waitFor(() => expect(screen.getByTitle('c-akt.pdf').tagName).toBe('IFRAME'))
    expect((screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('zooms images with the toolbar', async () => {
    useWorkspaceUi.getState().viewMedia(person().mediaIds!, 0)
    render(<MediaViewer />)
    await waitFor(() => screen.getByRole('button', { name: 'Zoom in' }))
    const level = () => screen.getByText(/%$/).textContent
    const before = level()
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }))
    expect(level()).not.toBe(before)
  })
})

describe('MediaDetailsDialog', () => {
  it('edits the title and shows the item on another person', () => {
    const wedding = person().mediaIds![0]!
    useWorkspaceUi.getState().setEditingMedia(wedding)
    render(<MediaDetailsDialog />)
    const title = screen.getByLabelText('Title')
    fireEvent.change(title, { target: { value: 'Ślub' } })
    fireEvent.blur(title)
    expect(tree().media[wedding]!.title).toBe('Ślub')
    // The only reference can't be removed here (the item would become unreachable).
    expect(screen.queryByRole('button', { name: 'Hide from Jan Kowalski' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Add person…' }))
    fireEvent.click(screen.getByRole('option', { name: /Anna Nowak/ }))
    expect(peopleOfMedia(tree(), wedding).map((p) => p.id)).toEqual([jan, anna])
  })
})
