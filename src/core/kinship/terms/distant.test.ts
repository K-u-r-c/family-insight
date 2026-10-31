import { describe, expect, it } from 'vitest'
import type { BloodKinship } from '../kinship'
import { kinshipLanguage } from './index'

const base: BloodKinship = {
  kind: 'collateral',
  up: 13,
  down: 11,
  half: false,
  commonAncestors: [],
  lineage: 'biological',
  path: [],
  sexA: 'female',
  sexB: 'male'
}

/** Per language: two collateral, an ancestor, a descendant and a by-marriage sentence. */
const EXPECTED: Record<string, string[]> = {
  en: [
    'Jan and Anna are related through the common ancestors Jan Kowalski and Maria Nowak, 13 generations up and 11 down.',
    'Ewa and Anna are related through the common ancestor Olga, 2 generations up and 21 down.',
    'Jan is an ancestor of Anna, 13 generations back.',
    'Jan is a descendant of Anna, 1 generation later.',
    'Ewa and Anna are related by marriage.'
  ],
  pl: [
    'Jan i Anna są spokrewnieni przez wspólnych przodków: Jan Kowalski i Maria Nowak (13 pokoleń w górę i 11 w dół).',
    'Ewa i Anna są spokrewnione przez wspólnego przodka: Olga (2 pokolenia w górę i 21 w dół).',
    'Anna pochodzi w prostej linii od: Jan (13 pokoleń wstecz).',
    'Jan pochodzi w prostej linii od: Anna (pokolenie dalej).',
    'Ewa i Anna są spowinowacone.'
  ],
  de: [
    'Jan und Anna sind über die gemeinsame Abstammung von Jan Kowalski und Maria Nowak verwandt (13 Generationen hinauf und 11 hinab).',
    'Ewa und Anna sind über die gemeinsame Abstammung von Olga verwandt (2 Generationen hinauf und 21 hinab).',
    'Anna stammt in gerader Linie von Jan ab (13 Generationen zurück).',
    'Jan stammt in gerader Linie von Anna ab (1 Generation später).',
    'Ewa und Anna sind verschwägert.'
  ],
  fr: [
    'Jan et Anna sont apparentés par leur ascendance commune : Jan Kowalski et Maria Nowak (13 générations au-dessus et 11 au-dessous).',
    'Ewa et Anna sont apparentées par leur ascendance commune : Olga (2 générations au-dessus et 21 au-dessous).',
    'Anna descend en ligne directe de Jan (13 générations plus haut).',
    'Jan descend en ligne directe d’Anna (1 génération plus bas).',
    'Ewa et Anna sont alliées par mariage.'
  ],
  es: [
    'Jan y Anna están emparentados por ascendencia común (Jan Kowalski y Maria Nowak): 13 generaciones hacia arriba y 11 hacia abajo.',
    'Ewa y Anna están emparentadas por ascendencia común (Olga): 2 generaciones hacia arriba y 21 hacia abajo.',
    'Anna desciende en línea directa de Jan (13 generaciones atrás).',
    'Jan desciende en línea directa de Anna (1 generación después).',
    'Ewa y Anna son parientes políticas.'
  ],
  it: [
    'Jan e Anna sono imparentati per discendenza comune (Jan Kowalski e Maria Nowak): 13 generazioni verso l’alto e 11 verso il basso.',
    'Ewa e Anna sono imparentate per discendenza comune (Olga): 2 generazioni verso l’alto e 21 verso il basso.',
    'Anna discende in linea retta da Jan (13 generazioni prima).',
    'Jan discende in linea retta da Anna (1 generazione dopo).',
    'Ewa e Anna sono parenti acquisite.'
  ],
  pt: [
    'Jan e Anna são parentes por ascendência comum (Jan Kowalski e Maria Nowak): 13 gerações acima e 11 abaixo.',
    'Ewa e Anna são parentes por ascendência comum (Olga): 2 gerações acima e 21 abaixo.',
    'Anna descende em linha reta de Jan (13 gerações acima).',
    'Jan descende em linha reta de Anna (1 geração abaixo).',
    'Ewa e Anna são parentes por afinidade.'
  ],
  ru: [
    'Jan и Anna — родственники через общих предков: Jan Kowalski и Maria Nowak (13 поколений вверх и 11 вниз).',
    'Ewa и Anna — родственницы через общего предка: Olga (2 поколения вверх и 21 вниз).',
    'Jan — предок по прямой линии (для: Anna), 13 поколений назад.',
    'Jan — потомок по прямой линии (для: Anna), через 1 поколение.',
    'Ewa и Anna — свойственницы.'
  ]
}

describe('sentences without a relationship name', () => {
  it.each(Object.entries(EXPECTED))('%s', (language, expected) => {
    const k = kinshipLanguage(language)
    expect([
      k.distant('Anna', 'Jan', base, ['Jan Kowalski', 'Maria Nowak']),
      k.distant('Anna', 'Ewa', { ...base, sexB: 'female', up: 2, down: 21 }, ['Olga']),
      k.distant('Anna', 'Jan', { ...base, kind: 'direct', up: 13, down: 0 }, []),
      k.distant('Anna', 'Jan', { ...base, kind: 'direct', up: 0, down: 1 }, []),
      k.byMarriage('Anna', 'Ewa', { ...base, sexB: 'female' })
    ]).toEqual(expected)
  })
})
