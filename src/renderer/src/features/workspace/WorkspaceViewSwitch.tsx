import { Map as MapIcon, TreeDeciduous } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SegmentedControl } from '@renderer/components/ui'
import { formatShortcut } from '@renderer/lib/platform'
import { useWorkspaceUi } from '@renderer/store/workspaceUi'

/** Switches the main area between the family tree and the map. */
export function WorkspaceViewSwitch(): React.JSX.Element {
  const { t } = useTranslation()
  const view = useWorkspaceUi((s) => s.view)
  const setView = useWorkspaceUi((s) => s.setView)
  return (
    <SegmentedControl
      label={t('map.switch')}
      value={view}
      onChange={setView}
      options={[
        {
          value: 'tree',
          icon: TreeDeciduous,
          label: '',
          ariaLabel: t('map.treeView'),
          title: t('map.treeView')
        },
        {
          value: 'map',
          icon: MapIcon,
          label: '',
          ariaLabel: t('map.title'),
          title: `${t('map.title')} (${formatShortcut('Mod+Shift+M')})`
        }
      ]}
    />
  )
}
