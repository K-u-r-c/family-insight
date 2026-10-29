import { useState } from 'react'
import { Bell, Plus, Redo2, Search, Sprout, Trash2, Undo2, UserPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  anchorBelow,
  Avatar,
  Button,
  Checkbox,
  confirm,
  Dialog,
  EmptyState,
  IconButton,
  Kbd,
  Menu,
  SegmentedControl,
  Select,
  Spinner,
  Switch,
  TextArea,
  TextField,
  toast,
  type MenuAnchor
} from '@renderer/components/ui'
import { formatShortcut } from '@renderer/lib/platform'
import { SettingsControls } from '@renderer/features/settings/SettingsControls'
import styles from './Gallery.module.css'

/** Visual catalogue of the design system (open with `#gallery`). */
export function Gallery(): React.JSX.Element {
  const { t } = useTranslation()
  const [segment, setSegment] = useState<'a' | 'b' | 'c'>('a')
  const [on, setOn] = useState(true)
  const [checked, setChecked] = useState(false)
  const [dialog, setDialog] = useState(false)
  const [menu, setMenu] = useState<MenuAnchor | null>(null)
  const [select, setSelect] = useState('female')

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('gallery.title')}</h1>
        <SettingsControls />
      </header>
      <div className={styles.grid}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>{t('gallery.buttons')}</h2>
          <div className={styles.row}>
            <Button variant="primary" icon={Plus}>
              {t('common.add')}
            </Button>
            <Button>{t('common.edit')}</Button>
            <Button variant="ghost">{t('common.cancel')}</Button>
            <Button variant="danger" icon={Trash2}>
              {t('common.delete')}
            </Button>
          </div>
          <div className={styles.row}>
            <Button size="sm" variant="primary">
              {t('common.save')}
            </Button>
            <Button size="lg" icon={UserPlus}>
              {t('common.add')}
            </Button>
            <Button disabled>{t('common.save')}</Button>
          </div>
          <div className={styles.row}>
            <IconButton icon={Undo2} label={t('common.undo')} shortcut={formatShortcut('Mod+Z')} />
            <IconButton icon={Redo2} label={t('common.redo')} />
            <IconButton icon={Bell} label={t('common.notifications')} variant="secondary" />
            <Kbd>{formatShortcut('Mod+K')}</Kbd>
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>{t('gallery.fields')}</h2>
          <TextField
            label={t('gallery.sample')}
            placeholder={t('gallery.placeholder')}
            hint={t('gallery.hint')}
          />
          <TextField
            label={t('common.search')}
            icon={Search}
            placeholder={t('gallery.placeholder')}
          />
          <TextField
            label={t('gallery.sample')}
            defaultValue="31.02.1890"
            error={t('gallery.error')}
          />
          <Select
            label={t('person.sex')}
            value={select}
            onChange={setSelect}
            options={(['female', 'male', 'other', 'unknown'] as const).map((v) => ({
              value: v,
              label: t(`sex.${v}`)
            }))}
          />
          <TextArea label={t('gallery.sample')} placeholder={t('gallery.placeholder')} />
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>{t('gallery.controls')}</h2>
          <SegmentedControl
            label={t('gallery.controls')}
            value={segment}
            onChange={setSegment}
            options={[
              { value: 'a', label: 'Alpha' },
              { value: 'b', label: 'Beta' },
              { value: 'c', label: 'Gamma' }
            ]}
          />
          <Switch checked={on} onChange={setOn} label={t('gallery.sample')} />
          <Checkbox checked={checked} onChange={setChecked} label={t('gallery.sample')} />
          <div className={styles.row}>
            <Button onClick={(e) => setMenu(anchorBelow(e.currentTarget))} aria-expanded={!!menu}>
              {t('gallery.openMenu')}
            </Button>
            <Spinner label={t('common.loading')} />
          </div>
          <Menu
            anchor={menu}
            onClose={() => setMenu(null)}
            entries={[
              { type: 'heading', label: t('gallery.sample') },
              { label: t('common.edit'), onSelect: () => undefined, shortcut: 'Enter' },
              { label: t('common.add'), icon: UserPlus, onSelect: () => undefined },
              { type: 'separator' },
              { label: t('common.delete'), icon: Trash2, danger: true, onSelect: () => undefined }
            ]}
          />
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>{t('gallery.feedback')}</h2>
          <div className={styles.row}>
            <Button onClick={() => setDialog(true)}>{t('gallery.openDialog')}</Button>
            <Button
              onClick={() =>
                void confirm({
                  title: t('gallery.openConfirm'),
                  danger: true,
                  confirmLabel: t('common.delete')
                })
              }
            >
              {t('gallery.openConfirm')}
            </Button>
            <Button
              onClick={() =>
                toast({
                  message: t('gallery.toastMessage'),
                  tone: 'success',
                  action: { label: t('common.undo'), onClick: () => undefined }
                })
              }
            >
              {t('gallery.showToast')}
            </Button>
          </div>
          <Dialog
            open={dialog}
            onClose={() => setDialog(false)}
            title={t('gallery.openDialog')}
            description={t('gallery.dialogText')}
            footer={
              <Button variant="primary" onClick={() => setDialog(false)}>
                {t('common.done')}
              </Button>
            }
          >
            <TextField label={t('gallery.sample')} />
          </Dialog>
          <EmptyState
            icon={Sprout}
            title={t('gallery.emptyTitle')}
            description={t('gallery.emptyText')}
          />
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>{t('gallery.people')}</h2>
          <div className={styles.row}>
            <Avatar givenNames="Anna" surname="Kowalska" sex="female" size={48} />
            <Avatar givenNames="Jan" surname="Nowak" sex="male" size={48} />
            <Avatar givenNames="Alex" surname="Wiśniewski" sex="other" size={48} />
            <Avatar givenNames="Łucja" surname="Żak" sex="unknown" size={48} />
            <Avatar givenNames="Józef" surname="Kowalski" sex="male" size={48} deceased />
            <Avatar givenNames="Ewa" surname="Lis" sex="female" size={28} />
          </div>
        </section>
      </div>
    </main>
  )
}
