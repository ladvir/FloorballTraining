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
  | 'nav.children'
  | 'nav.fan'
  | 'fan.title'
  | 'fan.empty'
  | 'fan.loadError'
  | 'fan.checkIn'
  | 'fan.checkedIn'
  | 'fan.checkInError'
  | 'fan.familyXp'
  | 'fan.streak'
  | 'fan.matchFallback'
  | 'children.title'
  | 'children.empty'
  | 'children.loadError'
  | 'children.clubRank'
  | 'profile.accountTypeGuardian'
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
  | 'xp.total'
  | 'xp.toNextLevel'
  | 'xp.seasonForm'
  | 'xp.rank0'
  | 'xp.rank1'
  | 'xp.rank2'
  | 'xp.rank3'
  | 'xp.rank4'
  | 'xp.rank5'
  | 'xp.rank6'
  | 'badge.section'
  | 'badge.Attendance10.name'
  | 'badge.Attendance10.desc'
  | 'badge.Attendance25.name'
  | 'badge.Attendance25.desc'
  | 'badge.Attendance50.name'
  | 'badge.Attendance50.desc'
  | 'badge.Attendance100.name'
  | 'badge.Attendance100.desc'
  | 'badge.FirstGoal.name'
  | 'badge.FirstGoal.desc'
  | 'badge.Goals10.name'
  | 'badge.Goals10.desc'
  | 'badge.Goals50.name'
  | 'badge.Goals50.desc'
  | 'badge.Hattrick.name'
  | 'badge.Hattrick.desc'
  | 'badge.Assists10.name'
  | 'badge.Assists10.desc'
  | 'badge.Assists25.name'
  | 'badge.Assists25.desc'
  | 'badge.IronMan.name'
  | 'badge.IronMan.desc'
  | 'badge.Loyalty3.name'
  | 'badge.Loyalty3.desc'
  | 'nav.leaderboard'
  | 'leaderboard.title'
  | 'leaderboard.sortSeason'
  | 'leaderboard.sortCareer'
  | 'leaderboard.playerOfMonth'
  | 'leaderboard.recentXp'
  | 'leaderboard.you'
  | 'leaderboard.empty'
  | 'leaderboard.seasonXp'
  | 'leaderboard.lifetimeXp'
  | 'homeTraining.title'
  | 'homeTraining.log'
  | 'homeTraining.hint'
  | 'homeTraining.pick'
  | 'homeTraining.pickPlaceholder'
  | 'homeTraining.free'
  | 'homeTraining.freePlaceholder'
  | 'homeTraining.duration'
  | 'homeTraining.date'
  | 'homeTraining.today'
  | 'homeTraining.yesterday'
  | 'homeTraining.submit'
  | 'homeTraining.empty'
  | 'homeTraining.statusPending'
  | 'homeTraining.statusConfirmed'
  | 'homeTraining.statusRejected'
  | 'homeTraining.minutes'
  | 'homeTraining.loadError'
  | 'homeTraining.rateLimit'
  | 'homeTraining.saveError'
  | 'homeTraining.capNote'
  | 'homeTraining.confirmQueue'
  | 'homeTraining.confirm'
  | 'homeTraining.reject'
  | 'nav.events'
  | 'events.title'
  | 'events.upcoming'
  | 'events.empty'
  | 'events.loadError'
  | 'events.typeHome'
  | 'events.typeTraining'
  | 'events.typeMatch'
  | 'events.typeOther'

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
  'nav.children': 'Moje děti',
  'nav.fan': 'Fandím',
  'fan.title': 'Fandím dětem',
  'fan.empty': 'Žádné nadcházející zápasy k fandění.',
  'fan.loadError': 'Nepodařilo se načíst zápasy.',
  'fan.checkIn': 'Fandím',
  'fan.checkedIn': 'Fandíme ✓',
  'fan.checkInError': 'Check-in se nezdařil. Zkuste to prosím znovu.',
  'fan.familyXp': 'Rodinné XP: {xp}',
  'fan.streak': 'Série {streak} 🔥',
  'fan.matchFallback': 'Zápas',
  'children.title': 'Moje děti',
  'children.empty': 'Zatím k vašemu účtu není propojené žádné dítě.',
  'children.loadError': 'Nepodařilo se načíst seznam dětí.',
  'children.clubRank': '{rank}. z {size} v klubu',
  'profile.accountTypeGuardian': 'Rodič',
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
  'xp.total': '{xp} XP celkem',
  'xp.toNextLevel': 'Do dalšího levelu zbývá {xp} XP',
  'xp.seasonForm': 'Sezónní forma',
  'xp.rank0': 'Nováček',
  'xp.rank1': 'Hráč',
  'xp.rank2': 'Stálice',
  'xp.rank3': 'Opora',
  'xp.rank4': 'Lídr',
  'xp.rank5': 'Kapitán',
  'xp.rank6': 'Legenda',
  'badge.section': 'Odznaky',
  'badge.Attendance10.name': 'Docházka I',
  'badge.Attendance10.desc': '10 tréninků',
  'badge.Attendance25.name': 'Docházka II',
  'badge.Attendance25.desc': '25 tréninků',
  'badge.Attendance50.name': 'Docházka III',
  'badge.Attendance50.desc': '50 tréninků',
  'badge.Attendance100.name': 'Docházka IV',
  'badge.Attendance100.desc': '100 tréninků',
  'badge.FirstGoal.name': 'První gól',
  'badge.FirstGoal.desc': 'Vstřel svůj první gól',
  'badge.Goals10.name': 'Střelec',
  'badge.Goals10.desc': '10 gólů',
  'badge.Goals50.name': 'Kanonýr',
  'badge.Goals50.desc': '50 gólů',
  'badge.Hattrick.name': 'Hattrick',
  'badge.Hattrick.desc': '3 góly v jednom zápase',
  'badge.Assists10.name': 'Nahrávač',
  'badge.Assists10.desc': '10 asistencí',
  'badge.Assists25.name': 'Dirigent',
  'badge.Assists25.desc': '25 asistencí',
  'badge.IronMan.name': 'Železný muž',
  'badge.IronMan.desc': 'Docházka nad 80 % za sezónu',
  'badge.Loyalty3.name': 'Věrnost',
  'badge.Loyalty3.desc': '3 odehrané sezóny',
  'nav.leaderboard': 'Žebříček',
  'leaderboard.title': 'Žebříček',
  'leaderboard.sortSeason': 'Sezónní',
  'leaderboard.sortCareer': 'Kariérní',
  'leaderboard.playerOfMonth': 'Hráč měsíce',
  'leaderboard.recentXp': '+{xp} XP za 30 dní',
  'leaderboard.you': 'Ty',
  'leaderboard.empty': 'Zatím žádné body v žebříčku.',
  'leaderboard.seasonXp': '{xp} XP',
  'leaderboard.lifetimeXp': '{xp} XP',
  'homeTraining.title': 'Domácí trénink',
  'homeTraining.log': 'Zapsat domácí trénink',
  'homeTraining.hint':
    'Zapiš, co jsi trénoval doma. Rodič nebo trenér to potvrdí a získáš XP (se stropem).',
  'homeTraining.pick': 'Vyber trénink',
  'homeTraining.pickPlaceholder': 'Vyber z nabídky',
  'homeTraining.free': 'nebo napiš vlastní',
  'homeTraining.freePlaceholder': 'Např. Střelba na cíl',
  'homeTraining.duration': 'Minuty',
  'homeTraining.date': 'Datum',
  'homeTraining.today': 'Dnes',
  'homeTraining.yesterday': 'Včera',
  'homeTraining.submit': 'Zapsat trénink',
  'homeTraining.empty': 'Zatím žádný domácí trénink.',
  'homeTraining.statusPending': 'Čeká na potvrzení',
  'homeTraining.statusConfirmed': 'Potvrzeno',
  'homeTraining.statusRejected': 'Zamítnuto',
  'homeTraining.minutes': '{n} min',
  'homeTraining.loadError': 'Nepodařilo se načíst domácí tréninky.',
  'homeTraining.rateLimit': 'Na tento den už je domácí trénink zapsán (max 1 denně).',
  'homeTraining.saveError': 'Trénink se nepodařilo zapsat.',
  'homeTraining.capNote': 'Domácí trénink se do XP počítá jen po potvrzení a max do 30 % ostatního XP.',
  'homeTraining.confirmQueue': 'Domácí tréninky k potvrzení',
  'homeTraining.confirm': 'Potvrdit',
  'homeTraining.reject': 'Zamítnout',
  'nav.events': 'Události',
  'events.title': 'Události',
  'events.upcoming': 'Nadcházející',
  'events.empty': 'Žádné nadcházející události.',
  'events.loadError': 'Nepodařilo se načíst události.',
  'events.typeHome': 'Domácí trénink',
  'events.typeTraining': 'Trénink',
  'events.typeMatch': 'Zápas',
  'events.typeOther': 'Událost',
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
