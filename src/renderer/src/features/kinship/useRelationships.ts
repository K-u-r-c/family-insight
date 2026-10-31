import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { describeRelationships, type RelationshipText } from '@core/kinship/describe'
import type { PersonId } from '@core/model/types'
import { resolveLanguage } from '@shared/i18n'
import { useDocument } from '@renderer/store/document'

/** Every way `b` is related to `a`, in the UI language (best first; empty if unrelated). */
export function useRelationships(a: PersonId | null, b: PersonId | null): RelationshipText[] {
  const { t, i18n } = useTranslation()
  const tree = useDocument((s) => s.tree)
  const language = resolveLanguage(i18n.language)
  const unnamed = t('person.unnamed')
  return useMemo(
    () =>
      tree && a && b && tree.persons[a] && tree.persons[b]
        ? describeRelationships(tree, a, b, language, unnamed)
        : [],
    [tree, a, b, language, unnamed]
  )
}

/** "The father of Piotr" from "the father of Piotr", in the casing rules of the language. */
export function capitalize(text: string, language: string): string {
  return text.charAt(0).toLocaleUpperCase(language) + text.slice(1)
}
