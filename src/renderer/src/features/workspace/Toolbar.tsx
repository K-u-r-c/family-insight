import { Redo2, Search, Undo2, UserPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TreeLogo } from '@renderer/components/TreeLogo'
import { Button, IconButton, TextField } from '@renderer/components/ui'
import { formatShortcut } from '@renderer/lib/platform'
import { useWorkspaceUi } from '@renderer/store/workspaceUi'
import { FileMenu } from './FileMenu'
import { SettingsMenu } from './SettingsMenu'
import { TreeNameField } from './TreeNameField'
import styles from './Toolbar.module.css'

interface ToolbarProps {
  onAddPerson: () => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
}

export function Toolbar({
  onAddPerson,
  canUndo,
  canRedo,
  onUndo,
  onRedo
}: ToolbarProps): React.JSX.Element {
  const { t } = useTranslation()
  const query = useWorkspaceUi((s) => s.query)
  const setQuery = useWorkspaceUi((s) => s.setQuery)

  return (
    <header className={styles.toolbar}>
      <FileMenu />
      <div className={styles.brand}>
        <TreeLogo className={styles.logo} />
        <TreeNameField />
      </div>
      <div className={styles.divider} />
      <Button
        variant="primary"
        size="sm"
        icon={UserPlus}
        onClick={onAddPerson}
        title={formatShortcut('Mod+Shift+N')}
      >
        {t('workspace.addPerson')}
      </Button>
      <div className={styles.group}>
        <IconButton
          icon={Undo2}
          label={t('common.undo')}
          shortcut={formatShortcut('Mod+Z')}
          disabled={!canUndo}
          onClick={onUndo}
        />
        <IconButton
          icon={Redo2}
          label={t('common.redo')}
          shortcut={formatShortcut('Mod+Shift+Z')}
          disabled={!canRedo}
          onClick={onRedo}
        />
      </div>
      <div className={styles.spacer} />
      <TextField
        id="workspace-search"
        className={styles.search}
        icon={Search}
        type="search"
        label={t('common.search')}
        hideLabel
        placeholder={`${t('workspace.searchPlaceholder')} (${formatShortcut('Mod+F')})`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setQuery('')
          if (e.key === 'ArrowDown' || e.key === 'Enter') {
            const first = document.querySelector<HTMLElement>('#people-list [data-index="0"]')
            if (first) {
              e.preventDefault()
              first.focus()
            }
          }
        }}
      />
      <SettingsMenu />
    </header>
  )
}
