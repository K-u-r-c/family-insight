import type { TourStep } from '@core/tour'
import { useDocument } from '@renderer/store/document'
import { useWorkspaceUi } from '@renderer/store/workspaceUi'

/** What "wait for" conditions can look at. */
export interface TourContext {
  hasTree: boolean
  people: number
  /** People with a given name or surname. */
  named: number
  selected: boolean
  editing: boolean
  parentLinks: number
}

export function tourContext(): TourContext {
  const { tree, selectedPersonId } = useDocument.getState()
  const persons = tree ? Object.values(tree.persons) : []
  return {
    hasTree: tree !== null,
    people: persons.length,
    named: persons.filter((p) => p.givenNames.trim() || p.surname.trim()).length,
    selected: selectedPersonId !== null,
    editing: useWorkspaceUi.getState().editingId !== null,
    parentLinks: tree
      ? Object.values(tree.relationships).filter((r) => r.type === 'parent-child').length
      : 0
  }
}

export interface TourStepDef extends TourStep<TourContext> {
  /** i18n keys of the popover's title and text. */
  title: string
  body: string
}

/**
 * The tours, by id. Targets are `data-tour` attributes in the UI; a step whose target is not on
 * screen is shown centred. See docs/developer/howto/tour.md.
 */
const step = (id: string, target: string, waitFor?: TourStepDef['waitFor']): TourStepDef => ({
  id,
  target,
  title: `tour.firstRun.${id}.title`,
  body: `tour.firstRun.${id}.body`,
  waitFor
})

export const FIRST_RUN = 'first-run'

export const TOURS: Record<string, TourStepDef[]> = {
  // Builds the first tree hand in hand; steps that are already done advance by themselves, so
  // the tour also works when started (Help → Show guided tour) with a tree open.
  [FIRST_RUN]: [
    step('start', 'new-tree', (c) => c.hasTree),
    step('yourself', 'person-name', (c) => c.named > 0 && !c.editing),
    step('details', 'person-panel'),
    step('parent', 'add-parent', (c) => c.parentLinks > 0 && !c.editing),
    step('canvas', 'canvas-controls'),
    step('views', 'view-modes'),
    step('search', 'search'),
    step('save', 'file-menu')
  ]
}
