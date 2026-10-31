import { useState } from 'react'
import { Settings2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { APP_STYLES, type ThemePreference } from '@core/settings'
import { languageOptions } from '@shared/i18n'
import {
  anchorBelow,
  IconButton,
  Menu,
  type MenuAnchor,
  type MenuEntry
} from '@renderer/components/ui'
import i18n, { changeLanguage } from '@renderer/i18n'
import { checkForUpdatesManually } from '@renderer/features/updates/updates'
import { useSettings } from '@renderer/store/settings'

const THEMES: ThemePreference[] = ['system', 'light', 'dark']

/** Gear menu with appearance and language choices. */
/** "today 10:15" style time of the last update check. */
function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })
}

export function SettingsMenu(): React.JSX.Element {
  const { t, i18n } = useTranslation()
  const settings = useSettings((s) => s.settings)
  const update = useSettings((s) => s.update)
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null)

  const entries: MenuEntry[] = [
    { type: 'heading', label: t('settings.theme') },
    ...THEMES.map((theme) => ({
      label: t(`theme.${theme}`),
      checked: settings.theme === theme,
      onSelect: () => void update({ theme })
    })),
    { type: 'separator' },
    { type: 'heading', label: t('settings.style') },
    ...APP_STYLES.map((style) => ({
      label: t(`style.${style}`),
      checked: settings.style === style,
      onSelect: () => void update({ style })
    })),
    { type: 'separator' },
    { type: 'heading', label: t('settings.language') },
    ...languageOptions().map(({ value, label }) => ({
      label,
      checked: i18n.language === value,
      onSelect: () => void changeLanguage(value)
    })),
    { type: 'separator' },
    { type: 'heading', label: t('settings.density') },
    ...(['comfortable', 'compact'] as const).map((density) => ({
      label: t(`settings.densityOption.${density}`),
      checked: settings.density === density,
      onSelect: () => void update({ density })
    })),
    { type: 'separator' },
    {
      label: t('settings.autosave'),
      checked: settings.autosave,
      onSelect: () => void update({ autosave: !settings.autosave })
    },
    {
      label: t('settings.onlinePlaceLookup'),
      checked: settings.onlinePlaceLookup,
      onSelect: () => void update({ onlinePlaceLookup: !settings.onlinePlaceLookup })
    },
    {
      label: t('settings.onlineMaps'),
      checked: settings.onlineMaps,
      onSelect: () => void update({ onlineMaps: !settings.onlineMaps })
    },
    {
      label: t('settings.showTips'),
      checked: settings.showTips,
      onSelect: () => void update({ showTips: !settings.showTips })
    },
    {
      label: t('tour.reset'),
      onSelect: () => void update({ tours: [], tips: [], showTips: true })
    },
    { type: 'separator' },
    { type: 'heading', label: t('updates.title') },
    {
      label: t('updates.automatic'),
      checked: settings.updates.checkAutomatically,
      onSelect: () =>
        void update({
          updates: { ...settings.updates, checkAutomatically: !settings.updates.checkAutomatically }
        })
    },
    {
      label: settings.updates.lastCheck
        ? t('updates.checkNowLast', { when: formatWhen(settings.updates.lastCheck) })
        : t('updates.checkNow'),
      onSelect: () => void checkForUpdatesManually()
    }
  ]

  return (
    <>
      <IconButton
        icon={Settings2}
        label={t('settings.title')}
        data-tour="settings"
        aria-haspopup="menu"
        aria-expanded={anchor !== null}
        onClick={(e) => setAnchor(anchorBelow(e.currentTarget, true))}
      />
      <Menu
        anchor={anchor}
        entries={entries}
        onClose={() => setAnchor(null)}
        label={t('settings.title')}
      />
    </>
  )
}
