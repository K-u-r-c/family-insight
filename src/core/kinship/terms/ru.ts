import type { Sex } from '../../model/types'
import type { BloodKinship, InLawKinship, Kinship, Lineage } from '../kinship'
import {
  bothFemale,
  counted,
  innerBlood,
  listOf,
  term,
  tooDistant,
  type KinshipLanguage,
  type KinshipTerm
} from './common'

type G = KinshipTerm['gender']

/** An adjective agreeing with its noun: двоюродный / двоюродная. */
type Adj = (g: G) => string
const adj =
  (stem: string, stressed = false): Adj =>
  (g) =>
    stem + (g === 'f' ? 'ая' : g === 'n' ? 'ое' : stressed ? 'ой' : 'ый')

/**
 * Male and female nouns and the unknown-sex form (a masculine noun such as "родитель"; without
 * it "X или Y"). The same word for both sexes ("предок …") is always masculine.
 */
interface Noun {
  m: string
  f: string
  n?: string
}

function form(sex: Sex, noun: Noun, adjs: Adj[] = []): KinshipTerm {
  const dress = (word: string, g: G): string => [...adjs.map((a) => a(g)), word].join(' ')
  if (noun.m === noun.f) return term(dress(noun.m, 'm'), 'm')
  if (sex === 'male') return term(dress(noun.m, 'm'), 'm')
  if (sex === 'female') return term(dress(noun.f, 'f'), 'f')
  return term(noun.n ? dress(noun.n, 'm') : `${dress(noun.m, 'm')} или ${dress(noun.f, 'f')}`, 'm')
}

/** Двоюродный (2), троюродный (3) …: how many generations up the shared line goes. */
const DEGREE = [
  '',
  '',
  'двоюродн',
  'троюродн',
  'четвероюродн',
  'пятиюродн',
  'шестиюродн',
  'семиюродн',
  'восьмиюродн',
  'девятиюродн',
  'десятиюродн'
]
const degree = (n: number): Adj => adj(DEGREE[n] ?? `${n}-юродн`)

const LINEAGE: Partial<Record<Lineage, Adj>> = {
  adoptive: adj('приёмн'),
  foster: adj('патронатн'),
  step: adj('неродн', true)
}

/** "Пра-" up to three times (прапрапрадед), then "предок в 7-м поколении". */
const MAX_PRA = 3

function ancestorNoun(up: number): Noun {
  if (up === 1) return { m: 'отец', f: 'мать', n: 'родитель' }
  if (up - 2 <= MAX_PRA) {
    const pra = 'пра'.repeat(up - 2)
    return { m: `${pra}дед`, f: `${pra}бабушка` }
  }
  const word = `предок в ${up}-м поколении`
  return { m: word, f: word }
}

function descendantNoun(down: number): Noun {
  if (down === 1) return { m: 'сын', f: 'дочь', n: 'ребёнок' }
  if (down - 2 <= MAX_PRA) {
    const pra = 'пра'.repeat(down - 2)
    return { m: `${pra}внук`, f: `${pra}внучка` }
  }
  const word = `потомок в ${down}-м поколении`
  return { m: word, f: word }
}

const SIBLING: Noun = { m: 'брат', f: 'сестра' }
const SPOUSE: Noun = { m: 'муж', f: 'жена', n: 'супруг или супруга' }

