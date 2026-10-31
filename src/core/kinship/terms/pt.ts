import type { PartnershipKind, Sex } from '../../model/types'
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

/**
 * Brazilian Portuguese. Ancestors and descendants follow the dictionary series (bisavô,
 * trisavô = father of the bisavô, tetravô … octavô; bisneto, trineto …); cousins count by
 * common ancestors (primo em segundo grau = shared great-grandparents), and cousins in another
 * generation get an explicit note ("prima (uma geração abaixo)"), because the colloquial
 * "primo em segundo grau" is also used for a cousin's child. Foster is "de criação", step
 * links beyond padrasto/madrasta/enteado are "postiço" (irmão postiço, avô postiço) – "por
 * afinidade" would clash with in-laws, who are legally "afins" too.
 */

/** A word in its male and female forms, with invariable words after it ("em segundo grau"). */
interface Pair {
  m: string
  f: string
  rest?: string
}
/** An adjective after the noun, agreeing with it: masculine, feminine, or plural for "X ou Y". */
type Adj = (form: 'm' | 'f' | 'pl') => string

const agree =
  (stem: string): Adj =>
  (form) =>
    stem + (form === 'f' ? 'a' : form === 'pl' ? 'os' : 'o')

const LINEAGE: Partial<Record<Lineage, Adj>> = {
  adoptive: agree('adotiv'),
  foster: () => 'de criação',
  step: agree('postiç')
}

/** The male or female word, or for unknown sex "male ou female" (adjective in the plural). */
function finish(sex: Sex, p: Pair, adj?: Adj): KinshipTerm {
  const text = (noun: string, form: 'm' | 'f' | 'pl'): string =>
    [noun, adj?.(form), p.rest].filter(Boolean).join(' ')
  if (sex === 'male') return term(text(p.m, 'm'), 'm')
  if (sex === 'female') return term(text(p.f, 'f'), 'f')
  return p.m === p.f ? term(text(p.m, 'm'), 'm') : term(text(`${p.m} ou ${p.f}`, 'pl'), 'm')
}

const UP_M = [
  '',
  'pai',
  'avô',
  'bisavô',
  'trisavô',
  'tetravô',
  'pentavô',
  'hexavô',
  'heptavô',
  'octavô'
]
const UP_F = [
  '',
  'mãe',
  'avó',
  'bisavó',
  'trisavó',
  'tetravó',
  'pentavó',
  'hexavó',
  'heptavó',
  'octavó'
]
const DOWN_M = [
  '',
  'filho',
  'neto',
  'bisneto',
  'trineto',
  'tetraneto',
  'pentaneto',
  'hexaneto',
  'heptaneto',
  'octaneto'
]
const DOWN_F = [
  '',
  'filha',
  'neta',
  'bisneta',
  'trineta',
  'tetraneta',
  'pentaneta',
  'hexaneta',
  'heptaneta',
  'octaneta'
]

const ORDINALS = [
  '',
  'primeiro',
  'segundo',
  'terceiro',
  'quarto',
  'quinto',
  'sexto',
  'sétimo',
  'oitavo',
  'nono'
]
const NUMBERS = ['', 'uma', 'duas', 'três']

/** "(uma geração abaixo)", "(duas gerações acima)", "(10 gerações acima)". */
function generations(n: number, older: boolean): string {
  const count = NUMBERS[n] ?? String(n)
  return `(${count} ${n === 1 ? 'geração' : 'gerações'} ${older ? 'acima' : 'abaixo'})`
}

/** Ancestor `up` generations above, or a generic "ancestral" beyond octavô. */
function ancestor(up: number): Pair {
  const m = UP_M[up]
  const f = UP_F[up]
  return m && f ? { m, f } : { m: 'ancestral', f: 'ancestral', rest: generations(up, true) }
}

function descendant(down: number): Pair {
  const m = DOWN_M[down]
  const f = DOWN_F[down]
  return m && f ? { m, f } : { m: 'descendente', f: 'descendente', rest: generations(down, false) }
}

function direct(sex: Sex, up: number, down: number, lineage: Lineage): KinshipTerm {
  if (down === 0) {
    if (lineage === 'step' && up === 1) return finish(sex, { m: 'padrasto', f: 'madrasta' })
    return finish(sex, ancestor(up), LINEAGE[lineage])
  }
  if (lineage === 'step' && down === 1) return finish(sex, { m: 'enteado', f: 'enteada' })
  return finish(sex, descendant(down), LINEAGE[lineage])
}

/** Tio, tio-avô, tio-bisavô … (`up` from `a` to the common ancestor). */
function uncle(up: number): Pair {
  if (up === 2) return { m: 'tio', f: 'tia' }
  const m = UP_M[up - 1]
  const f = UP_F[up - 1]
  return m && f
    ? { m: `tio-${m}`, f: `tia-${f}` }
    : { m: 'tio', f: 'tia', rest: generations(up - 1, true) }
}

