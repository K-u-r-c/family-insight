import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES, type Language } from '@shared/i18n'
import { changeLanguage } from '@renderer/i18n'
import { usePreferences, type ThemePreference } from '@renderer/store/preferences'
import { SegmentedControl } from './SegmentedControl'
import { TreeLogo } from './TreeLogo'
import styles from './WelcomeScreen.module.css'

const THEMES: ThemePreference[] = ['system', 'light', 'dark']

export function WelcomeScreen(): React.JSX.Element {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = usePreferences()
  const [version, setVersion] = useState('')
  const [notice, setNotice] = useState(false)

  useEffect(() => {
    void window.ohara.getAppInfo().then((info) => setVersion(info.version))
    return window.ohara.onMenuAction(() => setNotice(true))
  }, [])

  const comingSoon = (): void => setNotice(true)

  return (
    <main className={styles.screen}>
      <div className={styles.toolbar}>
        <SegmentedControl
          label={t('settings.theme')}
          value={theme}
          options={THEMES.map((value) => ({ value, label: t(`theme.${value}`) }))}
          onChange={setTheme}
        />
        <SegmentedControl
          label={t('settings.language')}
          value={i18n.language as Language}
          options={SUPPORTED_LANGUAGES.map((value) => ({ value, label: t(`language.${value}`) }))}
          onChange={(lang) => void changeLanguage(lang)}
        />
      </div>

      <section className={styles.card}>
        <TreeLogo className={styles.logo} />
        <h1 className={styles.title}>{t('welcome.title')}</h1>
        <p className={styles.subtitle}>{t('welcome.subtitle')}</p>
        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.button} ${styles.primary}`}
            onClick={comingSoon}
          >
            {t('welcome.newTree')}
          </button>
          <button type="button" className={styles.button} onClick={comingSoon}>
            {t('welcome.openTree')}
          </button>
          <button type="button" className={styles.button} onClick={comingSoon}>
            {t('welcome.importCsv')}
          </button>
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