function blood(k: BloodKinship): KinshipTerm | null {
  if (tooDistant(k)) return null
  const { up, down, sexB, lineage } = k
  const extra = LINEAGE[lineage]
  if (down === 0) {
    if (lineage === 'step' && up === 1) return form(sexB, { m: 'отчим', f: 'мачеха' })
    return form(sexB, ancestorNoun(up), extra ? [extra] : [])
  }
  if (up === 0) {
    if (lineage === 'step' && down === 1) return form(sexB, { m: 'пасынок', f: 'падчерица' })
    return form(sexB, descendantNoun(down), extra ? [extra] : [])
  }

  const adjs: Adj[] = []
  if (lineage === 'step' && up === 1 && down === 1) adjs.push(adj('сводн'))
  else if (extra) adjs.push(extra)
  if (k.half) {
    // Half-siblings: единокровный (same father) or единоутробный (same mother); further out
    // the shared ancestor's sex is not known, so the legal "неполнородный" (Family Code art. 14).
    const sibling = up === 1 && down === 1
    adjs.push(
      sibling && k.side === 'paternal'
        ? adj('единокровн')
        : sibling && k.side === 'maternal'
          ? adj('единоутробн')
          : adj('неполнородн')
    )
  }
  const near = Math.min(up, down)
  const removed = Math.abs(up - down)
  const withDegree = (n: number): Adj[] => (n >= 2 ? [...adjs, degree(n)] : adjs)

  if (removed === 0) return form(sexB, SIBLING, withDegree(near))
  if (down > up) {
    // Younger: племянник, двоюродный племянник; внучатый / правнучатый племянник.
    const nephew: Noun = { m: 'племянник', f: 'племянница' }
    if (removed === 1) return form(sexB, nephew, withDegree(near))
    if (removed - 3 < MAX_PRA) {
      const stem = removed === 2 ? 'внучат' : `${'пра'.repeat(removed - 3)}правнучат`
      return form(sexB, nephew, [...withDegree(near), adj(stem)])
    }
    return form(sexB, descendantNoun(removed), withDegree(near + 1))
  }
  // Older: дядя, двоюродный дядя; двоюродный дед (a grandparent's sibling), троюродный дед …
  if (removed === 1) return form(sexB, { m: 'дядя', f: 'тётя' }, withDegree(near))
  return form(sexB, ancestorNoun(removed), withDegree(near + 1))
}

/** Genitive of the nouns used above ("жена внука", "дядя мужа"). */
const GENITIVE: Record<string, string> = {
  отец: 'отца',
  мать: 'матери',
  родитель: 'родителя',
  дед: 'деда',
  бабушка: 'бабушки',
  сын: 'сына',
  дочь: 'дочери',
  ребёнок: 'ребёнка',
  внук: 'внука',
  внучка: 'внучки',
  брат: 'брата',
  сестра: 'сестры',
  дядя: 'дяди',
  тётя: 'тёти',
  племянник: 'племянника',
  племянница: 'племянницы',
  отчим: 'отчима',
  мачеха: 'мачехи',
  пасынок: 'пасынка',
  падчерица: 'падчерицы',
  предок: 'предка',
  потомок: 'потомка',
  муж: 'мужа',
  жена: 'жены',
  супруг: 'супруга',
  супруга: 'супруги'
}

/** Puts a phrase built from the words above into the genitive, word by word. */
function genitive(phrase: string): string {
  return phrase
    .split(' ')
    .map((word) => {
      const pra = /^(?:пра)*/.exec(word)![0]
      const noun = GENITIVE[word] ?? (pra && GENITIVE[word.slice(pra.length)])
      if (noun) return GENITIVE[word] ? noun : pra + noun
      if (word.length > 3 && /(ый|ой)$/.test(word)) return `${word.slice(0, -2)}ого`
      if (word.length > 3 && word.endsWith('ая')) return `${word.slice(0, -2)}ой`
      return word
    })
    .join(' ')
}

/** "Wife of the nephew", "husband's uncle": the descriptive in-law forms. */
const spouseOf = (sexB: Sex, relative: KinshipTerm | null): KinshipTerm | null =>
  relative && after(form(sexB, SPOUSE), genitive(relative.term))
const ofPartner = (k: InLawKinship, relative: KinshipTerm | null): KinshipTerm | null =>
  relative && after(relative, genitive(form(k.partnerSex, SPOUSE).term))
const after = (t: KinshipTerm, words: string): KinshipTerm => term(`${t.term} ${words}`, t.gender)

/** Чей-то родственник по браку – when even a description would say nothing. */
const AFFINE: Noun = { m: 'свойственник', f: 'свойственница' }

