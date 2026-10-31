import type { Sex } from '../../model/types'
import type { BloodKinship, Kinship, Side } from '../kinship'
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

/**
 * Elision before a vowel or a mute h: l’oncle, d’Anna, d’Yves – but not before a y sounded as a
 * consonant (de Yann). No kinship word starts with an aspirate h.
 */
const elides = (word: string): boolean =>
  /^(?:[aeiouàâäéèêëîïôöùûüœæh]|y(?![aeiouéèêàâ]))/i.test(word)

/** Male, female or unknown-sex word with its grammatical gender. */
function w(sex: Sex, male: string, female: string, neutral = `${male} ou ${female}`): KinshipTerm {
  return sex === 'male'
    ? term(male, 'm')
    : sex === 'female'
      ? term(female, 'f')
      : term(neutral, 'm')
}
const after = (t: KinshipTerm, text: string): KinshipTerm => term(`${t.term} ${text}`, t.gender)
/** "de" with the article: du père, de la mère, de l’oncle. */
const of = (t: KinshipTerm): string =>
  elides(t.term) ? `de l’${t.term}` : t.gender === 'f' ? `de la ${t.term}` : `du ${t.term}`
const arr = (n: number): string => 'arrière-'.repeat(Math.max(0, n))
/** The partner of `a` (or of `b`'s relative), as "du conjoint" / "de la conjointe". */
const ofPartner = (sex: Sex): string => (sex === 'female' ? 'de la conjointe' : 'du conjoint')
const partnerWord = (sex: Sex): string => (sex === 'female' ? 'conjointe' : 'conjoint')

function ancestor(sex: Sex, up: number): KinshipTerm {
  if (up === 1) return w(sex, 'père', 'mère', 'parent')
  if (up <= 5) {
    const p = arr(up - 2)
    return w(sex, `${p}grand-père`, `${p}grand-mère`, `${p}grand-parent`)
  }
  // Direct line: the civil-law degree is the number of generations.
  return w(
    sex,
    `ascendant au ${up}e degré`,
    `ascendante au ${up}e degré`,
    `ascendant au ${up}e degré`
  )
}

function descendant(sex: Sex, down: number): KinshipTerm {
  if (down === 1) return w(sex, 'fils', 'fille', 'enfant')
  if (down <= 5) {
    const p = arr(down - 2)
    return w(sex, `${p}petit-fils`, `${p}petite-fille`, `${p}petit-enfant`)
  }
  return w(
    sex,
    `descendant au ${down}e degré`,
    `descendante au ${down}e degré`,
    `descendant au ${down}e degré`
  )
}

/**
 * Step-parent: "beau-père" is also the father-in-law, so the step sense says whose partner it is
 * ("belle-mère (conjointe du père)"); in-law parents say "(père du conjoint)".
 */
function stepAncestor(sex: Sex, up: number, side: Side | undefined): KinshipTerm {
  if (up === 1) {
    const whose =
      side === 'paternal' ? 'du père' : side === 'maternal' ? 'de la mère' : 'd’un parent'
    return after(w(sex, 'beau-père', 'belle-mère', 'beau-parent'), `(${partnerWord(sex)} ${whose})`)
  }
  if (up === 2) return w(sex, 'beau-grand-père', 'belle-grand-mère', 'beau-grand-parent')
  return after(ancestor(sex, up), 'par alliance')
}

/** Stepchild: "belle-fille" is also the daughter-in-law, hence "(fille du conjoint)". */
function stepDescendant(sex: Sex, down: number): KinshipTerm {
  if (down === 1) {
    return w(
      sex,
      'beau-fils (fils du conjoint)',
      'belle-fille (fille du conjoint)',
      'beau-fils ou belle-fille (enfant du conjoint)'
    )
  }
  if (down === 2) return w(sex, 'beau-petit-fils', 'belle-petite-fille', 'beau-petit-enfant')
  return after(descendant(sex, down), 'par alliance')
}

const stepSibling = (sex: Sex): KinshipTerm => w(sex, 'quasi-frère', 'quasi-sœur')

/** "une génération au-dessus" / "2 générations en dessous". */
function removedText(removed: number, older: boolean): string {
  const n = removed === 1 ? 'une génération' : `${removed} générations`
  return `(${n} ${older ? 'au-dessus' : 'en dessous'})`
}

function cousin(sex: Sex, degree: number, half: string): KinshipTerm {
  if (degree === 1) return w(sex, `${half}cousin germain`, `${half}cousine germaine`)
  if (degree === 2)
    return w(sex, `${half}cousin issu de germain`, `${half}cousine issue de germain`)
  if (degree === 3) {
    return w(sex, `${half}cousin issu d’issu de germain`, `${half}cousine issue d’issu de germain`)
  }
  return w(sex, `${half}cousin au ${degree}e degré`, `${half}cousine au ${degree}e degré`)
}

