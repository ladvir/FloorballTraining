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
  | 'skills.addRating'
  | 'skills.addRatingTitle'
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
  | 'skillDetail.recordTest'
  | 'recordTest.title'
  | 'recordTest.selectTest'
  | 'recordTest.value'
  | 'recordTest.date'
  | 'recordTest.note'
  | 'recordTest.notePlaceholder'
  | 'recordTest.submit'
  | 'recordTest.saveError'
  | 'recordTest.notDerivedNotice'
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
  | 'badge.Attendance150.name'
  | 'badge.Attendance150.desc'
  | 'badge.Attendance250.name'
  | 'badge.Attendance250.desc'
  | 'badge.Attendance400.name'
  | 'badge.Attendance400.desc'
  | 'badge.Matches25.name'
  | 'badge.Matches25.desc'
  | 'badge.Matches100.name'
  | 'badge.Matches100.desc'
  | 'badge.Matches250.name'
  | 'badge.Matches250.desc'
  | 'badge.Goals100.name'
  | 'badge.Goals100.desc'
  | 'badge.Goals250.name'
  | 'badge.Goals250.desc'
  | 'badge.Goals500.name'
  | 'badge.Goals500.desc'
  | 'badge.FourGoalsInMatch.name'
  | 'badge.FourGoalsInMatch.desc'
  | 'badge.FiveGoalsInMatch.name'
  | 'badge.FiveGoalsInMatch.desc'
  | 'badge.Assists50.name'
  | 'badge.Assists50.desc'
  | 'badge.Assists100.name'
  | 'badge.Assists100.desc'
  | 'badge.Points50.name'
  | 'badge.Points50.desc'
  | 'badge.Points150.name'
  | 'badge.Points150.desc'
  | 'badge.Points300.name'
  | 'badge.Points300.desc'
  | 'badge.Points600.name'
  | 'badge.Points600.desc'
  | 'badge.PlusMinus20.name'
  | 'badge.PlusMinus20.desc'
  | 'badge.PlusMinus50.name'
  | 'badge.PlusMinus50.desc'
  | 'badge.PlusMinus100.name'
  | 'badge.PlusMinus100.desc'
  | 'badge.SeasonAttendance90.name'
  | 'badge.SeasonAttendance90.desc'
  | 'badge.SeasonAttendance100.name'
  | 'badge.SeasonAttendance100.desc'
  | 'badge.Loyalty5.name'
  | 'badge.Loyalty5.desc'
  | 'badge.Loyalty8.name'
  | 'badge.Loyalty8.desc'
  | 'badge.Loyalty10.name'
  | 'badge.Loyalty10.desc'
  | 'badge.HomeTraining10.name'
  | 'badge.HomeTraining10.desc'
  | 'badge.HomeTraining50.name'
  | 'badge.HomeTraining50.desc'
  | 'badge.HomeTraining150.name'
  | 'badge.HomeTraining150.desc'
  | 'badge.SkillImprovement1.name'
  | 'badge.SkillImprovement1.desc'
  | 'badge.SkillImprovement10.name'
  | 'badge.SkillImprovement10.desc'
  | 'badge.SkillImprovement25.name'
  | 'badge.SkillImprovement25.desc'
  | 'badge.SkillTarget5.name'
  | 'badge.SkillTarget5.desc'
  | 'badge.SkillTarget15.name'
  | 'badge.SkillTarget15.desc'
  | 'badge.TestRecord1.name'
  | 'badge.TestRecord1.desc'
  | 'badge.TestRecord10.name'
  | 'badge.TestRecord10.desc'
  | 'badge.PlayerOfTraining5.name'
  | 'badge.PlayerOfTraining5.desc'
  | 'badge.PlayerOfTraining20.name'
  | 'badge.PlayerOfTraining20.desc'
  | 'badge.FairPlay5.name'
  | 'badge.FairPlay5.desc'
  | 'badge.FairPlay20.name'
  | 'badge.FairPlay20.desc'
  | 'badge.FamilyCheered10.name'
  | 'badge.FamilyCheered10.desc'
  | 'badge.FamilyCheered50.name'
  | 'badge.FamilyCheered50.desc'
  | 'badge.Challenges10.name'
  | 'badge.Challenges10.desc'
  | 'badge.Challenges50.name'
  | 'badge.Challenges50.desc'
  | 'badge.CareerXp5000.name'
  | 'badge.CareerXp5000.desc'
  | 'badge.CareerXp15000.name'
  | 'badge.CareerXp15000.desc'
  | 'badge.CareerXp30000.name'
  | 'badge.CareerXp30000.desc'
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
  | 'events.toRate'
  | 'liveTraining.launch'
  | 'liveTraining.allParts'
  | 'liveTraining.endEarly'
  | 'liveTraining.open'
  | 'liveTraining.inProgress'
  | 'liveTraining.close'
  | 'liveTraining.nowLabel'
  | 'liveTraining.nextLabel'
  | 'liveTraining.lastPart'
  | 'liveTraining.partFallback'
  | 'liveTraining.onSchedule'
  | 'liveTraining.behindBy'
  | 'liveTraining.aheadBy'
  | 'liveTraining.inTime'
  | 'liveTraining.overdueBy'
  | 'liveTraining.nextPart'
  | 'liveTraining.finish'
  | 'liveTraining.finishConfirmTitle'
  | 'liveTraining.finishConfirmRate'
  | 'liveTraining.finished'
  | 'liveTraining.ratePrompt'
  | 'liveTraining.done'
  | 'liveTraining.emptyParts'
  | 'ratings.pickGrade'
  | 'ratings.commentPlaceholder'
  | 'ratings.save'
  | 'ratings.cancel'
  | 'ratings.delete'
  | 'ratings.deleteConfirmTitle'
  | 'ratings.saveError'
  | 'videos.openVideo'
  | 'coachAwards.title'
  | 'coachAwards.noPlayers'
  | 'coachAwards.saveError'
  | 'xpHowto.link'
  | 'xpHowto.back'
  | 'xpHowto.title'
  | 'xpHowto.subtitle'
  | 'xpHowto.self'
  | 'xpHowto.selfHint'
  | 'xpHowto.granted'
  | 'xpHowto.grantedHint'
  | 'xpHowto.layerA'
  | 'xpHowto.layerB'
  | 'xpHowto.layerC'
  | 'xpHowto.loadError'
  | 'xpHowto.earned'
  | 'xpHowto.name.TrainingAttendance'
  | 'xpHowto.name.MatchAttendance'
  | 'xpHowto.name.Goal'
  | 'xpHowto.name.Assist'
  | 'xpHowto.name.PlusMinus'
  | 'xpHowto.name.SkillGradeImprovement'
  | 'xpHowto.name.SkillTargetReached'
  | 'xpHowto.name.TestPersonalRecord'
  | 'xpHowto.name.PlayerOfTraining'
  | 'xpHowto.name.FairPlay'
  | 'xpHowto.name.FamilyCheered'
  | 'xpHowto.name.HomeTraining'
  | 'xpHowto.desc.TrainingAttendance'
  | 'xpHowto.desc.MatchAttendance'
  | 'xpHowto.desc.Goal'
  | 'xpHowto.desc.Assist'
  | 'xpHowto.desc.PlusMinus'
  | 'xpHowto.desc.SkillGradeImprovement'
  | 'xpHowto.desc.SkillTargetReached'
  | 'xpHowto.desc.TestPersonalRecord'
  | 'xpHowto.desc.PlayerOfTraining'
  | 'xpHowto.desc.FairPlay'
  | 'xpHowto.desc.FamilyCheered'
  | 'xpHowto.desc.HomeTraining'
  | 'challenge.section'
  | 'challenge.rewardXp'
  | 'challenge.done'
  | 'challenge.progress'
  | 'challenge.window.Week'
  | 'challenge.window.Month'
  | 'challenge.window.Season'
  | 'challenge.Train3PerWeek.title'
  | 'challenge.Train3PerWeek.desc'
  | 'challenge.ScoreInMatch.title'
  | 'challenge.ScoreInMatch.desc'
  | 'challenge.TwoHomeTrainings.title'
  | 'challenge.TwoHomeTrainings.desc'
  | 'challenge.ImproveSkill.title'
  | 'challenge.ImproveSkill.desc'
  | 'challenge.TestRecord.title'
  | 'challenge.TestRecord.desc'

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
  'skills.addRating': 'Přidat hodnocení dovednosti',
  'skills.addRatingTitle': 'Vyberte dovednost k ohodnocení',
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
  'skillDetail.recordTest': 'Zaznamenat test',
  'recordTest.title': 'Zaznamenat výsledek testu',
  'recordTest.selectTest': 'Test',
  'recordTest.value': 'Výsledek',
  'recordTest.date': 'Datum',
  'recordTest.note': 'Poznámka',
  'recordTest.notePlaceholder': 'Volitelná poznámka',
  'recordTest.submit': 'Uložit výsledek',
  'recordTest.saveError': 'Uložení výsledku se nezdařilo.',
  'recordTest.notDerivedNotice':
    'Výsledek testu byl uložen, ale nešlo z něj odvodit známku dovednosti — zkontrolujte nastavení testu (rozsahy/skill grade) ve FloTr webu.',
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
  'badge.Attendance150.name': 'Docházka 150',
  'badge.Attendance150.desc': '150 tréninků',
  'badge.Attendance250.name': 'Docházka 250',
  'badge.Attendance250.desc': '250 tréninků',
  'badge.Attendance400.name': 'Docházka 400',
  'badge.Attendance400.desc': '400 tréninků',
  'badge.Matches25.name': 'Bojovník 25',
  'badge.Matches25.desc': '25 odehraných zápasů',
  'badge.Matches100.name': 'Bojovník 100',
  'badge.Matches100.desc': '100 odehraných zápasů',
  'badge.Matches250.name': 'Bojovník 250',
  'badge.Matches250.desc': '250 odehraných zápasů',
  'badge.Goals100.name': 'Kanonýr II',
  'badge.Goals100.desc': '100 gólů',
  'badge.Goals250.name': 'Kanonýr III',
  'badge.Goals250.desc': '250 gólů',
  'badge.Goals500.name': 'Kanonýr IV',
  'badge.Goals500.desc': '500 gólů',
  'badge.FourGoalsInMatch.name': 'Poker',
  'badge.FourGoalsInMatch.desc': '4 góly v jednom zápase',
  'badge.FiveGoalsInMatch.name': 'Nezastavitelný',
  'badge.FiveGoalsInMatch.desc': '5 a více gólů v jednom zápase',
  'badge.Assists50.name': 'Nahrávač III',
  'badge.Assists50.desc': '50 asistencí',
  'badge.Assists100.name': 'Nahrávač IV',
  'badge.Assists100.desc': '100 asistencí',
  'badge.Points50.name': 'Kompletní hráč I',
  'badge.Points50.desc': '50 bodů (góly + asistence)',
  'badge.Points150.name': 'Kompletní hráč II',
  'badge.Points150.desc': '150 bodů (góly + asistence)',
  'badge.Points300.name': 'Kompletní hráč III',
  'badge.Points300.desc': '300 bodů (góly + asistence)',
  'badge.Points600.name': 'Kompletní hráč IV',
  'badge.Points600.desc': '600 bodů (góly + asistence)',
  'badge.PlusMinus20.name': 'Jistota',
  'badge.PlusMinus20.desc': 'kariérní bilance +20',
  'badge.PlusMinus50.name': 'Opora obrany',
  'badge.PlusMinus50.desc': 'kariérní bilance +50',
  'badge.PlusMinus100.name': 'Zeď',
  'badge.PlusMinus100.desc': 'kariérní bilance +100',
  'badge.SeasonAttendance90.name': 'Železný muž II',
  'badge.SeasonAttendance90.desc': '90% docházka v sezóně',
  'badge.SeasonAttendance100.name': 'Železný muž III',
  'badge.SeasonAttendance100.desc': '100% docházka v sezóně',
  'badge.Loyalty5.name': 'Věrnost II',
  'badge.Loyalty5.desc': '5 odehraných sezón',
  'badge.Loyalty8.name': 'Věrnost III',
  'badge.Loyalty8.desc': '8 odehraných sezón',
  'badge.Loyalty10.name': 'Věrnost IV',
  'badge.Loyalty10.desc': '10 odehraných sezón',
  'badge.HomeTraining10.name': 'Domácí bojovník I',
  'badge.HomeTraining10.desc': '10 domácích tréninků',
  'badge.HomeTraining50.name': 'Domácí bojovník II',
  'badge.HomeTraining50.desc': '50 domácích tréninků',
  'badge.HomeTraining150.name': 'Domácí bojovník III',
  'badge.HomeTraining150.desc': '150 domácích tréninků',
  'badge.SkillImprovement1.name': 'Na vzestupu I',
  'badge.SkillImprovement1.desc': 'první zlepšená známka',
  'badge.SkillImprovement10.name': 'Na vzestupu II',
  'badge.SkillImprovement10.desc': '10× zlepšená známka',
  'badge.SkillImprovement25.name': 'Na vzestupu III',
  'badge.SkillImprovement25.desc': '25× zlepšená známka',
  'badge.SkillTarget5.name': 'Cíl splněn I',
  'badge.SkillTarget5.desc': '5× dosažená cílová známka',
  'badge.SkillTarget15.name': 'Cíl splněn II',
  'badge.SkillTarget15.desc': '15× dosažená cílová známka',
  'badge.TestRecord1.name': 'Osobák I',
  'badge.TestRecord1.desc': 'první osobní rekord v testu',
  'badge.TestRecord10.name': 'Osobák II',
  'badge.TestRecord10.desc': '10 osobních rekordů v testech',
  'badge.PlayerOfTraining5.name': 'Hráč tréninku I',
  'badge.PlayerOfTraining5.desc': '5× hráč tréninku',
  'badge.PlayerOfTraining20.name': 'Hráč tréninku II',
  'badge.PlayerOfTraining20.desc': '20× hráč tréninku',
  'badge.FairPlay5.name': 'Fair play I',
  'badge.FairPlay5.desc': '5× ocenění za fair play',
  'badge.FairPlay20.name': 'Fair play II',
  'badge.FairPlay20.desc': '20× ocenění za fair play',
  'badge.FamilyCheered10.name': 'Rodinná podpora I',
  'badge.FamilyCheered10.desc': '10× přišla povzbudit rodina',
  'badge.FamilyCheered50.name': 'Rodinná podpora II',
  'badge.FamilyCheered50.desc': '50× přišla povzbudit rodina',
  'badge.Challenges10.name': 'Bojovník výzev I',
  'badge.Challenges10.desc': '10 splněných výzev',
  'badge.Challenges50.name': 'Bojovník výzev II',
  'badge.Challenges50.desc': '50 splněných výzev',
  'badge.CareerXp5000.name': '5 000 XP',
  'badge.CareerXp5000.desc': '5 000 XP za kariéru',
  'badge.CareerXp15000.name': '15 000 XP',
  'badge.CareerXp15000.desc': '15 000 XP za kariéru',
  'badge.CareerXp30000.name': '30 000 XP',
  'badge.CareerXp30000.desc': '30 000 XP za kariéru',
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
  'events.toRate': 'K ohodnocení',
  'liveTraining.launch': 'Spustit živě',
  'liveTraining.allParts': 'Všechny části',
  'liveTraining.endEarly': 'Ukončit',
  'liveTraining.open': 'Otevřít',
  'liveTraining.inProgress': 'Probíhá živý trénink',
  'liveTraining.close': 'Zavřít',
  'liveTraining.nowLabel': 'Část {i}/{total}',
  'liveTraining.nextLabel': 'Následuje',
  'liveTraining.lastPart': 'Toto je poslední část.',
  'liveTraining.partFallback': 'Část {n}',
  'liveTraining.onSchedule': 'Podle plánu',
  'liveTraining.behindBy': 'Ve skluzu o {time}',
  'liveTraining.aheadBy': 'V předstihu o {time}',
  'liveTraining.inTime': 'za {time}',
  'liveTraining.overdueBy': 'zpoždění {time}',
  'liveTraining.nextPart': 'Další část',
  'liveTraining.finish': 'Ukončit trénink',
  'liveTraining.finishConfirmTitle': 'Ukončit trénink?',
  'liveTraining.finishConfirmRate': 'Ukončit trénink a ohodnotit událost?',
  'liveTraining.finished': 'Trénink dokončen',
  'liveTraining.ratePrompt': 'Chceš událost ohodnotit?',
  'liveTraining.done': 'Hotovo',
  'liveTraining.emptyParts': 'Trénink nemá žádné části.',
  'ratings.pickGrade': 'Zvolit známku',
  'ratings.commentPlaceholder': 'Komentář (volitelný)...',
  'ratings.save': 'Uložit hodnocení',
  'ratings.cancel': 'Zrušit',
  'ratings.delete': 'Smazat',
  'ratings.deleteConfirmTitle': 'Smazat hodnocení?',
  'ratings.saveError': 'Hodnocení se nepodařilo uložit.',
  'videos.openVideo': 'Otevřít video',
  'coachAwards.title': 'Trenérské bonusy',
  'coachAwards.noPlayers': 'Žádní hráči k ocenění.',
  'coachAwards.saveError': 'Uložení bonusu se nezdařilo. Zkuste to prosím znovu.',
  'xpHowto.link': 'Jak získat XP',
  'xpHowto.back': 'Zpět',
  'xpHowto.title': 'Jak získat XP',
  'xpHowto.subtitle': 'Přehled všeho, za co získáváš XP, a kolik.',
  'xpHowto.self': 'Co zvládnu sám',
  'xpHowto.selfHint': 'Tyhle získáváš vlastní docházkou, hrou a snahou — nikdo ti je nemusí udělit.',
  'xpHowto.granted': 'Co ocení trenér nebo rodina',
  'xpHowto.grantedHint': 'Tyhle uděluje trenér, nebo je získá tvoje rodina, když ti přijde fandit.',
  'xpHowto.layerA': 'Automaticky',
  'xpHowto.layerB': 'Trenér',
  'xpHowto.layerC': 'Doma',
  'xpHowto.loadError': 'Nepodařilo se načíst pravidla XP.',
  'xpHowto.earned': 'Máš {xp} XP',
  'xpHowto.name.TrainingAttendance': 'Účast na tréninku',
  'xpHowto.name.MatchAttendance': 'Účast na zápase',
  'xpHowto.name.Goal': 'Góly',
  'xpHowto.name.Assist': 'Asistence',
  'xpHowto.name.PlusMinus': 'Plus/minus',
  'xpHowto.name.SkillGradeImprovement': 'Zlepšení dovednosti',
  'xpHowto.name.SkillTargetReached': 'Splněný cíl dovednosti',
  'xpHowto.name.TestPersonalRecord': 'Osobní rekord v testu',
  'xpHowto.name.PlayerOfTraining': 'Nejlepší hráč',
  'xpHowto.name.FairPlay': 'Fair play',
  'xpHowto.name.FamilyCheered': 'Rodina fandila',
  'xpHowto.name.HomeTraining': 'Domácí trénink',
  'xpHowto.desc.TrainingAttendance': 'Přijď na trénink.',
  'xpHowto.desc.MatchAttendance': 'Přijď na zápas.',
  'xpHowto.desc.Goal': 'Dej gól v zápase.',
  'xpHowto.desc.Assist': 'Nahraj na gól v zápase.',
  'xpHowto.desc.PlusMinus': 'Buď na hřišti, když tým dá gól.',
  'xpHowto.desc.SkillGradeImprovement': 'Zlepši známku dovednosti oproti minulému hodnocení.',
  'xpHowto.desc.SkillTargetReached': 'Dosáhni cílové známky u dovednosti.',
  'xpHowto.desc.TestPersonalRecord': 'Překonej svůj nejlepší výsledek v testu.',
  'xpHowto.desc.PlayerOfTraining': 'Buď vybrán jako nejlepší hráč tréninku.',
  'xpHowto.desc.FairPlay': 'Fair play, pomoc spoluhráčům, vedení týmu.',
  'xpHowto.desc.FamilyCheered': 'Tvoje rodina přijde fandit na zápas.',
  'xpHowto.desc.HomeTraining': 'Zapiš potvrzený domácí trénink (se stropem).',
  'challenge.section': 'Tvoje výzvy',
  'challenge.rewardXp': '+{xp} XP',
  'challenge.done': 'Splněno! +{xp} XP',
  'challenge.progress': '{current}/{target}',
  'challenge.window.Week': 'tento týden',
  'challenge.window.Month': 'tento měsíc',
  'challenge.window.Season': 'tuto sezónu',
  'challenge.Train3PerWeek.title': 'Přijď na 3 tréninky',
  'challenge.Train3PerWeek.desc': 'Zúčastni se tří tréninků tento týden.',
  'challenge.ScoreInMatch.title': 'Vstřel gól',
  'challenge.ScoreInMatch.desc': 'Dej gól v zápase.',
  'challenge.TwoHomeTrainings.title': 'Zacvič si doma',
  'challenge.TwoHomeTrainings.desc': 'Zaznamenej 2 domácí tréninky.',
  'challenge.ImproveSkill.title': 'Zlepši se',
  'challenge.ImproveSkill.desc': 'Zlepši známku v jedné dovednosti.',
  'challenge.TestRecord.title': 'Osobní rekord',
  'challenge.TestRecord.desc': 'Vytvoř osobní rekord v testu.',
}

const locales = { cs }
const currentLocale: keyof typeof locales = 'cs'

export const t = (key: StringKey, params?: Record<string, string>): string => {
  // Fall back to the key itself if a locale is missing an entry - a visible "badge.Foo.name"
  // beats a blank <Text> when the backend adds a code the client hasn't translated yet.
  const template = locales[currentLocale][key] ?? key
  if (!params) return template
  return Object.entries(params).reduce((str, [name, value]) => str.replace(`{${name}}`, value), template)
}

/** Verbal label for a grade 1-5 (spec section 9). Lived in theme/tokens as hardcoded Czech
 * until Etapa 12's "no text outside the i18n layer" pass moved it here. */
export const gradeLabel = (grade: 1 | 2 | 3 | 4 | 5): string => t(`grade.${grade}`)
