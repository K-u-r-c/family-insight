import { useState } from 'react'
import { Sprout } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Dialog, TextField } from '@renderer/components/ui'

interface NewTreeDialogProps {
  onCreate: (name: string) => void
  onClose: () => void
}

/** Asks for the tree's name; the first person is created right after. */
export function NewTreeDialog({ onCreate, onClose }: NewTreeDialogProps): React.JSX.Element {
  const { t } = useTranslation()
  const [name, setName] = useState(t('tree.untitled'))
  const submit = (): void => onCreate(name.trim() || t('tree.untitled'))
  return (
    <Dialog
      open
      onClose={onClose}
      icon={Sprout}
      title={t('welcome.newTreeTitle')}
      description={t('welcome.newTreeText')}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" onClick={submit}>
            {t('welcome.create')}
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <TextField
          label={t('workspace.treeName')}
          value={name}
          maxLength={120}
          data-autofocus
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => setName(e.target.value)}
        />
      </form>
    </Dialog>
  )
}