function collateral(k: BloodKinship): KinshipTerm {
  const { up, down, sexB } = k
  const half = k.half ? 'demi-' : ''
  if (up === 1 && down === 1) return w(sexB, `${half}frère`, `${half}sœur`)
  if (up === 1) {
    const p = down === 2 ? '' : arr(down - 3)
    const small = down === 2 ? ['', ''] : ['petit-', 'petite-']
    return w(sexB, `${half}${p}${small[0]}neveu`, `${half}${p}${small[1]}nièce`)
  }
  if (down === 1) {
    const p = up === 2 ? '' : `${arr(up - 3)}grand-`
    return w(sexB, `${half}${p}oncle`, `${half}${p}tante`)
  }
  const degree = Math.min(up, down) - 1
  const removed = Math.abs(up - down)
  // The first cousin of a parent and the child of a first cousin (Académie française).
  if (degree === 1 && removed === 1) {
    return up > down
      ? w(sexB, `${half}oncle à la mode de Bretagne`, `${half}tante à la mode de Bretagne`)
      : w(sexB, `${half}neveu à la mode de Bretagne`, `${half}nièce à la mode de Bretagne`)
  }
  const t = cousin(sexB, degree, half)
  return removed > 0 ? after(t, removedText(removed, up > down)) : t
}

function blood(k: BloodKinship): KinshipTerm | null {
  if (tooDistant(k)) return null
  const { up, down, sexB, lineage } = k
  if (lineage === 'step') {
    if (down === 0) return stepAncestor(sexB, up, undefined)
    if (up === 0) return stepDescendant(sexB, down)
    if (up === 1 && down === 1) return stepSibling(sexB)
    return after(collateral(k), 'par alliance')
  }
  const t = down === 0 ? ancestor(sexB, up) : up === 0 ? descendant(sexB, down) : collateral(k)
  if (lineage === 'adoptive') return after(t, t.gender === 'f' ? 'adoptive' : 'adoptif')
  if (lineage === 'foster') return after(t, 'd’accueil')
  return t
}

function partner(k: Extract<Kinship, { kind: 'partner' }>): KinshipTerm {
  const { sexB, ended } = k
  if (k.partnership === 'marriage') {
    return ended
      ? w(sexB, 'ex-mari', 'ex-épouse', 'ex-conjoint')
      : w(sexB, 'mari', 'épouse', 'conjoint')
  }
  const [male, female, neutral] =
    k.partnership === 'engagement'
      ? ['fiancé', 'fiancée', 'fiancé(e)']
      : k.partnership === 'partnership'
        ? ['compagnon', 'compagne', 'compagnon ou compagne']
        : ['partenaire', 'partenaire', 'partenaire']
  if (!ended) return w(sexB, male, female, neutral)
  return w(sexB, `ancien ${male}`, `ancienne ${female}`, `ancien ${neutral}`)
}

function name(k: Kinship): KinshipTerm | null {
  switch (k.kind) {
    case 'self':
      return term('la même personne', 'f')
    case 'direct':
    case 'collateral':
      return blood(k)
    case 'partner':
      return partner(k)
    case 'step':
      if (tooDistant(k)) return null
      if (k.up === 1 && k.down === 1) return stepSibling(k.sexB)
      if (k.down === 0) return stepAncestor(k.sexB, k.up, k.side)
      if (k.up === 0) return stepDescendant(k.sexB, k.down)
      return null
    case 'in-law': {
      if (tooDistant(k)) return null
      const { up, down, sexB, partnerSex } = k
      // The partner of the partner's sibling: called beau-frère / belle-sœur in everyday French.
      if (k.via === 'both' || (up === 1 && down === 1)) return w(sexB, 'beau-frère', 'belle-sœur')
      if (k.via === 'partner-of-a') {
        if (up === 1 && down === 0) {
          const whose = ofPartner(partnerSex)
          return w(
            sexB,
            `beau-père (père ${whose})`,
            `belle-mère (mère ${whose})`,
            `beau-parent (parent ${whose})`
          )
        }
        const relative = blood(innerBlood(k, sexB))
        return relative && after(relative, ofPartner(partnerSex))
      }
      if (up === 0 && down === 1) {
        const child =
          partnerSex === 'male'
            ? 'du fils'
            : partnerSex === 'female'
              ? 'de la fille'
              : 'de l’enfant'
        return w(sexB, 'gendre', `belle-fille (conjointe ${child})`, 'gendre ou belle-fille')
      }
      const relative = blood(innerBlood(k, partnerSex))
      return relative && term(`${partnerWord(sexB)} ${of(relative)}`, sexB === 'female' ? 'f' : 'm')
    }
  }
}

const ARTICLE: Record<G, string> = { m: 'le ', f: 'la ', n: 'le ' }

export const french: KinshipLanguage = {
  name: (k) => name(k),
  // "Anna est la tante de Maria", "Marc est l’oncle d’Anna": the names are not inflected.
  phrase: (a, t) =>
    `${elides(t.term) ? 'l’' : ARTICLE[t.gender]}${t.term} ${elides(a) ? 'd’' : 'de '}${a}`,
  sentence: (a, b, t) => `${b} est ${french.phrase(a, t)}.`,
  distant: (a, b, k, ancestors) => {
    const gen = (n: number): string => counted('fr', n, { one: 'génération', other: 'générations' })
    const from = (name: string): string => (elides(name) ? `d’${name}` : `de ${name}`)
    if (k.down === 0) return `${a} descend en ligne directe ${from(b)} (${gen(k.up)} plus haut).`
    if (k.up === 0) return `${b} descend en ligne directe ${from(a)} (${gen(k.down)} plus bas).`
    const related = bothFemale(k) ? 'apparentées' : 'apparentés'
    return `${b} et ${a} sont ${related} par leur ascendance commune : ${listOf('fr', ancestors)} (${gen(k.up)} au-dessus et ${k.down} au-dessous).`
  },
  byMarriage: (a, b, k) => `${b} et ${a} sont ${bothFemale(k) ? 'alliées' : 'alliés'} par mariage.`
}
