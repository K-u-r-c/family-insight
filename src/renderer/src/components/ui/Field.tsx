import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes
} from 'react'
import type { LucideIcon } from 'lucide-react'
import { cx } from '@renderer/lib/cx'
import { Icon } from './Icon'
import styles from './Field.module.css'

interface FieldChrome {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  warning?: ReactNode
  /** Hide the label visually but keep it for screen readers. */
  hideLabel?: boolean
  className?: string
}

function FieldWrapper({
  id,
  label,
  hint,
  error,
  warning,
  hideLabel,
  className,
  children
}: FieldChrome & { id: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className={cx(styles.field, className)}>
      {label && (
        <label htmlFor={id} className={cx(styles.label, hideLabel && 'visually-hidden')}>
          {label}
        </label>
      )}
      {children}
      {error ? (
        <span id={`${id}-msg`} className={styles.error} role="alert">
          {error}
        </span>
      ) : warning ? (
        <span id={`${id}-msg`} className={styles.warning}>
          {warning}
        </span>
      ) : hint ? (
        <span id={`${id}-msg`} className={styles.hint}>
          {hint}
        </span>
      ) : null}
    </div>
  )
}

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'>, FieldChrome {
  icon?: LucideIcon
  inputClassName?: string
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, warning, hideLabel, className, icon, inputClassName, id, ...rest },
  ref
) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const input = (
    <input
      ref={ref}
      id={fieldId}
      className={cx(styles.control, inputClassName)}
      aria-invalid={error ? true : undefined}
      aria-describedby={error || warning || hint ? `${fieldId}-msg` : undefined}
      {...rest}
    />
  )
  return (
    <FieldWrapper {...{ id: fieldId, label, hint, error, warning, hideLabel, className }}>
      {icon ? (
        <div className={styles.withIcon}>
          <Icon icon={icon} className={styles.leadingIcon} size={15} />
          {input}
        </div>
      ) : (
        input
      )}
    </FieldWrapper>
  )
})

export interface TextAreaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'>, FieldChrome {}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, hint, error, warning, hideLabel, className, id, ...rest },
  ref
) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <FieldWrapper {...{ id: fieldId, label, hint, error, warning, hideLabel, className }}>
      <textarea
        ref={ref}
        id={fieldId}
        className={cx(styles.control, styles.textarea)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || warning || hint ? `${fieldId}-msg` : undefined}
        {...rest}
      />
    </FieldWrapper>
  )
})

export interface SelectOption<T extends string = string> {
  value: T
  label: string
}

export interface SelectProps<T extends string = string>
  extends
    Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className' | 'onChange' | 'value'>,
    FieldChrome {
  value: T
  options: SelectOption<T>[]
  onChange: (value: T) => void
}

export function Select<T extends string>({
  label,
  hint,
  error,
  warning,
  hideLabel,
  className,
  id,
  options,
  value,
  onChange,
  ...rest
}: SelectProps<T>): React.JSX.Element {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <FieldWrapper {...{ id: fieldId, label, hint, error, warning, hideLabel, className }}>
      <select
        id={fieldId}
        className={cx(styles.control, styles.select)}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  )
}
