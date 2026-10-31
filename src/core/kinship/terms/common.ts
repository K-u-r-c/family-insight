import type { Sex } from '../../model/types'
import type { BloodKinship, InLawKinship, Kinship, StepKinship } from '../kinship'

/** A relationship word and its grammatical gender (for articles: der/die/das, le/la …). */
export interface KinshipTerm {
  term: string
  gender: 'm' | 'f' | 'n'
}

/**
 * How one language names relationships. `name` gives what `b` is to `a` as a noun phrase in the
 * nominative ("second cousin once removed", "brat stryjeczny") – `null` when the language has no
 * sensible word. `phrase` is the term relative to `a` ("the aunt of Maria") and `sentence` puts
 * it after `b` ("Anna is the aunt of Maria"); neither inflects the names.
 *
 * Without a name, `distant` describes a blood relationship by its common ancestors (their names
 * in `ancestors`) and generations, and `byMarriage` any other relationship.
 */
export interface KinshipLanguage {
  name: (k: Kinship) => KinshipTerm | null
  phrase: (a: string, term: KinshipTerm) => string
  sentence: (a: string, b: string, term: KinshipTerm) => string
  distant: (a: string, b: string, k: BloodKinship, ancestors: string[]) => string
  byMarriage: (a: string, b: string, k: Kinship) => string
}

export type Namer = KinshipLanguage['name']

/** Male, female and unknown-sex forms of a word. */
export type Forms = readonly [male: string, female: string, neutral: string]

export const pick = (sex: Sex, forms: Forms): string =>
  sex === 'male' ? forms[0] : sex === 'female' ? forms[1] : forms[2]

/** Grammatical gender of a word chosen by sex: masculine, feminine, or `neutral` for unknown. */
export const genderOf = (sex: Sex, neutral: KinshipTerm['gender'] = 'm'): KinshipTerm['gender'] =>
  sex === 'male' ? 'm' : sex === 'female' ? 'f' : neutral

export const term = (word: string, gender: KinshipTerm['gender']): KinshipTerm => ({
  term: word,
  gender
})

/** The blood part of an in-law relationship, as a blood descriptor (for reusing blood terms). */
export function innerBlood(k: InLawKinship, sexB: Sex): BloodKinship {
  return {
    kind: k.up === 0 || k.down === 0 ? 'direct' : 'collateral',
    up: k.up,
    down: k.down,
    half: k.half,
    commonAncestors: [],
    side: k.side,
    branchSex: k.branchSex,
    lineage: 'biological',
    path: k.path,
    sexA: k.sexA,
    sexB
  }
}

/** "Jan and Maria" in the language's own list style. */
export const listOf = (language: string, names: string[]): string =>
  new Intl.ListFormat(language, { type: 'conjunction' }).format(names)

/** A count with the plural form the language uses for it (`forms` keyed by plural category). */
export function counted(
  language: string,
  n: number,
  forms: Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }
): string {
  return `${n} ${forms[new Intl.PluralRules(language).select(n)] ?? forms.other}`
}

/** Both people are women (for plural agreement: spokrewnione, apparentées …). */
export const bothFemale = (k: Kinship): boolean => k.sexA === 'female' && k.sexB === 'female'

/** Very distant relationships are described by their ancestors instead of a word. */
export const tooDistant = (k: BloodKinship | StepKinship | InLawKinship): boolean =>
  k.up > 12 || k.down > 12 || Math.min(k.up, k.down) > 9
