// MVP ships Czech only (spec section 20 defers sk/en to a later stage). Routing every
// user-facing string through `t()` now means adding a locale later is additive - a new
// `Record<StringKey, string>` plus a way to pick `currentLocale` - not a rewrite of every screen.
export type StringKey =
  | 'auth.loginEmailPlaceholder'
  | 'auth.loginPasswordPlaceholder'
  | 'auth.loginSubmit'
  | 'auth.loginError'
  | 'auth.sessionExpired'
  | 'auth.logout'
  | 'nav.home'
  | 'nav.roster'
  | 'nav.skills'
  | 'nav.stats'
  | 'nav.profile'
  | 'position.fieldPlayer'
  | 'position.goalkeeper'
  | 'position.both'
  | 'common.retry'
  | 'playerCard.averageGrade'
  | 'playerCard.lastRated'
  | 'playerCard.neverRated'
  | 'playerCard.loadError'
  | 'playerCard.notFound'
  | 'roster.title'
  | 'roster.searchPlaceholder'
  | 'roster.filterTeam'
  | 'roster.filterYear'
  | 'roster.filterPosition'
  | 'roster.filterAll'
  | 'roster.clearFilters'
  | 'roster.empty'
  | 'roster.noResults'
  | 'roster.loadError'
  | 'profile.accountTypePlayer'
  | 'profile.accountTypeCoach'
  | 'skills.comingSoon'
  | 'stats.comingSoon'

const cs: Record<StringKey, string> = {
  'auth.loginEmailPlaceholder': 'E-mail',
  'auth.loginPasswordPlaceholder': 'Heslo',
  'auth.loginSubmit': 'Přihlásit se',
  'auth.loginError': 'Přihlášení se nezdařilo. Zkontrolujte e-mail a heslo.',
  'auth.logout': 'Odhlásit se',
  'auth.sessionExpired': 'Vaše přihlášení vypršelo. Přihlaste se prosím znovu.',
  'nav.home': 'Domů',
  'nav.roster': 'Hráči',
  'nav.skills': 'Dovednosti',
  'nav.stats': 'Statistiky',
  'nav.profile': 'Profil',
  'position.fieldPlayer': 'Hráč v poli',
  'position.goalkeeper': 'Brankář',
  'position.both': 'Hráč v poli i brankář',
  'common.retry': 'Zkusit znovu',
  'playerCard.averageGrade': 'Celkové hodnocení',
  'playerCard.lastRated': 'Naposledy hodnoceno {date}',
  'playerCard.neverRated': 'Zatím nehodnoceno',
  'playerCard.loadError': 'Nepodařilo se načíst hráčskou kartičku.',
  'playerCard.notFound': 'K vašemu účtu není přiřazen žádný hráčský profil.',
  'roster.title': 'Hráči',
  'roster.searchPlaceholder': 'Hledat hráče',
  'roster.filterTeam': 'Tým',
  'roster.filterYear': 'Ročník',
  'roster.filterPosition': 'Pozice',
  'roster.filterAll': 'Vše',
  'roster.clearFilters': 'Zrušit filtry',
  'roster.empty': 'Žádní hráči k zobrazení.',
  'roster.noResults': 'Žádný hráč neodpovídá filtru.',
  'roster.loadError': 'Nepodařilo se načíst seznam hráčů.',
  'profile.accountTypePlayer': 'Hráč',
  'profile.accountTypeCoach': 'Trenér',
  'skills.comingSoon': 'Dovednosti budou dostupné v příští verzi.',
  'stats.comingSoon': 'Statistiky budou dostupné v příští verzi.',
}

const locales = { cs }
const currentLocale: keyof typeof locales = 'cs'

export const t = (key: StringKey, params?: Record<string, string>): string => {
  const template = locales[currentLocale][key]
  if (!params) return template
  return Object.entries(params).reduce((str, [name, value]) => str.replace(`{${name}}`, value), template)
}
