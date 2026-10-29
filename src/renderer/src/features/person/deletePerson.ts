import { relationshipCount } from '@core/model/operations'
import { displayName } from '@core/model/tree'
import type { PersonId } from '@core/model/types'
import { confirm, toast } from '@renderer/components/ui'
import i18n from '@renderer/i18n'
import { removePersonCommand } from '@renderer/store/commands'
import { useDocument } from '@renderer/store/document'

const t = (key: string, options?: Record<string, unknown>): string =>
  i18n.t(key as never, options as never) as unknown as string

/** Asks for confirmation, deletes the person (one undoable step) and offers Undo. */
export async function deletePersonWithConfirm(id: PersonId): Promise<void> {
  const { tree } = useDocument.getState()
  const person = tree?.persons[id]
  if (!tree || !person) return
  const name = displayName(person) || t('person.unnamed')
  const count = relationshipCount(tree, id)
  const ok = await confirm({
    title: t('person.deleteTitle', { name }),
    message:
      count === 0
        ? t('person.deleteMessageNone', { name })
        : t('person.deleteMessage', { name, count }),
    confirmLabel: t('common.delete'),
    danger: true
  })
  if (!ok) return
  useDocument.getState().dispatch(removePersonCommand(id))
  toast({
    message: t('person.deleted', { name }),
    action: { label: t('common.undo'), onClick: () => useDocument.getState().undo() }
  })
}
