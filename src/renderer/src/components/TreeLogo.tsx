export function TreeLogo({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d="M32 58V34M32 34 18 22M32 34l14-12M32 34V16"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="32" cy="12" r="6" fill="currentColor" />
      <circle cx="16" cy="20" r="6" fill="currentColor" opacity="0.75" />
      <circle cx="48" cy="20" r="6" fill="currentColor" opacity="0.75" />
      <path d="M22 58h20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
