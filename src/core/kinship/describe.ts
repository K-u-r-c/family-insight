import { displayName } from '../model/tree'
import type { FamilyTree, PersonId } from '../model/types'
import { findRelationships, type Kinship } from './kinship'
import { kinshipLanguage } from './terms'

export interface RelationshipText {
  kinship: Kinship
  /** "Anna is the aunt of Maria." */
  sentence: string
  /** "the aunt of Maria" – only when the language has a word for the relationship. */
  phrase?: string
}

/**
 * Every way `b` is related to `a` (best first), in words of `language`. Nameless relationships
 * get a sentence about their common ancestors or the marriage. The same person gives nothing.
 */
export function describeRelationships(
  tree: FamilyTree,
  a: PersonId,
  b: PersonId,
  language: string,
  unnamed: string
): RelationshipText[] {
  const lang = kinshipLanguage(language)
  const name = (id: PersonId): string => {
    const person = tree.persons[id]
    return (person && displayName(person)) || unnamed
  }
  const [nameA, nameB] = [name(a), name(b)]
  return findRelationships(tree, a, b)
    .filter((k) => k.kind !== 'self')
    .map((kinship) => {
      const term = lang.name(kinship)
      if (term) {
        return {
          kinship,
          sentence: lang.sentence(nameA, nameB, term),
          phrase: lang.phrase(nameA, term)
        }
      }
      const sentence =
        kinship.kind === 'direct' || kinship.kind === 'collateral'
          ? lang.distant(nameA, nameB, kinship, kinship.commonAncestors.map(name))
          : lang.byMarriage(nameA, nameB, kinship)
      return { kinship, sentence }
    })
}
