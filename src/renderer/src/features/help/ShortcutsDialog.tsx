import { Keyboard } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Dialog, Kbd } from '@renderer/components/ui'
import { formatShortcut } from '@renderer/lib/platform'
import styles from './ShortcutsDialog.module.css'

type Group = { title: string; items: [keys: string[], label: string][] }

/** Cheat sheet of keyboard shortcuts (platform-aware: ⌘ on macOS, Ctrl elsewhere). */
export function ShortcutsDialog({ onClose }: { onClose: () => void }): React.JSX.Element {
  const { t } = useTranslation()
  const k = (s: string): string => formatShortcut(s)
  const groups: Group[] = [
    {
      title: t('shortcuts.files'),
      items: [
        [[k('Mod+N')], t('menu.newTree')],
        [[k('Mod+O')], t('menu.open')],
        [[k('Mod+S')], t('menu.save')],
        [[k('Mod+Shift+S')], t('menu.saveAs')],
        [[k('Mod+P')], t('menu.print')]
      ]
    },
    {
      title: t('shortcuts.editing'),
      items: [
        [[k('Mod+Shift+N')], t('workspace.addPerson')],
        [['Enter'], t('shortcuts.editSelected')],
        [['Del'], t('person.delete')],
        [[k('Mod+Z')], t('common.undo')],
        [[k('Mod+Shift+Z'), k('Mod+Y')], t('common.redo')],
        [['Esc'], t('shortcuts.cancel')]
      ]
    },
    {
      title: t('shortcuts.tree'),
      items: [
        [['↑'], t('shortcuts.toParent')],
        [['↓'], t('shortcuts.toChild')],
        [['←', '→'], t('shortcuts.sideways')],
        [['F'], t('tree.fit')],
        [['+', '−'], t('shortcuts.zoom')],
        [['0'], t('tree.resetZoom')]
      ]
    },
    {
      title: t('shortcuts.general'),
      items: [
        [[k('Mod+F')], t('shortcuts.search')],
        [['?', 'F1'], t('shortcuts.thisHelp')]
      ]
    }
  ]
  return (
    <Dialog open wide onClose={onClose} icon={Keyboard} title={t('shortcuts.title')}>
      <div className={styles.grid}>
        {groups.map((g) => (
          <section key={g.title}>
            <h3 className={styles.title}>{g.title}</h3>
            <dl className={styles.list}>
              {g.items.map(([keys, label]) => (
                <div key={label} className={styles.row}>
                  <dt className={styles.keys}>
                    {keys.map((key, i) => (
                      <span key={key}>
                        {i > 0 && <span className={styles.or}>/</span>}
                        <Kbd>{key}</Kbd>
                      </span>
                    ))}
                  </dt>
                  <dd className={styles.label}>{label}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </Dialog>
  )
}
