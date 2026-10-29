/**
 * A problem found while validating or importing data. `code` maps to a translation
 * under `issues.<code>`; `params` are interpolated into the message.
 */
export interface Issue {
  severity: 'error' | 'warning'
  code: string
  params?: Record<string, string | number>
  /** 1-based data row for imports (header excluded). */
  row?: number
  field?: string
  personId?: string
}

export function hasErrors(issues: Issue[]): boolean {
  return issues.some((i) => i.severity === 'error')
}
