import { useState } from 'react'
import {
  FileDown,
  FileUp,
  FolderOpen,
  ImageDown,
  Library,
  Menu as MenuIcon,
  Plus,
  Printer,
  Save,
  SaveAll
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  anchorBelow,
  IconButton,
  Menu,
  type MenuAnchor,
  type MenuEntry
} from '@renderer/components/ui'
import { formatShortcut } from '@renderer/lib/platform'
import { newTree, openTree, saveTree, saveTreeAs } from '@renderer/services/documentFiles'
import { startCsvImport } from '@renderer/features/csv/importFlow'
import { printTree } from '@renderer/features/export/exportImage'
import { useWorkspaceUi } from '@renderer/store/workspaceUi'

/** In-app file menu (mirrors the native menu, discoverable on every platform). */
export function FileMenu(): React.JSX.Element {
  const { t } = useTranslation()
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null)
  const openDialog = useWorkspaceUi((s) => s.openDialog)
  const entries: MenuEntry[] = [
    {
      label: t('menu.newTree'),
      icon: Plus,
      shortcut: formatShortcut('Mod+N'),
      onSelect: () => void newTree()
    },
    {
      label: t('menu.open'),
      icon: FolderOpen,
      shortcut: formatShortcut('Mod+O'),
      onSelect: () => void openTree()
    },
    { type: 'separator' },
    {
      label: t('menu.save'),
      icon: Save,
      shortcut: formatShortcut('Mod+S'),
      onSelect: () => void saveTree()
    },
    {
      label: t('menu.saveAs'),
      icon: SaveAll,
      shortcut: formatShortcut('Mod+Shift+S'),
      onSelect: () => void saveTreeAs()
    },
    { type: 'separator' },
    { label: t('menu.importCsv'), icon: FileUp, onSelect: () => void startCsvImport() },
    { label: t('menu.exportCsv'), icon: FileDown, onSelect: () => openDialog('export-csv') },
    { label: t('menu.exportImage'), icon: ImageDown, onSelect: () => openDialog('export-image') },
    { type: 'separator' },
    {
      label: t('menu.sources'),
      icon: Library,
      onSelect: () => useWorkspaceUi.getState().openSources()
    },
    { type: 'separator' },
    {
      label: t('menu.print'),
      icon: Printer,
      shortcut: formatShortcut('Mod+P'),
      onSelect: () => void printTree()
    }
  ]
  return (
    <>
      <IconButton
        icon={MenuIcon}
        label={t('menu.file')}
        aria-haspopup="menu"
        aria-expanded={anchor !== null}
        onClick={(e) => setAnchor(anchorBelow(e.currentTarget))}
      />
      <Menu
        anchor={anchor}
        entries={entries}
        onClose={() => setAnchor(null)}
        label={t('menu.file')}
      />
    </>
  )
}
