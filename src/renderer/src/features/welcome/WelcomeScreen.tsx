import { useEffect, useState } from 'react'
import { Clock, FileUp, FolderOpen, Plus, Sparkles, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { removeRecentFile } from '@core/settings'
import { TreeLogo } from '@renderer/components/TreeLogo'
import { Button, Icon, IconButton, Kbd } from '@renderer/components/ui'
import { startCsvImport } from '@renderer/features/csv/importFlow'
import { SettingsControls } from '@renderer/features/settings/SettingsControls'
import { formatShortcut } from '@renderer/lib/platform'
import { cx } from '@renderer/lib/cx'
import { newTree, openTree, openTreeAt } from '@renderer/services/documentFiles'
import { openSampleTree } from '@renderer/services/sampleTree'
import { useSettings } from '@renderer/store/settings'
import styles from './WelcomeScreen.module.css'

function useRelativeTime(): (iso: string) => string {
  const { i18n } = useTranslation()
  return (iso) => {
    const then = new Date(iso).getTime()
    if (Number.isNaN(then)) return ''
    const minutes = Math.round((then - Date.now()) / 60000)
    const rtf = new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto' })
    if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute')
    const hours = Math.round(minutes / 60)
    if (Math.abs(hours) < 24) return rtf.format(hours, 'hour')
    const days = Math.round(hours / 24)
    if (Math.abs(days) < 30) return rtf.format(days, 'day')
    return new Date(iso).toLocaleDateString(i18n.language)
  }
}

export function WelcomeScreen(): React.JSX.Element {
  const { t } = useTranslation()
  const [version, setVersion] = useState('')
  const recent = useSettings((s) => s.settings.recentFiles)
  const update = useSettings((s) => s.update)
  const [missing, setMissing] = useState<Set<string>>(new Set())
  const relative = useRelativeTime()

  useEffect(() => {
    void window.familyInsight.getAppInfo().then((info) => setVersion(info.version))
  }, [])

  useEffect(() => {
    const paths = recent.map((r) => r.path)
    void window.familyInsight
      .filesExist(paths)
      .then((exists) => setMissing(new Set(paths.filter((_, i) => !exists[i]))))
  }, [recent])

  return (
    <main className={styles.screen}>
      <div className={styles.toolbar}>
        <SettingsControls />
      </div>

      <div className={cx(styles.layout, recent.length > 0 && styles.withRecent)}>
        <section className={styles.card}>
          <TreeLogo className={styles.logo} />
          <h1 className={styles.title}>{t('welcome.title')}</h1>
          <p className={styles.subtitle}>{t('welcome.subtitle')}</p>
          <div className={styles.actions}>
            <Button variant="primary" size="lg" icon={Plus} block onClick={() => void newTree()}>
              {t('welcome.newTree')}
            </Button>
            <Button size="lg" icon={FolderOpen} block onClick={() => void openTree()}>
              {t('welcome.openTree')}
            </Button>
            <Button size="lg" icon={FileUp} block onClick={() => void startCsvImport()}>
              {t('welcome.importCsv')}
            </Button>
            <Button variant="ghost" icon={Sparkles} block onClick={() => void openSampleTree()}>
              {t('welcome.trySample')}
            </Button>
          </div>
          <p className={styles.hints}>
            <Kbd>{formatShortcut('Mod+N')}</Kbd> {t('welcome.hintNew')} ·{' '}
            <Kbd>{formatShortcut('Mod+O')}</Kbd> {t('welcome.hintOpen')} · {t('welcome.hintDrop')}
          </p>
        </section>

        {recent.length > 0 && (
          <section className={styles.recent} aria-labelledby="recent-title">
            <h2 id="recent-title" className={styles.recentTitle}>
              <Icon icon={Clock} size={14} /> {t('welcome.recent')}
            </h2>
            <ul className={styles.recentList}>
              {recent.map((file) => {
                const gone = missing.has(file.path)
                return (
                  <li key={file.path} className={cx(styles.recentItem, gone && styles.missing)}>
                    <button
                      type="button"
                      className={styles.recentOpen}
                      disabled={gone}
                      title={gone ? t('welcome.missing') : file.path}
                      onClick={() => void openTreeAt(file.path)}
                    >
                      <span className={styles.recentName}>{file.name}</span>
                      <span className={styles.recentPath}>
                        <bdi>{file.path}</bdi>
                      </span>
                      <span className={styles.recentMeta}>
                        {gone ? t('welcome.missing') : relative(file.openedAt)}
                      </span>
                    </button>
                    <IconButton
                      icon={X}
                      size="sm"
                      label={t('welcome.removeRecent', { name: file.name })}
                      onClick={() =>
                        void update({ recentFiles: removeRecentFile(recent, file.path) })
                      }
                    />
                  </li>
                )
              })}
            </ul>
          </section>
        )}
      </div>

      <footer className={styles.footer}>
        {t('app.name')} {version && `v${version}`} · {t('app.tagline')}
      </footer>
    </main>
  )
}
