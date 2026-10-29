import { useState } from 'react'
import { Settings2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ThemePreference } from '@core/settings'
import { SUPPORTED_LANGUAGES } from '@shared/i18n'
import {
  anchorBelow,
  IconButton,
  Menu,
  type MenuAnchor,
  type MenuEntry
} from '@renderer/components/ui'
import { changeLanguage } from '@renderer/i18n'
import { useSettings } from '@renderer/store/settings'

const THEMES: ThemePreference[] = ['system', 'light', 'dark']

/** Gear menu with appearance and language choices. */
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
    { type: 'heading', label: t('settings.language') },
    ...SUPPORTED_LANGUAGES.map((lang) => ({
      label: t(`language.${lang}`),
      checked: i18n.language === lang,
      onSelect: () => void changeLanguage(lang)
    })),
    { type: 'separator' },
    {
      label: t('settings.autosave'),
      checked: settings.autosave,
      onSelect: () => void update({ autosave: !settings.autosave })
    }
  ]

  return (
    <>
      <IconButton
        icon={Settings2}
        label={t('settings.title')}
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
