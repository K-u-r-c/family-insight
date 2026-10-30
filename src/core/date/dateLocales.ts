import type { DateQualifier } from '../model/types'

/**
 * Date words of each language: month names (every grammatical form the parser should accept,
 * the first list being the one dates are written with), qualifier phrases and how a date is
 * written. Adding a language: add an entry here and to `DATE_LANGUAGES`.
 */

export const DATE_LANGUAGES = ['en', 'pl', 'de', 'fr', 'es', 'it', 'pt', 'ru'] as const
export type DateLanguage = (typeof DATE_LANGUAGES)[number]

/** How a date is shown: the parts are numbers and month names, `q` the qualifier phrase. */
interface Written {
  year: number
  month?: number
  day?: number
  qualifier: DateQualifier
}

type Months = { day: string[]; month: string[] } & Record<string, string[]>

export interface DateLocale {
  /**
   * Month names by grammatical form: `day` as written in day dates ("12 marca"), `month` for a
   * month on its own ("marzec 1890"), and any further forms other phrases need. Input accepts
   * every form, any unambiguous prefix of at least three letters and `aliases`.
   */
  months: Months
  aliases?: Record<string, number>
  /** Qualifier phrases accepted on input (in addition to every other language's). */
  qualifiers: Record<Exclude<DateQualifier, 'exact'>, string[]>
  /** Order of numeric input: `DD.MM.YYYY` or `DD/MM/YYYY`; `null` = ISO (`YYYY-MM-DD`). */
  numeric: '.' | '/' | null
  write: (date: Written, months: Months) => string
}

const split = (names: string): string[] => names.split(' ')

