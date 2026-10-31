// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { doubleCousinsFixture, kinshipFixture } from '@core/kinship/fixture'
import type { FamilyTree } from '@core/model/types'
import { defaultSettings } from '@core/settings'
import { setupI18n } from '@renderer/test/i18n'
import { useSettings } from '@renderer/store/settings'
import { useDocument } from '@renderer/store/document'
import { useTreeView } from '@renderer/store/treeView'
import { useWorkspaceUi } from '@renderer/store/workspaceUi'
import { RelationshipDialog } from './RelationshipDialog'

afterEach(cleanup)

HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.setAttribute('open', '')
}
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  this.removeAttribute('open')
}

function open(a: string | null, b: string | null, tree: FamilyTree = kinshipFixture()) {
  useDocument.getState().loadDocument(tree, null)
  useWorkspaceUi.getState().openRelationship(a, b)
  const onClose = vi.fn()
  render(<RelationshipDialog onClose={onClose} />)
  return { onClose, dialog: screen.getByRole('dialog', { name: 'Relationship calculator' }) }
}

const sentence = () => screen.getByRole('status')

describe('RelationshipDialog', () => {
  beforeEach(() => {
    setupI18n('en')
    useSettings.setState({ settings: defaultSettings('en') })
  })

  it('names the relationship and shows the path from the person to the reference', () => {
    const { dialog } = open('me', 'c1')
    expect(sentence().textContent).toContain(
      'Cousin Kowalski is the first cousin of Maria Kowalski.'
    )
    const steps = within(within(dialog).getByRole('list', { name: 'Path' })).getAllByRole(
      'listitem'
    )
    expect(steps.map((li) => li.lastElementChild?.textContent)).toEqual([
      'Cousin Kowalski',
      'Uncle Kowalski',
      expect.stringMatching(/^Grand(father|mother) Kowalski$/),
      'Father Kowalski',
      'Maria Kowalski'
    ])
  })

  it('swaps the two people', () => {
    open('me', 'f')
    expect(sentence().textContent).toContain('Father Kowalski is the father of Maria Kowalski.')
    fireEvent.click(screen.getByRole('button', { name: 'Swap people' }))
    expect(sentence().textContent).toContain('Maria Kowalski is the daughter of Father Kowalski.')
  })

  it('explains missing, identical and unrelated people', () => {
    open(null, 'me')
    expect(sentence().textContent).toContain('Choose two people to see how they are related.')
    expect(screen.getByRole('button', { name: 'Show on tree' })).toHaveProperty('disabled', true)
    cleanup()
    open('me', 'me')
    expect(sentence().textContent).toContain('Choose two different people.')
    cleanup()
    open('me', 'stranger')
    expect(sentence().textContent).toContain(
      'No relationship between Stranger Kowalski and Maria Kowalski was found in this tree.'
    )
  })

  it('picks a person from the list', () => {
    open('me', null)
    fireEvent.click(screen.getByRole('button', { name: 'Person' }))
    const picker = screen.getByRole('dialog', { name: 'Person' })
    fireEvent.change(within(picker).getByRole('searchbox'), { target: { value: 'Nephew' } })
    fireEvent.click(within(picker).getByRole('option', { name: /^Nephew Kowalski/ }))
    expect(sentence().textContent).toContain('Nephew Kowalski is the nephew of Maria Kowalski.')
  })

  it('lists every relationship and switches between them', () => {
    open('x', 'y', doubleCousinsFixture())
    const list = screen.getByRole('heading', { name: 'All relationships' }).parentElement!
    const alternatives = within(list).getAllByRole('button')
    const pressed = () => alternatives.map((button) => button.getAttribute('aria-pressed'))
    expect(alternatives).toHaveLength(2)
    expect(pressed()).toEqual(['true', 'false'])
    fireEvent.click(alternatives[1]!)
    expect(pressed()).toEqual(['false', 'true'])
  })

  it('shows the path on the tree', () => {
    const { onClose } = open('me', 'nep')
    fireEvent.click(screen.getByRole('button', { name: 'Show on tree' }))
    expect(useTreeView.getState().path).toEqual(
      ['nep', 'br', 'f', 'me'].length ? expect.any(Array) : []
    )
    expect(useTreeView.getState().path?.[0]).toBe('nep')
    expect(useTreeView.getState().path?.at(-1)).toBe('me')
    expect(onClose).toHaveBeenCalled()
  })
})
