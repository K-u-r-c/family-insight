import { BrowserWindow, Menu, type MenuItemConstructorOptions } from 'electron'
import { t } from './i18n'

/** Localized cut/copy/paste menu for text fields and selected text (Electron has none by default). */
export function attachEditContextMenu(window: BrowserWindow): void {
  window.webContents.on('context-menu', (_event, params) => {
    const { isEditable, selectionText, editFlags } = params
    if (!isEditable && !selectionText.trim()) return
    const items: MenuItemConstructorOptions[] = isEditable
      ? [
          { label: t('menu.undo'), role: 'undo', enabled: editFlags.canUndo },
          { label: t('menu.redo'), role: 'redo', enabled: editFlags.canRedo },
          { type: 'separator' },
          { label: t('menu.cut'), role: 'cut', enabled: editFlags.canCut },
          { label: t('menu.copy'), role: 'copy', enabled: editFlags.canCopy },
          { label: t('menu.paste'), role: 'paste', enabled: editFlags.canPaste },
          { type: 'separator' },
          { label: t('menu.selectAll'), role: 'selectAll', enabled: editFlags.canSelectAll }
        ]
      : [{ label: t('menu.copy'), role: 'copy' }]
    Menu.buildFromTemplate(items).popup({ window })
  })
}
