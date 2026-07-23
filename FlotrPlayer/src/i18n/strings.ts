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
  | 'roster.filterRole'
  | 'roster.filterAll'
  | 'roster.clearFilters'
  | 'roster.empty'
  | 'roster.noResults'
  | 'roster.loadError'
  | 'roster.browseMode'
  | 'roster.browseModeBanner'
  | 'roster.back'
  | 'roster.previous'
  | 'roster.next'
  | 'roster.cardLoadError'
  | 'role.player'
  | 'role.playerCoach'
  | 'profile.accountTypePlayer'
  | 'profile.accountTypeCoach'
  | 'skills.title'
  | 'skills.searchPlaceholder'
  | 'skills.filterAll'
  | 'skills.filterWeakest'
  | 'skills.filterStrongest'
  | 'skills.filterCategory'
  | 'skills.empty'
  | 'skills.noResults'
  | 'skills.noRecommendation'
  | 'skillDetail.recommendation'
  | 'skillDetail.targetGrade'
  | 'skillDetail.lastRated'
  | 'skillDetail.historyTitle'
  | 'skillDetail.historyEmpty'
  | 'skillDetail.loadError'
  | 'stats.title'
  | 'stats.bestSkills'
  | 'stats.skillsToImprove'
  | 'stats.empty'

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
  'roster.filterRole': 'Role',
  'roster.filterAll': 'Vše',
  'roster.clearFilters': 'Zrušit filtry',
  'roster.empty': 'Žádní hráči k zobrazení.',
  'roster.noResults': 'Žádný hráč neodpovídá filtru.',
  'roster.loadError': 'Nepodařilo se načíst seznam hráčů.',
  'roster.browseMode': 'Režim prohlížení',
  'roster.browseModeBanner': 'Režim prohlížení',
  'roster.back': 'Zpět',
  'roster.previous': 'Předchozí',
  'roster.next': 'Další',
  'roster.cardLoadError': 'Nepodařilo se načíst kartičku hráče.',
  'role.player': 'Hráč',
  'role.playerCoach': 'Hráč, trenér',
  'profile.accountTypePlayer': 'Hráč',
  'profile.accountTypeCoach': 'Trenér',
  'skills.title': 'Dovednosti',
  'skills.searchPlaceholder': 'Hledat dovednost',
  'skills.filterAll': 'Vše',
  'skills.filterWeakest': 'Nejslabší',
  'skills.filterStrongest': 'Nejsilnější',
  'skills.filterCategory': 'Kategorie',
  'skills.empty': 'Žádné dovednosti k zobrazení.',
  'skills.noResults': 'Žádná dovednost neodpovídá filtru.',
  'skills.noRecommendation': 'Bez doporučení',
  'skillDetail.recommendation': 'Doporučení trenéra',
  'skillDetail.targetGrade': 'Cílová známka',
  'skillDetail.lastRated': 'Naposledy hodnoceno',
  'skillDetail.historyTitle': 'Vývoj známky',
  'skillDetail.historyEmpty': 'Zatím žádná historie hodnocení.',
  'skillDetail.loadError': 'Nepodařilo se načíst historii dovednosti.',
  'stats.title': 'Statistiky',
  'stats.bestSkills': 'Nejlepší dovednosti',
  'stats.skillsToImprove': 'K rozvoji',
  'stats.empty': 'Zatím žádné hodnocení dovedností.',
}

const locales = { cs }
const currentLocale: keyof typeof locales = 'cs'

export const t = (key: StringKey, params?: Record<string, string>): string => {
  const template = locales[currentLocale][key]
  if (!params) return template
  return Object.entries(params).reduce((str, [name, value]) => str.replace(`{${name}}`, value), template)
}
