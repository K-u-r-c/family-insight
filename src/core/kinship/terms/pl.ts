import type { Sex } from '../../model/types'
import type { BloodKinship, Kinship, Lineage } from '../kinship'
import {
  bothFemale,
  listOf,
  term,
  tooDistant,
  type KinshipLanguage,
  type KinshipTerm
} from './common'

type G = KinshipTerm['gender']
const LINE = [
  '',
  'pierwszej',
  'drugiej',
  'trzeciej',
  'czwartej',
  'piątej',
  'szóstej',
  'siódmej',
  'ósmej',
  'dziewiątej'
]

/** Male, female or unknown-sex word with its gender ("rodzeństwo" is neuter). */
function w(
  sex: Sex,
  male: string,
  female: string,
  neutral = `${male} lub ${female}`,
  ng: G = 'm'
): KinshipTerm {
  return sex === 'male' ? term(male, 'm') : sex === 'female' ? term(female, 'f') : term(neutral, ng)
}
/** Adjective agreeing with the word: przyrodni / przyrodnia / przyrodnie. */
const adj = (stem: string, g: G): string =>
  g === 'f' ? `${stem}a` : g === 'n' ? `${stem}e` : `${stem}y`
const softAdj = (stem: string, g: G): string =>
  g === 'f' ? `${stem}a` : g === 'n' ? `${stem}e` : stem
const after = (t: KinshipTerm, word: string): KinshipTerm => term(`${t.term} ${word}`, t.gender)

const LINEAGE: Partial<Record<Lineage, (g: G) => string>> = {
  adoptive: (g) => adj('adopcyjn', g),
  foster: (g) => adj('zastępcz', g),
  step: (g) => adj('przybran', g)
}

function generations(n: number): string {
  const last = n % 10
  const teen = n % 100 >= 12 && n % 100 <= 14
  return n === 1 ? 'pokolenie' : !teen && last >= 2 && last <= 4 ? `${n} pokolenia` : `${n} pokoleń`
}

function ancestor(sex: Sex, up: number, lineage: Lineage): KinshipTerm {
  if (lineage === 'step' && up === 1) return w(sex, 'ojczym', 'macocha')
  let t: KinshipTerm
  if (up === 1) t = w(sex, 'ojciec', 'matka', 'rodzic')
  else if (up <= 6) {
    const pra = 'pra'.repeat(up - 2)
    t = w(sex, `${pra}dziadek`, `${pra}babcia`)
  } else t = w(sex, `przodek w ${up}. pokoleniu`, `przodkini w ${up}. pokoleniu`)
  const extra = LINEAGE[lineage]
  return extra ? after(t, extra(t.gender)) : t
}

function descendant(sex: Sex, down: number, lineage: Lineage): KinshipTerm {
  if (lineage === 'step' && down === 1) return w(sex, 'pasierb', 'pasierbica')
  let t: KinshipTerm
  if (down === 1) t = w(sex, 'syn', 'córka', 'dziecko', 'n')
  else if (down <= 6) {
    const pra = 'pra'.repeat(down - 2)
    t = w(sex, `${pra}wnuk`, `${pra}wnuczka`)
  } else t = w(sex, `potomek w ${down}. pokoleniu`, `potomkini w ${down}. pokoleniu`)
  const extra = LINEAGE[lineage]
  return extra ? after(t, extra(t.gender)) : t
}

function blood(k: BloodKinship): KinshipTerm | null {
  if (tooDistant(k)) return null
  const { up, down, sexB, side, branchSex } = k
  if (down === 0) return ancestor(sexB, up, k.lineage)
  if (up === 0) return descendant(sexB, down, k.lineage)
  let t: KinshipTerm
  if (up === 1 && down === 1) t = w(sexB, 'brat', 'siostra', 'rodzeństwo', 'n')
  else if (up === 1 && down === 2) {
    t =
      branchSex === 'male'
        ? w(sexB, 'bratanek', 'bratanica')
        : branchSex === 'female'
          ? w(sexB, 'siostrzeniec', 'siostrzenica')
          : w(
              sexB,
              'bratanek lub siostrzeniec',
              'bratanica lub siostrzenica',
              'dziecko rodzeństwa',
              'n'
            )
  } else if (up === 1) {
    const of = branchSex === 'male' ? 'brata' : branchSex === 'female' ? 'siostry' : 'rodzeństwa'
    const pra = 'pra'.repeat(down - 3)
    t = w(sexB, `${pra}wnuk ${of}`, `${pra}wnuczka ${of}`)
  } else if (down === 1 && up === 2) {
    t = w(sexB, side === 'paternal' ? 'stryj' : 'wuj', 'ciotka', 'ciotka lub wuj', 'f')
  } else if (down === 1) {
    const pra = 'pra'.repeat(up - 3)
    t = w(
      sexB,
      `${side === 'paternal' ? 'stryjeczny' : 'wujeczny'} ${pra}dziadek`,
      `cioteczna ${pra}babcia`,
      `cioteczna ${pra}babcia lub ${side === 'paternal' ? 'stryjeczny' : 'wujeczny'} ${pra}dziadek`,
      'f'
    )
  } else {
    const degree = Math.min(up, down) - 1
    const removed = Math.abs(up - down)
    // Brat stryjeczny, wujeczny, cioteczny: children of a parent's sibling (same generation).
    const kind =
      degree !== 1 || removed > 0
        ? ''
        : branchSex === 'female'
          ? 'cioteczn'
          : branchSex === 'male' && side === 'paternal'
            ? 'stryjeczn'
            : branchSex === 'male' && side === 'maternal'
              ? 'wujeczn'
              : ''
    if (kind) t = w(sexB, `brat ${kind}y`, `siostra ${kind}a`, `rodzeństwo ${kind}e`, 'n')
    else {
      const line =
        degree === 1 ? '' : LINE[degree] ? ` w ${LINE[degree]} linii` : ` w ${degree}. linii`
      t = w(sexB, `kuzyn${line}`, `kuzynka${line}`, `kuzyn lub kuzynka${line}`)
    }
    if (removed > 0) {
      const older = up > down
      t = after(t, `(o ${generations(removed)} ${adj(older ? 'starsz' : 'młodsz', t.gender)})`)
    }
  }
  if (k.half) t = after(t, softAdj('przyrodni', t.gender))
  const extra = k.lineage === 'biological' ? undefined : LINEAGE[k.lineage]
  return extra ? after(t, extra(t.gender)) : t
}

