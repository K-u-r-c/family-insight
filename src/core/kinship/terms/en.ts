import type { Sex } from '../../model/types'
import type { BloodKinship, Kinship, Lineage } from '../kinship'
import { counted, innerBlood, listOf, term, tooDistant, type KinshipLanguage } from './common'

const ORDINALS = [
  '',
  'first',
  'second',
  'third',
  'fourth',
  'fifth',
  'sixth',
  'seventh',
  'eighth',
  'ninth'
]
const ordinal = (n: number): string => ORDINALS[n] ?? `${n}th`
const removedText = (n: number): string =>
  n === 0 ? '' : n === 1 ? ' once removed' : n === 2 ? ' twice removed' : ` ${n} times removed`
/** "great-" k times; from four on "4× great-". */
const greats = (k: number): string => (k <= 0 ? '' : k <= 3 ? 'great-'.repeat(k) : `${k}× great-`)

/** A male, female or (unknown sex) "female or male" word, each with the same prefix. */
function word(sex: Sex, prefix: string, male: string, female: string): string {
  if (sex === 'male') return prefix + male
  if (sex === 'female') return prefix + female
  return `${prefix}${female} or ${prefix}${male}`
}
const neutral = (sex: Sex, prefix: string, male: string, female: string, either: string): string =>
  sex === 'male' || sex === 'female' ? word(sex, prefix, male, female) : prefix + either

/** Step-, adoptive and foster words: "stepfather" but "step-grandfather". */
function withLineage(text: string, lineage: Lineage, child: boolean): string {
  if (lineage === 'biological') return text
  if (lineage === 'step') return /^(great|grand|\d)/.test(text) ? `step-${text}` : `step${text}`
  if (lineage === 'foster') return `foster ${text}`
  return `${child ? 'adopted' : 'adoptive'} ${text}`
}

const ancestor = (sex: Sex, up: number): string =>
  up === 1
    ? neutral(sex, '', 'father', 'mother', 'parent')
    : neutral(sex, greats(up - 2), 'grandfather', 'grandmother', 'grandparent')
const descendant = (sex: Sex, down: number): string =>
  down === 1
    ? neutral(sex, '', 'son', 'daughter', 'child')
    : neutral(sex, greats(down - 2), 'grandson', 'granddaughter', 'grandchild')

function blood(k: BloodKinship): string | null {
  if (tooDistant(k)) return null
  const { up, down, sexB } = k
  if (down === 0) return withLineage(ancestor(sexB, up), k.lineage, false)
  if (up === 0) return withLineage(descendant(sexB, down), k.lineage, true)
  const half = k.half ? 'half-' : ''
  let text: string
  if (up === 1 && down === 1) text = neutral(sexB, half, 'brother', 'sister', 'sibling')
  else if (up === 1)
    text = word(sexB, `${half}${down === 2 ? '' : `${greats(down - 3)}grand`}`, 'nephew', 'niece')
  else if (down === 1) text = word(sexB, `${half}${greats(up - 2)}`, 'uncle', 'aunt')
  else {
    const degree = Math.min(up, down) - 1
    text = `${k.half ? 'half ' : ''}${ordinal(degree)} cousin${removedText(Math.abs(up - down))}`
  }
  return withLineage(text, k.lineage, false)
}

function name(k: Kinship): string | null {
  switch (k.kind) {
    case 'self':
      return 'the same person'
    case 'direct':
    case 'collateral':
      return blood(k)
    case 'partner': {
      const text =
        k.partnership === 'marriage'
          ? neutral(k.sexB, '', 'husband', 'wife', 'spouse')
          : k.partnership === 'engagement'
            ? neutral(k.sexB, '', 'fiancé', 'fiancée', 'fiancé(e)')
            : 'partner'
      return k.ended ? (k.partnership === 'marriage' ? `ex-${text}` : `former ${text}`) : text
    }
    case 'step':
      if (tooDistant(k)) return null
      if (k.up === 1 && k.down === 1) return neutral(k.sexB, 'step', 'brother', 'sister', 'sibling')
      if (k.down === 0) return withLineage(ancestor(k.sexB, k.up), 'step', false)
      if (k.up === 0) return withLineage(descendant(k.sexB, k.down), 'step', true)
      return null
    case 'in-law': {
      if (tooDistant(k)) return null
      const { up, down, sexB } = k
      if (k.via === 'both')
        return neutral(sexB, 'co-', 'brother-in-law', 'sister-in-law', 'sibling-in-law')
      if (up === 1 && down === 1)
        return neutral(sexB, '', 'brother-in-law', 'sister-in-law', 'sibling-in-law')
      if (k.via === 'partner-of-a') {
        if (down === 0 && up <= 3)
          return `${ancestor(sexB, up)}-in-law`.replace(' or ', '-in-law or ')
        const inner = blood(innerBlood(k, sexB))
        return inner && `partner’s ${inner}`
      }
      if (up === 0 && down <= 3)
        return `${descendant(sexB, down)}-in-law`.replace(' or ', '-in-law or ')
      const relative = blood(innerBlood(k, k.partnerSex))
      return relative && `${relative}’s ${neutral(sexB, '', 'husband', 'wife', 'partner')}`
    }
  }
}

export const english: KinshipLanguage = {
  name: (k) => {
    const text = name(k)
    return text === null ? null : term(text, 'n')
  },
  phrase: (a, t) => `the ${t.term} of ${a}`,
  sentence: (a, b, t) => `${b} is the ${t.term} of ${a}.`,
  distant: (a, b, k, ancestors) => {
    const gen = (n: number): string => counted('en', n, { one: 'generation', other: 'generations' })
    if (k.down === 0) return `${b} is an ancestor of ${a}, ${gen(k.up)} back.`
    if (k.up === 0) return `${b} is a descendant of ${a}, ${gen(k.down)} later.`
    const common = ancestors.length === 1 ? 'common ancestor' : 'common ancestors'
    return `${b} and ${a} are related through the ${common} ${listOf('en', ancestors)}, ${gen(k.up)} up and ${k.down} down.`
  },
  byMarriage: (a, b) => `${b} and ${a} are related by marriage.`
}
