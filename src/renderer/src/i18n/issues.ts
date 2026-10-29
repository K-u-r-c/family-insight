import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { Issue } from '@core/issues'

/** Translates a validation/import issue via `issues.<code>` with its params. */
export function useIssueText(): (issue: Pick<Issue, 'code' | 'params'>) => string {
  const { t } = useTranslation()
  return useCallback(
    (issue) =>
      t(`issues.${issue.code}` as never, (issue.params ?? {}) as never) as unknown as string,
    [t]
  )
}
