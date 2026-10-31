import { ArrowDownToLine, ArrowUpToLine, Hourglass, Network } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ViewMode } from '@core/layout/layout'
import { SegmentedControl } from '@renderer/components/ui'
import { useWindowWidth } from '@renderer/hooks/useWindowWidth'
import { useTreeView } from '@renderer/store/treeView'
import styles from './ViewModeControls.module.css'

const MODES: { value: ViewMode; icon: typeof Network }[] = [
  { value: 'family', icon: Network },
  { value: 'ancestors', icon: ArrowUpToLine },
  { value: 'descendants', icon: ArrowDownToLine },
  { value: 'hourglass', icon: Hourglass }
]
const DEPTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
export const ALL_GENERATIONS = 99

/** View mode switch and generation depth (depth applies to every mode but Family). */
export function ViewModeControls(): React.JSX.Element {
  const { t } = useTranslation()
  const mode = useTreeView((s) => s.mode)
  const depth = useTreeView((s) => s.depth)
  const setMode = useTreeView((s) => s.setMode)
  const setDepth = useTreeView((s) => s.setDepth)
  // Labels need room (Polish ones are long, and the depth selector takes space too).
  const wide = useWindowWidth() >= (mode === 'family' ? 1400 : 1560)

  return (
    <div className={styles.controls} data-tour="view-modes">
      <SegmentedControl
        label={t('view.mode')}
        value={mode}
        onChange={setMode}
        options={MODES.map(({ value, icon }) => ({
          value,
          icon,
          label: wide ? t(`view.${value}`) : '',
          title: t(`view.${value}Hint`),
          ariaLabel: t(`view.${value}`)
        }))}
        className={wide ? undefined : styles.iconsOnly}
      />
      {mode !== 'family' && (
        <select
          className={styles.depth}
          aria-label={t('view.depth')}
          title={t('view.depth')}
          value={depth}
          onChange={(e) => setDepth(Number(e.target.value))}
        >
          {DEPTHS.map((d) => (
            <option key={d} value={d}>
              {t('view.generations', { count: d })}
            </option>
          ))}
          <option value={ALL_GENERATIONS}>{t('view.allGenerations')}</option>
        </select>
      )}
    </div>
  )
}
