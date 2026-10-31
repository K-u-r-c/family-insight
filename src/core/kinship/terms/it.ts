import type { Sex } from '../../model/types'
import type { BloodKinship, Kinship, Lineage } from '../kinship'
import {
  bothFemale,
  counted,
  listOf,
  innerBlood,
  pick,
  term,
  tooDistant,
  type KinshipLanguage,
  type KinshipTerm
} from './common'

type MF = 'm' | 'f'

const GRADO = [
  '',
  'primo',
  'secondo',
  'terzo',
  'quarto',
  'quinto',
  'sesto',
  'settimo',
  'ottavo',
  'nono'
]
const NUMBER = [
  '',
  'una',
  'due',
  'tre',
  'quattro',
  'cinque',
  'sei',
  'sette',
  'otto',
  'nove',
  'dieci',
  'undici',
  'dodici'
]
const number = (n: number): string => NUMBER[n] ?? String(n)
/** " (una generazione sopra)", " (due generazioni sotto)": the generation gap, invariable. */
const generations = (n: number, older: boolean): string =>
  ` (${number(n)} ${n === 1 ? 'generazione' : 'generazioni'} ${older ? 'sopra' : 'sotto'})`

/**
 * A word in its male and female form (or one `n` word for unknown sex), an invariable part after
 * it ("di primo grado"), an adjective agreeing with it ("adottivo/adottiva") and an invariable
 * tail ("(figlio del fratello)"). Unknown sex without an `n` word gives "cugino o cugina …".
 */
interface Parts {
  m: string
  f: string
  n?: string
  mid?: string
  adj?: (g: MF) => string
  tail?: string
}

function make(sex: Sex, p: Parts): KinshipTerm {
  const mid = p.mid ?? ''
  const tail = p.tail ?? ''
  const adj = (g: MF): string => (p.adj ? ` ${p.adj(g)}` : '')
  if (sex === 'male') return term(`${p.m}${mid}${adj('m')}${tail}`, 'm')
  if (sex === 'female') return term(`${p.f}${mid}${adj('f')}${tail}`, 'f')
  if (p.n) return term(`${p.n}${mid}${adj('m')}${tail}`, 'm')
  if (!p.adj) return term(`${p.m} o ${p.f}${mid}${tail}`, 'm')
  return term(`${p.m}${mid}${adj('m')} o ${p.f}${mid}${adj('f')}${tail}`, 'm')
}

const agree =
  (stem: string) =>
  (g: MF): string =>
    g === 'f' ? `${stem}a` : `${stem}o`

/** Adoptive, foster and step adjectives; a foster child is "in affido" (affidatario is the carer). */
function lineageAdj(lineage: Lineage, child: boolean): Parts['adj'] {
  if (lineage === 'adoptive') return agree('adottiv')
  if (lineage === 'foster') return child ? () => 'in affido' : agree('affidatari')
  if (lineage === 'step') return agree('acquisit')
  return undefined
}

/** il / lo / la / l’ for a word (lo before s + consonant, z, gn, ps, pn, x, y, i + vowel). */
const VOWEL = /^[aeiouàèéìíòóùú]/i
const SEMIVOWEL = /^i[aeiouàèéìíòóùú]/i
const LO = /^(s[^aeiouàèéìíòóùú]|z|gn|ps|pn|x|y)/i
function article(t: KinshipTerm): 'il ' | 'lo ' | 'la ' | 'l’' {
  if (t.gender === 'f') return VOWEL.test(t.term) && !SEMIVOWEL.test(t.term) ? 'l’' : 'la '
  if (LO.test(t.term) || SEMIVOWEL.test(t.term)) return 'lo '
  return VOWEL.test(t.term) ? 'l’' : 'il '
}
const OF = { 'il ': 'del ', 'lo ': 'dello ', 'la ': 'della ', 'l’': 'dell’' } as const
/** "dello zio", "della cugina …", "dell’ex marito". */
const of = (t: KinshipTerm): string => `${OF[article(t)]}${t.term}`

function ancestorParts(up: number): Parts {
  if (up === 1) return { m: 'padre', f: 'madre', n: 'genitore' }
  if (up === 2) return { m: 'nonno', f: 'nonna' }
  if (up === 3) return { m: 'bisnonno', f: 'bisnonna' }
  if (up === 4) return { m: 'trisnonno', f: 'trisnonna' }
  return { m: 'antenato', f: 'antenata', tail: generations(up, true) }
}

function descendantParts(down: number): Parts {
  if (down === 1) return { m: 'figlio', f: 'figlia' }
  if (down === 2) return { m: 'nipote', f: 'nipote', n: 'nipote' }
  if (down === 3) return { m: 'pronipote', f: 'pronipote', n: 'pronipote' }
  return { m: 'discendente', f: 'discendente', n: 'discendente', tail: generations(down, false) }
}

function ancestor(sex: Sex, up: number, lineage: Lineage): KinshipTerm {
  if (lineage === 'step' && up === 1)
    return make(sex, { m: 'patrigno', f: 'matrigna', n: 'genitore acquisito' })
  return make(sex, { ...ancestorParts(up), adj: lineageAdj(lineage, false) })
}

function descendant(sex: Sex, down: number, lineage: Lineage): KinshipTerm {
  if (lineage === 'step' && down === 1) return make(sex, { m: 'figliastro', f: 'figliastra' })
  return make(sex, { ...descendantParts(down), adj: lineageAdj(lineage, true) })
}

const sibling = (half: boolean): Parts =>
  half ? { m: 'fratellastro', f: 'sorellastra' } : { m: 'fratello', f: 'sorella' }

