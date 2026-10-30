// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getCitations } from '@core/model/sources'
import { setupI18n } from '@renderer/test/i18n'
import { ConfirmHost, Toaster } from '@renderer/components/ui'
import { addCitationCommand, addPersonCommand, addSourceCommand } from '@renderer/store/commands'
import { useDocument } from '@renderer/store/document'
import { useWorkspaceUi } from '@renderer/store/workspaceUi'
import { CitationsDialog } from './CitationsDialog'
import { SourcesDialog } from './SourcesDialog'

afterEach(cleanup)

// jsdom has no <dialog> methods.
HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.setAttribute('open', '')
}
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  this.removeAttribute('open')
}

let jan = ''
const tree = () => useDocument.getState().tree!

beforeEach(() => {
  setupI18n('en')
  useDocument.getState().newDocument('Test')
  useWorkspaceUi.setState({ dialog: null, sourceId: null, citing: null })
  jan = useDocument.getState().dispatch(
    addPersonCommand({
      givenNames: 'Jan',
      surname: 'Kowalski',
      sex: 'male',
      birth: { date: { value: '1890', qualifier: 'exact' } }
    })
  ).id
})

const birth = () => ({ kind: 'birth' as const, personId: jan })

describe('CitationsDialog', () => {
  it('creates a new source and cites it, then edits the citation', () => {
    const view = render(<CitationsDialog target={birth()} onClose={() => {}} />)
    expect(screen.getByText('No sources for this fact yet.')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('New source'), {
      target: { value: 'Parish register 1890' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create and cite' }))
    view.rerender(<CitationsDialog target={birth()} onClose={() => {}} />)
    const [citation] = getCitations(tree(), birth())
    expect(tree().sources[citation!.sourceId]!.title).toBe('Parish register 1890')
    const page = screen.getByLabelText('Page or entry')
    fireEvent.change(page, { target: { value: '12' } })
    fireEvent.blur(page)
    fireEvent.change(screen.getByLabelText('Reliability'), { target: { value: 'primary' } })
    expect(getCitations(tree(), birth())[0]).toMatchObject({ page: '12', quality: 'primary' })
  })

  it('cites an existing source and removes the citation with undo', () => {
    const source = useDocument.getState().dispatch(addSourceCommand({ title: 'Census 1921' }))
    const ui = (
      <>
        <CitationsDialog target={birth()} onClose={() => {}} />
        <Toaster />
      </>
    )
    const view = render(ui)
    fireEvent.change(screen.getByLabelText('Existing source'), { target: { value: source.id } })
    view.rerender(ui)
    expect(getCitations(tree(), birth())).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Remove citation of Census 1921' }))
    view.rerender(ui)
    expect(getCitations(tree(), birth())).toHaveLength(0)
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Undo' })))
    expect(getCitations(tree(), birth())).toHaveLength(1)
  })
})

describe('SourcesDialog', () => {
  it('creates and edits a source and adds a repository', () => {
    const view = render(<SourcesDialog onClose={() => {}} />)
    expect(screen.getByText(/No sources yet/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'New source' }))
    view.rerender(<SourcesDialog onClose={() => {}} />)
    const title = screen.getByLabelText('Title')
    fireEvent.change(title, { target: { value: 'Book of baptisms' } })
    fireEvent.blur(title)
    fireEvent.change(screen.getByLabelText('New repository'), {
      target: { value: 'Diocesan archive' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    const [source] = Object.values(tree().sources)
    expect(source!.title).toBe('Book of baptisms')
    expect(tree().repositories[source!.repositoryId!]!.name).toBe('Diocesan archive')
  })

  it('lists what cites a source and asks before deleting a cited source', async () => {
    const source = useDocument.getState().dispatch(addSourceCommand({ title: 'Census 1921' }))
    useDocument.getState().dispatch(addCitationCommand(birth(), { sourceId: source.id }))
    useWorkspaceUi.setState({ sourceId: source.id })
    const ui = (
      <>
        <SourcesDialog onClose={() => {}} />
        <ConfirmHost />
      </>
    )
    const view = render(ui)
    expect(screen.getByText('Cited by 1 fact')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Jan Kowalski – Born' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Delete source' }))
    expect(
      await screen.findByText('It is cited 1 time. The citation will be removed too.')
    ).toBeTruthy()
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Delete' })))
    view.rerender(ui)
    expect(tree().sources).toEqual({})
    expect(getCitations(tree(), birth())).toEqual([])
  })
})
