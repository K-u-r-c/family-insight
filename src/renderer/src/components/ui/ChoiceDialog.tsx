import { useTranslation } from 'react-i18next'
import { create } from 'zustand'
import { Button } from './Button'
import { Dialog } from './Dialog'
import styles from './ChoiceDialog.module.css'

export interface Choice<T extends string> {
  value: T
  label: string
  description?: string
}

interface ChoiceRequest {
  title: string
  message?: string
  options: Choice<string>[]
  resolve: (value: string | null) => void
}

const useChoiceStore = create<{ request: ChoiceRequest | null }>(() => ({ request: null }))

/** Asks the user to pick one option; resolves to `null` when cancelled. */
export function choose<T extends string>(options: {
  title: string
  message?: string
  options: Choice<T>[]
}): Promise<T | null> {
  return new Promise((resolve) => {
    useChoiceStore.getState().request?.resolve(null)
    useChoiceStore.setState({
      request: { ...options, resolve: resolve as (v: string | null) => void }
    })
  })
}

export function ChoiceHost(): React.JSX.Element | null {
  const { t } = useTranslation()
  const request = useChoiceStore((s) => s.request)
  if (!request) return null
  const done = (value: string | null): void => {
    request.resolve(value)
    useChoiceStore.setState({ request: null })
  }
  return (
    <Dialog
      open
      onClose={() => done(null)}
      title={request.title}
      description={request.message}
      footer={<Button onClick={() => done(null)}>{t('common.cancel')}</Button>}
    >
      <div className={styles.list} role="list">
        {request.options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="listitem"
            className={styles.option}
            onClick={() => done(o.value)}
          >
            <span className={styles.label}>{o.label}</span>
            {o.description && <span className={styles.description}>{o.description}</span>}
          </button>
        ))}
      </div>
    </Dialog>
  )
}