const RELATIVE_BY_MARRIAGE = (sex: Sex): KinshipTerm => w(sex, 'powinowaty', 'powinowata')

function name(k: Kinship): KinshipTerm | null {
  switch (k.kind) {
    case 'self':
      return term('ta sama osoba', 'f')
    case 'direct':
    case 'collateral':
      return blood(k)
    case 'partner': {
      const t =
        k.partnership === 'marriage'
          ? w(k.sexB, 'mąż', 'żona', 'małżonek lub małżonka')
          : k.partnership === 'engagement'
            ? w(k.sexB, 'narzeczony', 'narzeczona')
            : w(k.sexB, 'partner', 'partnerka')
      return k.ended
        ? term(`${softAdj('był', t.gender).replace(/^był$/, 'były')} ${t.term}`, t.gender)
        : t
    }
    case 'step':
      if (tooDistant(k)) return null
      if (k.up === 1 && k.down === 1)
        return w(k.sexB, 'brat przybrany', 'siostra przybrana', 'przybrane rodzeństwo', 'n')
      if (k.down === 0) return ancestor(k.sexB, k.up, 'step')
      if (k.up === 0) return descendant(k.sexB, k.down, 'step')
      return null
    case 'in-law': {
      if (tooDistant(k)) return null
      const { up, down, sexB, partnerSex } = k
      if (k.via === 'both') return w(sexB, 'szwagier', 'szwagierka')
      if (k.via === 'partner-of-a') {
        if (up === 1 && down === 0) {
          return partnerSex === 'male'
            ? w(sexB, 'teść (świekr)', 'teściowa (świekra)')
            : w(sexB, 'teść', 'teściowa')
        }
        if (up === 1 && down === 1) return w(sexB, 'szwagier', 'szwagierka')
        return RELATIVE_BY_MARRIAGE(sexB)
      }
      if (up === 0 && down === 1) return w(sexB, 'zięć', 'synowa')
      if (up === 0 && down === 2) {
        if (sexB === 'female' && partnerSex === 'male') return term('żona wnuka', 'f')
        if (sexB === 'male' && partnerSex === 'female') return term('mąż wnuczki', 'm')
      }
      if (up === 1 && down === 1) {
        if (sexB === 'female' && partnerSex === 'male') return term('bratowa', 'f')
        return w(sexB, 'szwagier', 'szwagierka')
      }
      if (up === 2 && down === 1) {
        if (sexB === 'female' && partnerSex === 'male') {
          return term(k.side === 'paternal' ? 'stryjenka' : 'wujenka', 'f')
        }
        if (sexB === 'male' && partnerSex === 'female') return term('wuj (mąż ciotki)', 'm')
      }
      return RELATIVE_BY_MARRIAGE(sexB)
    }
  }
}

export const polish: KinshipLanguage = {
  name: (k) => name(k),
  // "Anna to ciotka osoby Maria": the names stay in the nominative.
  phrase: (a, t) => `${t.term} osoby ${a}`,
  sentence: (a, b, t) => `${b} to ${t.term} osoby ${a}.`,
  distant: (a, b, k, ancestors) => {
    if (k.down === 0) return `${a} pochodzi w prostej linii od: ${b} (${generations(k.up)} wstecz).`
    if (k.up === 0) return `${b} pochodzi w prostej linii od: ${a} (${generations(k.down)} dalej).`
    const related = bothFemale(k) ? 'spokrewnione' : 'spokrewnieni'
    const common = ancestors.length === 1 ? 'wspólnego przodka' : 'wspólnych przodków'
    return `${b} i ${a} są ${related} przez ${common}: ${listOf('pl', ancestors)} (${generations(k.up)} w górę i ${k.down} w dół).`
  },
  byMarriage: (a, b, k) => `${b} i ${a} są ${bothFemale(k) ? 'spowinowacone' : 'spowinowaceni'}.`
}
