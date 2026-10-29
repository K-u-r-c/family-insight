import { useEffect, useState } from 'react'
import { FileUp, FolderOpen, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TreeLogo } from '@renderer/components/TreeLogo'
import { Button } from '@renderer/components/ui'
import { SettingsControls } from '@renderer/features/settings/SettingsControls'
import { useDocument } from '@renderer/store/document'
import styles from './WelcomeScreen.module.css'

export function WelcomeScreen(): React.JSX.Element {
  const { t } = useTranslation()
  const [version, setVersion] = useState('')
  const [notice, setNotice] = useState(false)

  useEffect(() => {
    void window.familyInsight.getAppInfo().then((info) => setVersion(info.version))
    return window.familyInsight.onMenuAction(() => setNotice(true))
  }, [])

  const newDocument = useDocument((s) => s.newDocument)
  const comingSoon = (): void => setNotice(true)

  return (
    <main className={styles.screen}>
      <div className={styles.toolbar}>
        <SettingsControls />
      </div>

      <section className={styles.card}>
        <TreeLogo className={styles.logo} />
        <h1 className={styles.title}>{t('welcome.title')}</h1>
        <p className={styles.subtitle}>{t('welcome.subtitle')}</p>
        <div className={styles.actions}>
          <Button
            variant="primary"
            size="lg"
            icon={Plus}
            block
            onClick={() => newDocument(t('tree.untitled'))}
          >
            {t('welcome.newTree')}
          </Button>
          <Button size="lg" icon={FolderOpen} block onClick={comingSoon}>
            {t('welcome.openTree')}
          </Button>
          <Button size="lg" icon={FileUp} block onClick={comingSoon}>
            {t('welcome.importCsv')}
          </Button>
        </div>
        <p className={styles.notice} role="status">
          {notice ? t('welcome.comingSoon') : ''}
        </p>
      </section>

      <footer className={styles.footer}>
        {t('app.name')} {version && `v${version}`} · {t('app.tagline')}
      </footer>
    </main>
  )
}