export const DATE_LOCALES: Record<DateLanguage, DateLocale> = {
  en: {
    months: {
      day: split(
        'January February March April May June July August September October November December'
      ),
      month: split(
        'January February March April May June July August September October November December'
      )
    },
    qualifiers: {
      about: ['about', 'abt.', 'abt', 'circa', 'ca.', 'c.', 'approx.', 'around'],
      before: ['before', 'bef.', 'bef'],
      after: ['after', 'aft.', 'aft']
    },
    numeric: null,
    write: ({ year, month, day, qualifier }, months) => {
      const q = { exact: '', about: 'about ', before: 'before ', after: 'after ' }[qualifier]
      if (month === undefined) return `${q}${year}`
      if (day === undefined) return `${q}${months.month[month - 1]} ${year}`
      return `${q}${day} ${months.day[month - 1]} ${year}`
    }
  },
  pl: {
    // Polish months change with the preposition: "ok. maja", "przed majem", "po maju".
    months: {
      day: split(
        'stycznia lutego marca kwietnia maja czerwca lipca sierpnia września października listopada grudnia'
      ),
      month: split(
        'styczeń luty marzec kwiecień maj czerwiec lipiec sierpień wrzesień październik listopad grudzień'
      ),
      // "przed majem" (instrumental), "po maju" (locative)
      before: split(
        'styczniem lutym marcem kwietniem majem czerwcem lipcem sierpniem wrześniem październikiem listopadem grudniem'
      ),
      after: split(
        'styczniu lutym marcu kwietniu maju czerwcu lipcu sierpniu wrześniu październiku listopadzie grudniu'
      )
    },
    qualifiers: {
      about: ['około', 'ok.', 'ok', 'koło'],
      before: ['przed'],
      after: ['po']
    },
    numeric: '.',
    write: ({ year, month, day, qualifier }, months) => {
      const q = { exact: '', about: 'ok. ', before: 'przed ', after: 'po ' }[qualifier]
      if (month === undefined) return `${q}${year}`
      if (day !== undefined) return `${q}${day} ${months.day[month - 1]} ${year}`
      const form = { exact: 'month', about: 'day', before: 'before', after: 'after' }[qualifier]
      return `${q}${months[form]![month - 1]} ${year}`
    }
  },
  de: {
    months: {
      day: split(
        'Januar Februar März April Mai Juni Juli August September Oktober November Dezember'
      ),
      month: split(
        'Januar Februar März April Mai Juni Juli August September Oktober November Dezember'
      )
    },
    aliases: { jänner: 1, feber: 2 },
    qualifiers: {
      about: ['um', 'ca.', 'ca', 'circa', 'etwa', 'gegen'],
      before: ['vor dem', 'vor'],
      after: ['nach dem', 'nach']
    },
    numeric: '.',
    write: ({ year, month, day, qualifier }, months) => {
      if (month === undefined) {
        return `${{ exact: '', about: 'um ', before: 'vor ', after: 'nach ' }[qualifier]}${year}`
      }
      if (day === undefined) {
        const q = { exact: '', about: 'ca. ', before: 'vor ', after: 'nach ' }[qualifier]
        return `${q}${months.month[month - 1]} ${year}`
      }
      const q = { exact: '', about: 'ca. ', before: 'vor dem ', after: 'nach dem ' }[qualifier]
      return `${q}${day}. ${months.day[month - 1]} ${year}`
    }
  },
  fr: {
    months: {
      day: split(
        'janvier février mars avril mai juin juillet août septembre octobre novembre décembre'
      ),
      month: split(
        'janvier février mars avril mai juin juillet août septembre octobre novembre décembre'
      )
    },
    qualifiers: {
      about: ['vers le', 'vers', 'environ', 'env.', 'env', 'circa', 'ca.'],
      before: ['avant le', 'avant'],
      after: ['après le', 'après', 'apres le', 'apres']
    },
    numeric: '/',
    write: ({ year, month, day, qualifier }, months) => {
      if (day === undefined || month === undefined) {
        const q = { exact: '', about: 'vers ', before: 'avant ', after: 'après ' }[qualifier]
        return month === undefined ? `${q}${year}` : `${q}${months.month[month - 1]} ${year}`
      }
      const q = { exact: '', about: 'vers le ', before: 'avant le ', after: 'après le ' }[qualifier]
      return `${q}${day === 1 ? '1er' : day} ${months.day[month - 1]} ${year}`
    }
  },
  es: {
    months: {
      day: split(
        'enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre'
      ),
      month: split(
        'enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre'
      )
    },
    aliases: { setiembre: 9 },
    qualifiers: {
      about: ['hacia el', 'hacia', 'cerca de', 'alrededor de', 'circa', 'ca.', 'h.'],
      before: ['antes del', 'antes de'],
      after: ['después del', 'después de', 'despues del', 'despues de']
    },
    numeric: '/',
    write: ({ year, month, day, qualifier }, months) => {
      if (day === undefined || month === undefined) {
        const q = { exact: '', about: 'hacia ', before: 'antes de ', after: 'después de ' }[
          qualifier
        ]
        return month === undefined ? `${q}${year}` : `${q}${months.month[month - 1]} de ${year}`
      }
      const q = { exact: '', about: 'hacia el ', before: 'antes del ', after: 'después del ' }[
        qualifier
      ]
      return `${q}${day} de ${months.day[month - 1]} de ${year}`
    }
  },
  it: {
    months: {
      day: split(
        'gennaio febbraio marzo aprile maggio giugno luglio agosto settembre ottobre novembre dicembre'
      ),
      month: split(
        'gennaio febbraio marzo aprile maggio giugno luglio agosto settembre ottobre novembre dicembre'
      )
    },
    qualifiers: {
      about: ['circa il', 'circa', 'verso il', 'verso', 'intorno al', 'intorno a', 'ca.'],
      before: ['prima del', 'prima di', 'prima'],
      after: ['dopo il', 'dopo']
    },
    numeric: '/',
    write: ({ year, month, day, qualifier }, months) => {
      if (month !== undefined && day === undefined) {
        const q = { exact: '', about: 'circa ', before: 'prima di ', after: 'dopo ' }[qualifier]
        return `${q}${months.month[month - 1]} ${year}`
      }
      const q = { exact: '', about: 'circa ', before: 'prima del ', after: 'dopo il ' }[qualifier]
      if (month === undefined) return `${q}${year}`
      return `${q}${day === 1 ? '1º' : day} ${months.day[month - 1]} ${year}`
    }
  },
  pt: {
    months: {
      day: split(
        'janeiro fevereiro março abril maio junho julho agosto setembro outubro novembro dezembro'
      ),
      month: split(
        'janeiro fevereiro março abril maio junho julho agosto setembro outubro novembro dezembro'
      )
    },
    qualifiers: {
      about: ['por volta de', 'cerca de', 'circa', 'c.', 'ca.'],
      before: ['antes de'],
      after: ['depois de', 'após']
    },
    numeric: '/',
    write: ({ year, month, day, qualifier }, months) => {
      const q = { exact: '', about: 'por volta de ', before: 'antes de ', after: 'depois de ' }[
        qualifier
      ]
      if (month === undefined) return `${q}${year}`
      if (day === undefined) return `${q}${months.month[month - 1]} de ${year}`
      return `${q}${day} de ${months.day[month - 1]} de ${year}`
    }
  },
  ru: {
    // Day dates and qualified months take the genitive ("12 марта", "около марта 1900").
    months: {
      day: split(
        'января февраля марта апреля мая июня июля августа сентября октября ноября декабря'
      ),
      month: split(
        'январь февраль март апрель май июнь июль август сентябрь октябрь ноябрь декабрь'
      ),
      // "в марте 1900"
      in: split('январе феврале марте апреле мае июне июле августе сентябре октябре ноябре декабре')
    },
    qualifiers: {
      about: ['около', 'ок.', 'примерно', 'приблизительно', 'ок'],
      before: ['до'],
      after: ['после']
    },
    numeric: '.',
    write: ({ year, month, day, qualifier }, months) => {
      const q = { exact: '', about: 'около ', before: 'до ', after: 'после ' }[qualifier]
      if (month === undefined) return `${q}${year}`
      if (day !== undefined) return `${q}${day} ${months.day[month - 1]} ${year}`
      return `${q}${(qualifier === 'exact' ? months.month : months.day)[month - 1]} ${year}`
    }
  }
}
