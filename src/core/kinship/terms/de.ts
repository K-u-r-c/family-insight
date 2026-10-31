import type { Sex } from '../../model/types'
import type { BloodKinship, Kinship, Lineage } from '../kinship'
import {
  counted,
  innerBlood,
  listOf,
  term,
  tooDistant,
  type KinshipLanguage,
  type KinshipTerm
} from './common'

type G = KinshipTerm['gender']

/**
 * A word in its male and female forms, optionally a sex-neutral word (`n`, with its gender `ng`)
 * – otherwise "male oder female" – and a `suffix` added once after it ("Cousin oder Cousine
 * 2. Grades").
 */
interface Word {
  m: string
  f: string
  n?: string
  ng?: G
  suffix?: string
}

const lower = (s: string): string => s.charAt(0).toLowerCase() + s.slice(1)
const map = (w: Word, fm: (s: string) => string, ff = fm, fn = fm): Word => ({
  ...w,
  m: fm(w.m),
  f: ff(w.f),
  n: w.n === undefined ? undefined : fn(w.n)
})
/** A compound: "Halb" + "Bruder" → "Halbbruder", "Stief" + "Großvater" → "Stiefgroßvater". */
const compound = (prefix: string, w: Word): Word => map(w, (s) => prefix + lower(s))
const ENDING: Record<G, string> = { m: 'er', f: 'e', n: 'es' }
/** A leading adjective in the strong declension: "angeheirateter Onkel", "ehemalige Ehefrau". */
const adjective = (stem: string, w: Word): Word =>
  map(
    w,
    (s) => `${stem}er ${s}`,
    (s) => `${stem}e ${s}`,
    (s) => `${stem}${ENDING[w.ng ?? 'm']} ${s}`
  )

function finish(sex: Sex, w: Word): KinshipTerm {
  const suffix = w.suffix ?? ''
  if (sex === 'male') return term(w.m + suffix, 'm')
  if (sex === 'female') return term(w.f + suffix, 'f')
  if (w.n !== undefined) return term(w.n + suffix, w.ng ?? 'm')
  return term(`${w.m} oder ${w.f}${suffix}`, 'm')
}

/** Spelled-out "Ur-" prefixes are used up to four times (Ururururgroßvater). */
const MAX_UR = 4
/** "Ur" k times in front of a word: Großvater → Urgroßvater → Ururgroßvater. */
const ur = (k: number, w: Word): Word => (k <= 0 ? w : compound(`Ur${'ur'.repeat(k - 1)}`, w))
/** One generation further: Groß-, two: Urgroß-, … (Onkel → Großonkel → Urgroßonkel). */
const greater = (g: number, w: Word): Word | null =>
  g <= 0 ? w : g - 1 > MAX_UR ? null : ur(g - 1, compound('Groß', w))

const LINEAGE: Partial<Record<Lineage, string>> = {
  adoptive: 'Adoptiv',
  foster: 'Pflege',
  step: 'Stief'
}
const withLineage = (w: Word, lineage: Lineage): Word => {
  const prefix = LINEAGE[lineage]
  return prefix ? compound(prefix, w) : w
}

function ancestor(up: number): Word {
  if (up === 1) return { m: 'Vater', f: 'Mutter', n: 'Elternteil', ng: 'm' }
  if (up - 2 <= MAX_UR) {
    return ur(up - 2, { m: 'Großvater', f: 'Großmutter', n: 'Großelternteil', ng: 'm' })
  }
  return { m: 'Vorfahr', f: 'Vorfahrin', suffix: ` in der ${up}. Generation` }
}

function descendant(down: number): Word {
  if (down === 1) return { m: 'Sohn', f: 'Tochter', n: 'Kind', ng: 'n' }
  if (down - 2 <= MAX_UR) {
    return ur(down - 2, { m: 'Enkel', f: 'Enkelin', n: 'Enkelkind', ng: 'n' })
  }
  return { m: 'Nachfahre', f: 'Nachfahrin', suffix: ` in der ${down}. Generation` }
}

const UNCLE: Word = { m: 'Onkel', f: 'Tante' }
const NEPHEW: Word = { m: 'Neffe', f: 'Nichte' }

/**
 * Blood relatives. Collaterals follow the German "Grad" of the side line, which counts the
 * generations up to the common ancestors of the younger side: Cousin (1. Grades, not written),
 * Cousin 2. Grades (second cousin); in other generations Onkel/Tante and Neffe/Nichte of the same
 * grade – a parent's cousin is an Onkel 2. Grades, a cousin's child a Neffe 2. Grades, a
 * grandparent's cousin a Großonkel 2. Grades.
 */
