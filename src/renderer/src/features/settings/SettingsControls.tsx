import { Languages, Monitor, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { languageOptions } from '@shared/i18n'
import { SegmentedControl } from '@renderer/components/ui'
import { changeLanguage } from '@renderer/i18n'
import type { ThemePreference } from '@core/settings'
import { useSettings } from '@renderer/store/settings'
import styles from './SettingsControls.module.css'

const THEME_ICONS = { system: Monitor, light: Sun, dark: Moon }

/** Theme + language switches, used on the welcome screen and in the settings menu. */
export function SettingsControls(): React.JSX.Element {
  const { t, i18n } = useTranslation()
  const theme = useSettings((s) => s.settings.theme)
  const update = useSettings((s) => s.update)
  const setTheme = (value: ThemePreference): void => void update({ theme: value })
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
      <label className={styles.language}>
        <Languages size={16} aria-hidden="true" />
        <select
          aria-label={t('settings.language')}
          value={i18n.language}
          onChange={(e) => void changeLanguage(e.target.value)}
        >
          {languageOptions().map(({ value, label }) => (
            <option key={value} value={value} lang={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
