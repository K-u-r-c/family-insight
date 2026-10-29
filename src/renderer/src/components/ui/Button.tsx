import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cx } from '@renderer/lib/cx'
import { Icon } from './Icon'
import { Tooltip } from './Tooltip'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: LucideIcon
  iconRight?: LucideIcon
  block?: boolean
  children?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    icon,
    iconRight,
    block,
    className,
    children,
    type = 'button',
    ...rest
  },
  ref
) {
  const iconSize = size === 'lg' ? 18 : size === 'sm' ? 14 : 16
  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        styles.button,
        styles[variant],
        size !== 'md' && styles[size],
        block && styles.block,
        className
      )}
      {...rest}
    >
      {icon && <Icon icon={icon} size={iconSize} />}
      {children}
      {iconRight && <Icon icon={iconRight} size={iconSize} />}
    </button>
  )
})

export interface IconButtonProps extends Omit<ButtonProps, 'children' | 'iconRight' | 'icon'> {
  icon: LucideIcon
  /** Accessible name, also shown as a tooltip. */
  label: string
  /** Optional shortcut shown in the tooltip, e.g. `Ctrl+Z`. */
  shortcut?: string
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, shortcut, variant = 'ghost', size = 'md', className, ...rest },
  ref
) {
  return (
    <Tooltip content={label} shortcut={shortcut}>
      <Button
        ref={ref}
        variant={variant}
        size={size}
        icon={icon}
        aria-label={label}
        className={cx(styles.iconOnly, className)}
        {...rest}
      />
    </Tooltip>
  )
})