function inLaw(k: InLawKinship): KinshipTerm | null {
  if (tooDistant(k)) return null
  const { up, down, sexB, partnerSex } = k
  const husband = partnerSex === 'male'
  const wife = partnerSex === 'female'
  const unknownPartner = !husband && !wife

  if (k.via === 'both') {
    // Wives of two brothers are невестки (ятровки); the husband of the wife's sister is a свояк.
    if (husband && sexB === 'female') return term('невестка', 'f')
    if (wife && sexB === 'male') return term('свояк', 'm')
    return form(sexB, AFFINE)
  }

  if (k.via === 'partner-of-a') {
    if (sexB === 'male' || sexB === 'female') {
      // Husband's parents: свёкор, свекровь; wife's: тесть, тёща.
      if (up === 1 && down === 0) {
        if (husband) return form(sexB, { m: 'свёкор', f: 'свекровь' })
        if (wife) return form(sexB, { m: 'тесть', f: 'тёща' })
        return form(sexB, { m: 'свёкор или тесть', f: 'свекровь или тёща' })
      }
      // Husband's siblings: деверь, золовка; wife's: шурин, свояченица.
      if (up === 1 && down === 1) {
        if (husband) return form(sexB, { m: 'деверь', f: 'золовка' })
        if (wife) return form(sexB, { m: 'шурин', f: 'свояченица' })
        return form(sexB, { m: 'деверь или шурин', f: 'золовка или свояченица' })
      }
    }
    return ofPartner(k, blood(innerBlood(k, sexB)))
  }

  // The partner of a's relative. The relative's sex is `partnerSex`.
  const relative = blood(innerBlood(k, partnerSex))
  const man = sexB === 'male' && (wife || unknownPartner)
  const woman = sexB === 'female' && (husband || unknownPartner)
  // Child's or sibling's spouse: зять (husband of a daughter or sister); невестка (wife of a son
  // or brother) – сноха when a man speaks of his son's wife.
  if (down === 1 && up <= 1) {
    if (man) return term('зять', 'm')
    if (woman) return term(up === 0 && k.sexA === 'male' ? 'сноха' : 'невестка', 'f')
  }
  if (up === 2 && down === 1) {
    if (sexB === 'female' && husband) return term('тётя (жена дяди)', 'f')
    if (sexB === 'male' && wife) return term('дядя (муж тёти)', 'm')
  }
  return spouseOf(sexB, relative)
}

function name(k: Kinship): KinshipTerm | null {
  switch (k.kind) {
    case 'self':
      return term('тот же человек', 'm')
    case 'direct':
    case 'collateral':
      return blood(k)
    case 'partner': {
      const noun: Noun =
        k.partnership === 'marriage'
          ? SPOUSE
          : k.partnership === 'engagement'
            ? { m: 'жених', f: 'невеста' }
            : { m: 'партнёр', f: 'партнёрша' }
      return form(k.sexB, noun, k.ended ? [(g) => (g === 'f' ? 'бывшая' : 'бывший')] : [])
    }
    case 'step':
      if (tooDistant(k)) return null
      if (k.up === 1 && k.down === 1) return form(k.sexB, SIBLING, [adj('сводн')])
      if (k.down === 0) {
        if (k.up === 1) return form(k.sexB, { m: 'отчим', f: 'мачеха' })
        return form(k.sexB, ancestorNoun(k.up), [LINEAGE.step!])
      }
      if (k.up === 0) {
        if (k.down === 1) return form(k.sexB, { m: 'пасынок', f: 'падчерица' })
        return form(k.sexB, descendantNoun(k.down), [LINEAGE.step!])
      }
      return null
    case 'in-law':
      return inLaw(k)
  }
}

export const russian: KinshipLanguage = {
  name: (k) => name(k),
  // "Анна — тётя (для: Мария)": Russian would put Мария in the dative or genitive, so the names
  // stay in the nominative behind a dash and "для:".
  phrase: (a, t) => `${t.term} (для: ${a})`,
  sentence: (a, b, t) => `${b} — ${t.term} (для: ${a}).`,
  distant: (a, b, k, ancestors) => {
    const gen = (n: number): string =>
      counted('ru', n, {
        one: 'поколение',
        few: 'поколения',
        many: 'поколений',
        other: 'поколения'
      })
    if (k.down === 0) return `${b} — предок по прямой линии (для: ${a}), ${gen(k.up)} назад.`
    if (k.up === 0) return `${b} — потомок по прямой линии (для: ${a}), через ${gen(k.down)}.`
    const related = bothFemale(k) ? 'родственницы' : 'родственники'
    const common = ancestors.length === 1 ? 'общего предка' : 'общих предков'
    return `${b} и ${a} — ${related} через ${common}: ${listOf('ru', ancestors)} (${gen(k.up)} вверх и ${k.down} вниз).`
  },
  byMarriage: (a, b, k) => `${b} и ${a} — ${bothFemale(k) ? 'свойственницы' : 'свойственники'}.`
}
