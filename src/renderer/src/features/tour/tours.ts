import type { TourStep } from '@core/tour'
import { useDocument } from '@renderer/store/document'
import { useWorkspaceUi } from '@renderer/store/workspaceUi'

/** What "wait for" conditions can look at. */
export interface TourContext {
  hasTree: boolean
  people: number
  selected: boolean
  editing: boolean
  parentLinks: number
}

export function tourContext(): TourContext {
  const { tree, selectedPersonId } = useDocument.getState()
  return {
    hasTree: tree !== null,
    people: tree ? Object.keys(tree.persons).length : 0,
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
export const TOURS: Record<string, TourStepDef[]> = {
  basics: [
    {
      id: 'add',
      target: 'add-person',
      title: 'tour.basics.add.title',
      body: 'tour.basics.add.body'
    },
    {
      id: 'views',
      target: 'view-modes',
      title: 'tour.basics.views.title',
      body: 'tour.basics.views.body'
    },
    {
      id: 'search',
      target: 'search',
      title: 'tour.basics.search.title',
      body: 'tour.basics.search.body'
    },
    {
      id: 'settings',
      target: 'settings',
      title: 'tour.basics.settings.title',
      body: 'tour.basics.settings.body'
    }
  ]
}
