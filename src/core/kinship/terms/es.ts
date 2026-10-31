import type { Sex } from '../../model/types'
import type { BloodKinship, Kinship, Lineage } from '../kinship'
import {
  bothFemale,
  counted,
  listOf,
  term,
  tooDistant,
  type KinshipLanguage,
  type KinshipTerm
} from './common'

/** Grammatical gender of a Spanish word: there is no neuter article for nouns. */
type G = 'm' | 'f'

const ORDINALS = [
  '',
  'primer',
  'segund',
  'tercer',
  'cuart',
  'quint',
  'sext',
  'séptim',
  'octav',
  'noven',
  'décim',
  'undécim'
]
/** Ordinal agreeing with its noun: segundo / segunda (always the full form, after the noun too). */
const ordinal = (n: number, g: G): string => {
  const stem = ORDINALS[n]
  return stem ? `${stem}${g === 'm' ? 'o' : 'a'}` : `${n}.${g === 'm' ? 'º' : 'ª'}`
}
const o = (g: G): string => (g === 'm' ? 'o' : 'a')

/** padre, abuelo, bisabuelo, tatarabuelo, trastatarabuelo, then "quinto abuelo" … */
function ancestorWord(g: G, up: number): string {
  if (up === 1) return g === 'm' ? 'padre' : 'madre'
  const prefix = ['', '', '', 'bis', 'tatar', 'trastatar'][up]
  return prefix !== undefined ? `${prefix}abuel${o(g)}` : `${ordinal(up - 1, g)} abuel${o(g)}`
}

/** hijo, nieto, bisnieto, tataranieto, trastataranieto, then "quinto nieto" … */
function descendantWord(g: G, down: number): string {
  if (down === 1) return `hij${o(g)}`
  const prefix = ['', '', '', 'bis', 'tatara', 'trastatara'][down]
  return prefix !== undefined ? `${prefix}niet${o(g)}` : `${ordinal(down - 1, g)} niet${o(g)}`
}

/**
 * The blood word for `up`/`down` (biological, full). Collaterals of another generation follow
 * the Spanish usage: a parent's first cousin is "tío segundo", a first cousin's child "sobrino
 * segundo", a grandparent's first cousin "tío abuelo segundo".
 */
function bloodWord(g: G, up: number, down: number): string {
  if (down === 0) return ancestorWord(g, up)
  if (up === 0) return descendantWord(g, down)
  const n = Math.min(up, down)
  const r = up - down
  if (r === 0) {
    if (n === 1) return `herman${o(g)}`
    return `prim${o(g)} ${n === 2 ? `herman${o(g)}` : ordinal(n - 1, g)}`
  }
  const head = r > 0 ? `tí${o(g)}` : `sobrin${o(g)}`
  const gens = Math.abs(r)
  const generation = gens < 2 ? '' : ` ${r > 0 ? ancestorWord(g, gens) : descendantWord(g, gens)}`
  return `${head}${generation}${n >= 2 ? ` ${ordinal(n, g)}` : ''}`
}

/** Words with their own step form: padrastro, hijastro, hermanastro, abuelastro, nietastro. */
function stepWord(g: G, up: number, down: number): string {
  if (up === 1 && down === 1) return `hermanastr${o(g)}`
  if (up === 1 && down === 0) return g === 'm' ? 'padrastro' : 'madrastra'
  if (up === 2 && down === 0) return `abuelastr${o(g)}`
  if (up === 0 && down === 1) return `hijastr${o(g)}`
  if (up === 0 && down === 2) return `nietastr${o(g)}`
  // No word of its own: "por afinidad", as the app labels step links.
  return `${bloodWord(g, up, down)} por afinidad`
}

function withLineage(word: string, g: G, lineage: Lineage): string {
  if (lineage === 'adoptive') return `${word} adoptiv${o(g)}`
  if (lineage === 'foster') return `${word} de acogida`
  return word
}

