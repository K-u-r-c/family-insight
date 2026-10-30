import { useId, useRef, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cx } from '@renderer/lib/cx'
import { Icon } from './Icon'
import styles from './Controls.module.css'

export interface SegmentOption<T extends string> {
  value: T
  label: string
  icon?: LucideIcon
  /** Accessible name/tooltip when the label is empty (icon-only segments). */
  title?: string
  /** Accessible name for icon-only segments (defaults to `title`). */
  ariaLabel?: string
}

interface SegmentedControlProps<T extends string> {
  label: string
  value: T
  options: SegmentOption<T>[]
  onChange: (value: T) => void
  block?: boolean
  className?: string
}

/** Single-choice control implemented as an ARIA radio group with arrow-key support. */
export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  block,
  className
}: SegmentedControlProps<T>): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const onKeyDown = (e: React.KeyboardEvent): void => {
    const delta =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? -1
          : 0
    if (!delta) return
    e.preventDefault()
    const index = options.findIndex((o) => o.value === value)
    const next = options[(index + delta + options.length) % options.length]!
    onChange(next.value)
    ref.current?.querySelectorAll<HTMLButtonElement>('button')[options.indexOf(next)]?.focus()
  }
  return (
    <div
      ref={ref}
      className={cx(styles.segmented, block && styles.block, className)}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          className={styles.segment}
          aria-checked={option.value === value}
          tabIndex={option.value === value ? 0 : -1}
          title={option.title}
          aria-label={option.label ? undefined : (option.ariaLabel ?? option.title)}
          onClick={() => onChange(option.value)}
        >
          {option.icon && <Icon icon={option.icon} size={14} />}
          {option.label}
        </button>
      ))}
    </div>
  )
}

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: ReactNode
  disabled?: boolean
}

export function Switch({ checked, onChange, label, disabled }: SwitchProps): React.JSX.Element {
  const id = useId()
  return (
    <span className={styles.switchRow}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={styles.switch}
        onClick={() => onChange(!checked)}
      />
      <label htmlFor={id}>{label}</label>
    </span>
  )
}

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: ReactNode
  disabled?: boolean
}

export function Checkbox({ checked, onChange, label, disabled }: CheckboxProps): React.JSX.Element {
  return (
    <label className={styles.checkRow}>
      <input
        type="checkbox"
        className={styles.checkbox}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  )
}

export function Spinner({
  size = 18,
  label
}: {
  size?: number
  label?: string
}): React.JSX.Element {
  return (
    <span
      className={styles.spinner}
      style={{ width: size, height: size }}
      role="status"
      aria-label={label}
    />
  )
}

export function Kbd({ children }: { children: ReactNode }): React.JSX.Element {
  return <kbd className={styles.kbd}>{children}</kbd>
}

interface EmptyStateProps {
  icon: LucideIcon
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
}

export function EmptyState({
  icon,
  title,
  description,
  action
}: EmptyStateProps): React.JSX.Element {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>
        <Icon icon={icon} size={28} strokeWidth={1.5} />
      </div>
      <h2 className={styles.emptyTitle}>{title}</h2>
      {description && <p className={styles.emptyText}>{description}</p>}
      {action && <div className={styles.emptyAction}>{action}</div>}
    </div>
  )
}
