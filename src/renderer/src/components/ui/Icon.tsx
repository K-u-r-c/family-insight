import type { LucideIcon, LucideProps } from 'lucide-react'

interface IconProps extends LucideProps {
  icon: LucideIcon
}

/** Lucide icon with app-wide defaults (size 16, stroke 1.75, decorative). */
export function Icon({
  icon: Glyph,
  size = 16,
  strokeWidth = 1.75,
  ...rest
}: IconProps): React.JSX.Element {
  return (
    <Glyph size={size} strokeWidth={strokeWidth} aria-hidden="true" focusable="false" {...rest} />
  )
}