/** Masculine or feminine word by sex; for unknown sex "masculine o feminine" (masculine). */
function bySex(sex: Sex, word: (g: G) => string): KinshipTerm {
  if (sex === 'male') return term(word('m'), 'm')
  if (sex === 'female') return term(word('f'), 'f')
  return term(`${word('m')} o ${word('f')}`, 'm')
}

function blood(k: BloodKinship): KinshipTerm | null {
  if (tooDistant(k)) return null
  const { up, down, lineage } = k
  // es.json uses "progenitor" for a parent of unknown sex.
  if (up === 1 && down === 0 && lineage !== 'step' && k.sexB !== 'male' && k.sexB !== 'female')
    return term(withLineage('progenitor', 'm', lineage), 'm')
  return bySex(k.sexB, (g) => {
    if (lineage === 'step') return stepWord(g, up, down)
    const word = bloodWord(g, up, down)
    const half = k.half ? `${g === 'm' ? 'medio' : 'media'} ${word}` : word
    return withLineage(half, g, lineage)
  })
}

function name(k: Kinship): KinshipTerm | null {
  switch (k.kind) {
    case 'self':
      return term('la misma persona', 'f')
    case 'direct':
    case 'collateral':
      return blood(k)
    case 'partner': {
      // RAE 2010: "ex" is joined to a one-word base (exesposa, expareja).
      const ex = k.ended ? 'ex' : ''
      if (k.partnership === 'marriage') {
        if (k.sexB !== 'male' && k.sexB !== 'female') return term(`${ex}cónyuge`, 'm')
        return bySex(k.sexB, (g) => `${ex}espos${o(g)}`)
      }
      if (k.partnership === 'engagement') return bySex(k.sexB, (g) => `${ex}prometid${o(g)}`)
      return term(`${ex}pareja`, 'f')
    }
    case 'step':
      if (tooDistant(k)) return null
      if (k.up > 0 && k.down > 0 && !(k.up === 1 && k.down === 1)) return null
      return bySex(k.sexB, (g) => stepWord(g, k.up, k.down))
    case 'in-law': {
      if (tooDistant(k)) return null
      const { up, down } = k
      return bySex(k.sexB, (g) => {
        if (k.via === 'both') return `concuñad${o(g)}`
        if (up === 1 && down === 1) return `cuñad${o(g)}`
        if (k.via === 'partner-of-a') {
          if (up === 1 && down === 0) return `suegr${o(g)}`
          // The partner's descendants are step relatives (hijastro, nietastro).
          if (up === 0 && down <= 2) return stepWord(g, up, down)
        } else {
          if (up === 0 && down === 1) return g === 'm' ? 'yerno' : 'nuera'
          // A parent's or grandparent's partner: padrastro, abuelastro.
          if (down === 0 && up <= 2) return stepWord(g, up, down)
        }
        // "Político" for both the partner's relatives and the relatives' partners.
        return `${bloodWord(g, up, down)} polític${o(g)}`
      })
    }
  }
}

export const spanish: KinshipLanguage = {
  name: (k) => name(k),
  // "Anna es la tía de Maria": the names stay as they are.
  phrase: (a, t) => `${t.gender === 'f' ? 'la' : 'el'} ${t.term} de ${a}`,
  sentence: (a, b, t) => `${b} es ${spanish.phrase(a, t)}.`,
  distant: (a, b, k, ancestors) => {
    const gen = (n: number): string =>
      counted('es', n, { one: 'generación', other: 'generaciones' })
    if (k.down === 0) return `${a} desciende en línea directa de ${b} (${gen(k.up)} atrás).`
    if (k.up === 0) return `${b} desciende en línea directa de ${a} (${gen(k.down)} después).`
    const related = bothFemale(k) ? 'emparentadas' : 'emparentados'
    return `${b} y ${a} están ${related} por ascendencia común (${listOf('es', ancestors)}): ${gen(k.up)} hacia arriba y ${k.down} hacia abajo.`
  },
  byMarriage: (a, b, k) =>
    `${b} y ${a} son ${bothFemale(k) ? 'parientes políticas' : 'parientes políticos'}.`
}
