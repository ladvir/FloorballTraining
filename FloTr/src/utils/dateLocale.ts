import { setDefaultOptions } from 'date-fns'
import { cs, enUS, sk, pl, de, type Locale } from 'date-fns/locale'
import i18n from '../i18n'

const LOCALES: Record<string, Locale> = { cs, en: enUS, sk, pl, de }

/** date-fns Locale matching the active UI language (falls back to Czech). */
export function dfLocale(): Locale {
  const code = Object.keys(LOCALES).find((l) => i18n.language?.startsWith(l)) ?? 'cs'
  return LOCALES[code]
}

// Keep date-fns' global default locale in sync with the active language, so any
// format()/formatDistance() call without an explicit locale is also localised.
function sync() {
  setDefaultOptions({ locale: dfLocale() })
}
sync()
i18n.on('languageChanged', sync)