function bloodWord(k: BloodKinship): Word | null {
  if (tooDistant(k)) return null
  const { up, down } = k
  if (down === 0) return withLineage(ancestor(up), k.lineage)
  if (up === 0) return withLineage(descendant(down), k.lineage)
  const grade = Math.min(up, down)
  let w: Word | null
  if (up === down) {
    w =
      grade === 1
        ? { m: 'Bruder', f: 'Schwester', n: 'Geschwister', ng: 'n' }
        : { m: 'Cousin', f: 'Cousine', suffix: grade > 2 ? ` ${grade - 1}. Grades` : undefined }
  } else {
    w = greater(Math.abs(up - down) - 1, up > down ? UNCLE : NEPHEW)
    if (w && grade > 1) w = { ...w, suffix: ` ${grade}. Grades` }
  }
  if (!w) return null
  if (k.half) w = compound('Halb', w)
  return withLineage(w, k.lineage)
}

function partnerWord(k: Extract<Kinship, { kind: 'partner' }>): Word {
  const w: Word =
    k.partnership === 'marriage'
      ? { m: 'Ehemann', f: 'Ehefrau' }
      : k.partnership === 'engagement'
        ? { m: 'Verlobter', f: 'Verlobte', n: 'verlobte Person', ng: 'f' }
        : k.partnership === 'partnership'
          ? { m: 'Lebenspartner', f: 'Lebenspartnerin' }
          : { m: 'Partner', f: 'Partnerin' }
  return k.ended ? adjective('ehemalig', w) : w
}

const SIBLING_IN_LAW: Word = { m: 'Schwager', f: 'Schwägerin' }

/** "des Partners", "der Partnerin": the partner in the genitive, after a nominative term. */
const OF_PARTNER: Record<Sex, string> = {
  male: ' des Partners',
  female: ' der Partnerin',
  other: ' des Partners oder der Partnerin',
  unknown: ' des Partners oder der Partnerin'
}

function inLawWord(k: Extract<Kinship, { kind: 'in-law' }>): Word | null {
  if (tooDistant(k)) return null
  const { up, down } = k
  if (k.via === 'both') return { m: 'Schwippschwager', f: 'Schwippschwägerin' }
  if (up === 1 && down === 1) return SIBLING_IN_LAW
  const inner = (): Word | null => bloodWord(innerBlood(k, k.sexB))
  if (k.via === 'partner-of-a') {
    if (down === 0 && up <= 4) return compound('Schwieger', ancestor(up))
    if (up === 2 && down === 1) return compound('Schwieger', UNCLE)
    // Other relatives of the partner: "Cousine des Partners", "Großneffe der Partnerin".
    const w = inner()
    return w && { ...w, suffix: (w.suffix ?? '') + OF_PARTNER[k.partnerSex] }
  }
  if (up === 0 && down <= 2) return compound('Schwieger', descendant(down))
  // Others who married into the family: "angeheirateter Onkel", "angeheiratete Cousine".
  const w = inner()
  return w && adjective('angeheiratet', w)
}

function name(k: Kinship): KinshipTerm | null {
  let w: Word | null
  switch (k.kind) {
    case 'self':
      return term('dieselbe Person', 'f')
    case 'direct':
    case 'collateral':
      w = bloodWord(k)
      break
    case 'partner':
      w = partnerWord(k)
      break
    case 'step':
      if (tooDistant(k)) return null
      w =
        k.up === 1 && k.down === 1
          ? { m: 'Stiefbruder', f: 'Stiefschwester', n: 'Stiefgeschwister', ng: 'n' }
          : k.down === 0
            ? compound('Stief', ancestor(k.up))
            : k.up === 0
              ? compound('Stief', descendant(k.down))
              : null
      break
    case 'in-law':
      w = inLawWord(k)
      break
  }
  return w && finish(k.sexB, w)
}

const ARTICLE: Record<G, string> = { m: 'der', f: 'die', n: 'das' }

/**
 * After the definite article a leading adjective (or the adjectival noun "Verlobter") takes the
 * weak ending: "ehemaliger Verlobter" → "der ehemalige Verlobte". Only the part before "oder"
 * follows the article.
 */
function afterArticle(t: KinshipTerm): string {
  if (t.gender === 'f') return t.term
  const at = t.term.indexOf(' oder ')
  const head = at < 0 ? t.term : t.term.slice(0, at)
  const rest = at < 0 ? '' : t.term.slice(at)
  return head.replace(/\b(ehemalig|angeheiratet|Verlobt)(er|es)\b/g, '$1e') + rest
}

export const german: KinshipLanguage = {
  name,
  // "Anna ist die Tante von Maria": the names stay in the nominative.
  phrase: (a, t) => `${ARTICLE[t.gender]} ${afterArticle(t)} von ${a}`,
  sentence: (a, b, t) => `${b} ist ${german.phrase(a, t)}.`,
  distant: (a, b, k, ancestors) => {
    const gen = (n: number): string =>
      counted('de', n, { one: 'Generation', other: 'Generationen' })
    if (k.down === 0) return `${a} stammt in gerader Linie von ${b} ab (${gen(k.up)} zurück).`
    if (k.up === 0) return `${b} stammt in gerader Linie von ${a} ab (${gen(k.down)} später).`
    return `${b} und ${a} sind über die gemeinsame Abstammung von ${listOf('de', ancestors)} verwandt (${gen(k.up)} hinauf und ${k.down} hinab).`
  },
  byMarriage: (a, b) => `${b} und ${a} sind verschwägert.`
}
