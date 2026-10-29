import { useRef } from 'react'
import { AlertTriangle, HelpCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { create } from 'zustand'
import { Button } from './Button'
import { Dialog } from './Dialog'

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

interface ConfirmState {
  request: (ConfirmOptions & { resolve: (ok: boolean) => void }) | null
}

const useConfirmStore = create<ConfirmState>(() => ({ request: null }))

/** Shows a confirmation dialog and resolves to `true` when the user confirms. */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    useConfirmStore.getState().request?.resolve(false)
    useConfirmStore.setState({ request: { ...options, resolve } })
  })
}

/** Mount once near the root of the app. */
export function ConfirmHost(): React.JSX.Element | null {
  const { t } = useTranslation()
  const request = useConfirmStore((s) => s.request)
  const confirmRef = useRef<HTMLButtonElement>(null)
  if (!request) return null
  const done = (ok: boolean): void => {
    request.resolve(ok)
    useConfirmStore.setState({ request: null })
  }
  return (
    <Dialog
      open
      onClose={() => done(false)}
      title={request.title}
      description={request.message}
      icon={request.danger ? AlertTriangle : HelpCircle}
      tone={request.danger ? 'danger' : 'info'}
      initialFocus={confirmRef}
      footer={
        <>
          <Button onClick={() => done(false)}>{request.cancelLabel ?? t('common.cancel')}</Button>
          <Button
            ref={confirmRef}
            variant={request.danger ? 'danger' : 'primary'}
            onClick={() => done(true)}
          >
            {request.confirmLabel ?? t('common.ok')}
          </Button>
        </>
      }
    />
  )
}
