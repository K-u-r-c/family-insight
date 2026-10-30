import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ISSUES_URL, LICENSE_URL, PROJECT_URL } from '@shared/links'
import { TreeLogo } from '@renderer/components/TreeLogo'
import { Button, Dialog } from '@renderer/components/ui'
import styles from './AboutDialog.module.css'

export function AboutDialog({ onClose }: { onClose: () => void }): React.JSX.Element {
  const { t } = useTranslation()
  const [version, setVersion] = useState('')
  useEffect(() => {
    void window.familyInsight.getAppInfo().then((info) => setVersion(info.version))
  }, [])
  const open = (url: string): void => void window.open(url, '_blank', 'noopener')
  return (
    <Dialog
      open
      onClose={onClose}
      title={t('app.name')}
      description={t('about.version', { version })}
      footer={
        <Button variant="primary" onClick={onClose}>
          {t('common.close')}
        </Button>
      }
    >
      <div className={styles.body}>
        <TreeLogo className={styles.logo} />
        <p className={styles.tagline}>{t('app.tagline')}</p>
        <p className={styles.text}>{t('about.text')}</p>
        <div className={styles.links}>
          <Button size="sm" onClick={() => open(PROJECT_URL)}>
            {t('about.website')}
          </Button>
          <Button size="sm" onClick={() => open(ISSUES_URL)}>
            {t('menu.reportBug')}
          </Button>
          <Button size="sm" onClick={() => open(LICENSE_URL)}>
            {t('about.license')}
          </Button>
        </div>
        <p className={styles.credits}>{t('about.credits')}</p>
      </div>
    </Dialog>
  )
}
