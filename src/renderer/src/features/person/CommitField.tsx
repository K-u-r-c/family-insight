import { useRef, useState, type InputHTMLAttributes } from 'react'
import { TextField, TextArea, type TextFieldProps } from '@renderer/components/ui'

interface CommitProps {
  value: string
  /** Called with the new value on blur or Enter (not on every keystroke). */
  onCommit: (value: string) => void
}

/**
 * Text field that keeps a local draft and commits it on blur/Enter; Esc reverts.
 * Re-mount it (via `key`) to reset the draft when the underlying record changes.
 */
export function CommitTextField({
  value,
  onCommit,
  ...rest
}: CommitProps & Omit<TextFieldProps, 'value' | 'onChange' | 'defaultValue'>): React.JSX.Element {
  const [draft, setDraft] = useState(value)
  const [prev, setPrev] = useState(value)
  if (value !== prev) {
    setPrev(value)
    setDraft(value)
  }
  const cancelled = useRef(false)
  const commit = (): void => {
    if (cancelled.current) {
      cancelled.current = false
      return
    }
    if (draft !== value) onCommit(draft)
  }
  return (
    <TextField
      {...rest}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit()
        if (e.key === 'Escape') {
          cancelled.current = true
          setDraft(value)
          e.currentTarget.blur()
        }
      }}
    />
  )
}

export function CommitTextArea({
  value,
  onCommit,
  ...rest
}: CommitProps &
  Omit<InputHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange' | 'className'> & {
    label?: string
    hint?: string
  }): React.JSX.Element {
  const [draft, setDraft] = useState(value)
  const [prev, setPrev] = useState(value)
  if (value !== prev) {
    setPrev(value)
    setDraft(value)
  }
  const cancelled = useRef(false)
  return (
    <TextArea
      {...(rest as object)}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (cancelled.current) {
          cancelled.current = false
          return
        }
        if (draft !== value) onCommit(draft)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          cancelled.current = true
          setDraft(value)
          e.currentTarget.blur()
        }
      }}
    />
  )
}