function blood(k: BloodKinship): KinshipTerm | null {
  if (tooDistant(k)) return null
  const { up, down, sexB, half } = k
  if (down === 0) return ancestor(sexB, up, k.lineage)
  if (up === 0) return descendant(sexB, down, k.lineage)
  const adj = lineageAdj(k.lineage, false)
  const unilateral = half ? ' unilaterale' : ''
  if (up === 1 && down === 1) return make(sexB, { ...sibling(half), adj })
  if (up === 1) {
    // Nipote is also a grandchild: the sibling it goes through is named.
    const s = sibling(half)
    const ofSibling =
      k.branchSex === 'male'
        ? `del ${s.m}`
        : k.branchSex === 'female'
          ? `della ${s.f}`
          : `del ${s.m} o della ${s.f}`
    if (down === 2) {
      const child = pick(sexB, ['figlio', 'figlia', 'figlio o figlia'])
      return make(sexB, { ...descendantParts(2), adj, tail: ` (${child} ${ofSibling})` })
    }
    if (down === 3)
      return make(sexB, { ...descendantParts(3), adj, tail: ` (nipote ${ofSibling})` })
    return make(sexB, { ...descendantParts(down - 1), mid: ` ${ofSibling}`, adj })
  }
  if (down === 1) {
    if (up === 2) return make(sexB, { m: 'zio', f: 'zia', mid: unilateral, adj })
    if (up === 3) return make(sexB, { m: 'prozio', f: 'prozia', mid: unilateral, adj })
    const elder = ancestorParts(up - 1)
    return make(sexB, { ...sibling(half), mid: ` di un ${elder.m}${elder.tail ?? ''}`, adj })
  }
  const degree = Math.min(up, down) - 1
  const removed = Math.abs(up - down)
  return make(sexB, {
    m: 'cugino',
    f: 'cugina',
    mid: ` di ${GRADO[degree] ?? `${degree}°`} grado${unilateral}`,
    adj,
    tail: removed ? generations(removed, up > down) : ''
  })
}

function name(k: Kinship): KinshipTerm | null {
  switch (k.kind) {
    case 'self':
      return term('la stessa persona', 'f')
    case 'direct':
    case 'collateral':
      return blood(k)
    case 'partner': {
      const t = make(
        k.sexB,
        k.partnership === 'marriage'
          ? { m: 'marito', f: 'moglie', n: 'coniuge' }
          : k.partnership === 'engagement'
            ? { m: 'fidanzato', f: 'fidanzata' }
            : { m: 'compagno', f: 'compagna', n: 'partner' }
      )
      return k.ended ? term(`ex ${t.term}`, t.gender) : t
    }
    case 'step':
      if (tooDistant(k)) return null
      if (k.up === 1 && k.down === 1)
        return make(k.sexB, { m: 'fratello', f: 'sorella', adj: agree('acquisit') })
      if (k.down === 0) return ancestor(k.sexB, k.up, 'step')
      if (k.up === 0) return descendant(k.sexB, k.down, 'step')
      return null
    case 'in-law': {
      if (tooDistant(k)) return null
      const { up, down, sexB, partnerSex } = k
      // Cognato also covers the husband of one's cognata (Treccani), so co-siblings-in-law too.
      if (k.via === 'both' || (up === 1 && down === 1))
        return make(sexB, { m: 'cognato', f: 'cognata' })
      if (k.via === 'partner-of-a') {
        if (up === 1 && down === 0) return make(sexB, { m: 'suocero', f: 'suocera' })
        const inner = blood(innerBlood(k, sexB))
        const partner = partnerSex === 'female' ? 'della partner' : 'del partner'
        if (!inner) return null
        // "nipote del partner (figlio del fratello)": before the explanation in brackets.
        const cut = inner.term.endsWith(')') ? inner.term.indexOf(' (') : -1
        const text =
          cut < 0
            ? `${inner.term} ${partner}`
            : `${inner.term.slice(0, cut)} ${partner}${inner.term.slice(cut)}`
        return term(text, inner.gender)
      }
      if (up === 0 && down === 1) return make(sexB, { m: 'genero', f: 'nuora' })
      // "moglie dello zio"; unknown sex of the relative: "moglie del nonno o della nonna".
      const relatives =
        partnerSex === 'male' || partnerSex === 'female'
          ? [blood(innerBlood(k, partnerSex))]
          : [blood(innerBlood(k, 'male')), blood(innerBlood(k, 'female'))]
      if (relatives.some((r) => !r)) return null
      const spouse = make(sexB, { m: 'marito', f: 'moglie', n: 'partner' })
      return term(`${spouse.term} ${relatives.map((r) => of(r!)).join(' o ')}`, spouse.gender)
    }
  }
}

export const italian: KinshipLanguage = {
  name: (k) => name(k),
  // "Anna è la zia di Maria": the names are not inflected; l’ before a vowel, lo before s + cons., z …
  phrase: (a, t) => `${article(t)}${t.term} di ${a}`,
  sentence: (a, b, t) => `${b} è ${italian.phrase(a, t)}.`,
  distant: (a, b, k, ancestors) => {
    const gen = (n: number): string =>
      counted('it', n, { one: 'generazione', other: 'generazioni' })
    if (k.down === 0) return `${a} discende in linea retta da ${b} (${gen(k.up)} prima).`
    if (k.up === 0) return `${b} discende in linea retta da ${a} (${gen(k.down)} dopo).`
    const related = bothFemale(k) ? 'imparentate' : 'imparentati'
    return `${b} e ${a} sono ${related} per discendenza comune (${listOf('it', ancestors)}): ${gen(k.up)} verso l’alto e ${k.down} verso il basso.`
  },
  byMarriage: (a, b, k) =>
    `${b} e ${a} sono ${bothFemale(k) ? 'parenti acquisite' : 'parenti acquisiti'}.`
}
