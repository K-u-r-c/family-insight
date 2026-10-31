import { cx } from '@renderer/lib/cx'
import styles from './Ornaments.module.css'

/**
 * Decorative corner ornaments of the Tapestry style (hidden in other styles and in forced-colours
 * mode). Place inside a positioned container; they never take pointer events.
 */
export function Ornaments({ size = 'md' }: { size?: 'md' | 'lg' }): React.JSX.Element {
  return (
    <span className={cx(styles.ornaments, styles[size])} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </span>
  )
}
