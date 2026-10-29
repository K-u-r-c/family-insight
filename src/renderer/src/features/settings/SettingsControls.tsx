import { Monitor, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES, type Language } from '@shared/i18n'
import { SegmentedControl } from '@renderer/components/ui'
import { changeLanguage } from '@renderer/i18n'
import { usePreferences, type ThemePreference } from '@renderer/store/preferences'
import styles from './SettingsControls.module.css'

const THEME_ICONS = { system: Monitor, light: Sun, dark: Moon }

/** Theme + language switches, used on the welcome screen and in the settings menu. */
export function SettingsControls(): React.JSX.Element {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = usePreferences()
  return (
    <div className={styles.row}>
      <SegmentedControl
        label={t('settings.theme')}
        value={theme}
        options={(Object.keys(THEME_ICONS) as ThemePreference[]).map((value) => ({
          value,
          label: t(`theme.${value}`),
          icon: THEME_ICONS[value]
        }))}
        onChange={setTheme}
      />
      <SegmentedControl
        label={t('settings.language')}
        value={i18n.language as Language}
        options={SUPPORTED_LANGUAGES.map((value) => ({ value, label: t(`language.${value}`) }))}
        onChange={(lang) => void changeLanguage(lang)}
      />
    </div>
  )
}
