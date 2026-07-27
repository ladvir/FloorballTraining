// MVP ships Czech only (spec section 20 defers sk/en to a later stage). Routing every
// user-facing string through `t()` now means adding a locale later is additive - a new
// `Record<StringKey, string>` plus a way to pick `currentLocale` - not a rewrite of every screen.
export type StringKey =
  | 'common.appName'
  | 'auth.loginEmailPlaceholder'
  | 'auth.loginPasswordPlaceholder'
  | 'auth.togglePasswordVisibility'
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
  | 'recommendations.title'
  | 'recommendations.empty'
  | 'roster.back'
  | 'roster.previous'
  | 'roster.next'
  | 'roster.cardLoadError'
  | 'skillDetail.focusToggle'
  | 'skillDetail.focusActive'
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
  | 'skillDetail.editGrade'
  | 'skillDetail.setGradeFirst'
  | 'skillDetail.saveError'
  | 'skillDetail.saveForbidden'
  | 'common.cancel'
  | 'stats.title'
  | 'stats.bestSkills'
  | 'stats.skillsToImprove'
  | 'stats.empty'
  | 'onboarding.slide1Title'
  | 'onboarding.slide1Body'
  | 'onboarding.slide2Title'
  | 'onboarding.slide2Body'
  | 'onboarding.slide3Title'
  | 'onboarding.slide3Body'
  | 'onboarding.start'
  | 'onboarding.skip'
  | 'grade.1'
  | 'grade.2'
  | 'grade.3'
  | 'grade.4'
  | 'grade.5'
  | 'xp.level'
  | 'xp.toNextLevel'
  | 'xp.seasonForm'
  | 'xp.rank0'
  | 'xp.rank1'
  | 'xp.rank2'
  | 'xp.rank3'
  | 'xp.rank4'
  | 'xp.rank5'
  | 'xp.rank6'

const cs: Record<StringKey, string> = {
  'common.appName': 'Flotr - Player',
  'auth.loginEmailPlaceholder': 'E-mail',
  'auth.loginPasswordPlaceholder': 'Heslo',
  'auth.togglePasswordVisibility': 'Zobrazit/skrýt heslo',
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
  'recommendations.title': 'Doporučení pro rozvoj',
  'recommendations.empty': 'Zatím žádná doporučení od trenéra.',
  'roster.back': 'Zpět',
  'roster.previous': 'Předchozí',
  'roster.next': 'Další',
  'roster.cardLoadError': 'Nepodařilo se načíst kartičku hráče.',
  'skillDetail.focusToggle': 'Doporučit k rozvoji',
  'skillDetail.focusActive': 'Doporučeno k rozvoji',
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
  'skillDetail.editGrade': 'Zvolit známku',
  'skillDetail.setGradeFirst': 'Nejprve nastavte známku klepnutím na odznak výše.',
  'skillDetail.saveError': 'Uložení se nezdařilo. Zkuste to prosím znovu.',
  'skillDetail.saveForbidden': 'K úpravě tohoto hráče nemáte oprávnění.',
  'common.cancel': 'Zrušit',
  'stats.title': 'Statistiky',
  'stats.bestSkills': 'Nejlepší dovednosti',
  'stats.skillsToImprove': 'K rozvoji',
  'stats.empty': 'Zatím žádné hodnocení dovedností.',
  'onboarding.slide1Title': 'Sleduj svůj rozvoj',
  'onboarding.slide1Body': 'Detailní přehled tvého progresu, tréninků a výkonů na jednom místě.',
  'onboarding.slide2Title': 'Statistiky a grafy',
  'onboarding.slide2Body': 'Vizualizuj své silné a slabé stránky prostřednictvím přehledných grafů.',
  'onboarding.slide3Title': 'Trenér tě hodnotí',
  'onboarding.slide3Body': 'Dostávej zpětnou vazbu a úkoly od svého trenéra přímo v aplikaci.',
  'onboarding.start': 'Začít',
  'onboarding.skip': 'Přeskočit',
  'grade.1': 'Výborná úroveň',
  'grade.2': 'Velmi dobrá úroveň',
  'grade.3': 'Dobrá úroveň',
  'grade.4': 'Slabší úroveň',
  'grade.5': 'Nedostatečná úroveň',
  // Rank names mirror XpProgression.Ranks server-side; localized here so the card's rank label
  // stays in the i18n layer (routed by CareerXpDto.rankIndex) rather than showing raw server text.
  'xp.level': 'Level {level}',
  'xp.toNextLevel': 'Do dalšího levelu zbývá {xp} XP',
  'xp.seasonForm': 'Sezónní forma',
  'xp.rank0': 'Nováček',
  'xp.rank1': 'Hráč',
  'xp.rank2': 'Stálice',
  'xp.rank3': 'Opora',
  'xp.rank4': 'Lídr',
  'xp.rank5': 'Kapitán',
  'xp.rank6': 'Legenda',
}

const locales = { cs }
const currentLocale: keyof typeof locales = 'cs'

export const t = (key: StringKey, params?: Record<string, string>): string => {
  const template = locales[currentLocale][key]
  if (!params) return template
  return Object.entries(params).reduce((str, [name, value]) => str.replace(`{${name}}`, value), template)
}

/** Verbal label for a grade 1-5 (spec section 9). Lived in theme/tokens as hardcoded Czech
 * until Etapa 12's "no text outside the i18n layer" pass moved it here. */
export const gradeLabel = (grade: 1 | 2 | 3 | 4 | 5): string => t(`grade.${grade}`)
