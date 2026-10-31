import { useEffect, useState } from 'react'
import { Lightbulb } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { HintId } from '@core/hints'
import { Button, Icon } from '@renderer/components/ui'
import { disableTips, useHints } from './hintStore'
import styles from './Hint.module.css'

/**
 * A one-time tip inside a dialog or view, the first time the user opens it. It sits in the
 * content (works inside modal dialogs) and never takes the focus.
 */
export function Hint({ id }: { id: HintId }): React.JSX.Element | null {
  const { t } = useTranslation()
  // Claimed once when the dialog or view opens (repeat claims for the same hint are harmless).
  const [visible] = useState(() => useHints.getState().claim(id))
  const dismissed = useHints((s) => s.dismissed.includes(id))

  // Shown once: leaving the dialog or view closes it for this session too.
  useEffect(
    () => () => {
      if (useHints.getState().shown === id) useHints.getState().dismiss(id)
    },
    [id]
  )

  if (!visible || dismissed) return null
  return (
    <section className={styles.hint} role="note" aria-label={t('hint.label')} data-hint={id}>
      <Icon icon={Lightbulb} size={16} className={styles.icon} />
      <div className={styles.content}>
        <p className={styles.text}>{t(`hint.${id}` as never)}</p>
        <div className={styles.actions}>
          <Button size="sm" onClick={() => useHints.getState().dismiss(id)}>
            {t('hint.gotIt')}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => disableTips(id)}>
            {t('hint.dontShow')}
          </Button>
        </div>
      </div>
    </section>
  )
}