/** Sobrinho, sobrinho-neto, sobrinho-bisneto … (`down` from the common ancestor to `b`). */
function nephew(down: number): Pair {
  if (down === 2) return { m: 'sobrinho', f: 'sobrinha' }
  const m = DOWN_M[down - 1]
  const f = DOWN_F[down - 1]
  return m && f
    ? { m: `sobrinho-${m}`, f: `sobrinha-${f}` }
    : { m: 'sobrinho', f: 'sobrinha', rest: generations(down - 1, false) }
}

function cousin(up: number, down: number): Pair {
  const degree = Math.min(up, down) - 1
  const removed = Math.abs(up - down)
  const grade = degree > 1 ? `em ${ORDINALS[degree] ?? `${degree}º`} grau` : ''
  const generation = removed > 0 ? generations(removed, up > down) : ''
  return { m: 'primo', f: 'prima', rest: [grade, generation].filter(Boolean).join(' ') }
}

function blood(k: BloodKinship): KinshipTerm | null {
  if (tooDistant(k)) return null
  const { up, down, sexB } = k
  if (up === 0 || down === 0) return direct(sexB, up, down, k.lineage)
  const p =
    up === 1 && down === 1
      ? { m: 'irmão', f: 'irmã' }
      : up === 1
        ? nephew(down)
        : down === 1
          ? uncle(up)
          : cousin(up, down)
  const half = k.half ? { ...p, m: `meio-${p.m}`, f: `meia-${p.f}` } : p
  return finish(sexB, half, k.lineage === 'biological' ? undefined : LINEAGE[k.lineage])
}

const PARTNER: Record<PartnershipKind, [male: string, female: string, neutral?: string]> = {
  marriage: ['marido', 'esposa', 'cônjuge'],
  partnership: ['companheiro', 'companheira'],
  engagement: ['noivo', 'noiva'],
  other: ['parceiro', 'parceira']
}

function partner(sex: Sex, kind: PartnershipKind, ended: boolean): KinshipTerm {
  const [m, f, neutral] = PARTNER[kind]
  const ex = ended ? 'ex-' : ''
  if (neutral && sex !== 'male' && sex !== 'female') return term(ex + neutral, 'm')
  return finish(sex, { m: ex + m, f: ex + f })
}

/** "do marido", "da esposa", "do cônjuge": a's partner, after a blood term. */
const ofPartner = (sex: Sex): string =>
  sex === 'male' ? 'do marido' : sex === 'female' ? 'da esposa' : 'do cônjuge'

function name(k: Kinship): KinshipTerm | null {
  switch (k.kind) {
    case 'self':
      return term('mesma pessoa', 'f')
    case 'direct':
    case 'collateral':
      return blood(k)
    case 'partner':
      return partner(k.sexB, k.partnership, k.ended)
    case 'step':
      if (tooDistant(k)) return null
      if (k.up === 1 && k.down === 1) return finish(k.sexB, { m: 'irmão', f: 'irmã' }, LINEAGE.step)
      if (k.up === 0 || k.down === 0) return direct(k.sexB, k.up, k.down, 'step')
      return null
    case 'in-law': {
      if (tooDistant(k)) return null
      const { up, down, sexB, partnerSex } = k
      if (k.via === 'both') return finish(sexB, { m: 'concunhado', f: 'concunhada' })
      if (up === 1 && down === 1) return finish(sexB, { m: 'cunhado', f: 'cunhada' })
      if (k.via === 'partner-of-a') {
        if (up === 1 && down === 0) return finish(sexB, { m: 'sogro', f: 'sogra' })
        // Avô do marido, sobrinha da esposa …
        const inner = blood(innerBlood(k, sexB))
        return inner && term(`${inner.term} ${ofPartner(partnerSex)}`, inner.gender)
      }
      if (up === 0 && down === 1) return finish(sexB, { m: 'genro', f: 'nora' })
      // Marido da tia, esposa do neto …
      const relative = blood(innerBlood(k, partnerSex))
      if (!relative) return null
      const spouse = partner(sexB, 'marriage', false)
      return term(
        `${spouse.term} ${relative.gender === 'f' ? 'da' : 'do'} ${relative.term}`,
        spouse.gender
      )
    }
  }
}

export const portuguese: KinshipLanguage = {
  name: (k) => name(k),
  // "Anna é a tia de Maria": the article follows the grammatical gender of the term.
  phrase: (a, t) => `${t.gender === 'f' ? 'a' : 'o'} ${t.term} de ${a}`,
  sentence: (a, b, t) => `${b} é ${portuguese.phrase(a, t)}.`,
  distant: (a, b, k, ancestors) => {
    const gen = (n: number): string => counted('pt', n, { one: 'geração', other: 'gerações' })
    if (k.down === 0) return `${a} descende em linha reta de ${b} (${gen(k.up)} acima).`
    if (k.up === 0) return `${b} descende em linha reta de ${a} (${gen(k.down)} abaixo).`
    return `${b} e ${a} são parentes por ascendência comum (${listOf('pt', ancestors)}): ${gen(k.up)} acima e ${k.down} abaixo.`
  },
  byMarriage: (a, b) => `${b} e ${a} são parentes por afinidade.`
}
