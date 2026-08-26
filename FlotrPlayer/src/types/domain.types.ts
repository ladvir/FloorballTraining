export type EffectiveRole = 'Admin' | 'ClubAdmin' | 'HeadCoach' | 'Coach' | 'User'
export type AccountType = 'Player' | 'Coach' | 'Guardian'

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  id: string
  token: string
  accessToken: string
  /** Only present for native clients (see AuthController.IsNativeClient) - always absent for web. */
  refreshToken?: string | null
  email: string
  firstName: string
  lastName: string
  roles: string[]
  effectiveRole: EffectiveRole
  accountType: AccountType
  /** True when this login is a guardian of >=1 child - a coach-parent still gets a "Moje děti" entry (#102). */
  hasGuardianChildren: boolean
}

/** Enums.SkillCategoryPosition - the two skill-category groupings (spec section 8). */
export type SkillCategoryPosition = 'FieldPlayer' | 'Goalkeeper'

/** A member's resolved or explicit player role - "Both" covers a player rated on both skill sets. */
export type PlayerPosition = SkillCategoryPosition | 'Both'

/** Does this member also coach a team, per TeamMember.IsCoach (mirrors MemberDto.GetTeamRoleList()). */
export type MemberTeamRole = 'Player' | 'PlayerCoach'

export interface PlayerSkillDto {
  skillId: number
  name: string
  sortOrder: number
  /** Current grade 1 (best)-5 (worst); null when never rated. */
  grade: number | null
  targetGrade: number | null
  recommendation: string | null
  ratedAt: string | null
  ratedByUserName: string | null
  /** Coach-selected development focus ("Doporučení pro rozvoj"). */
  isFocus: boolean
}

export interface PlayerSkillCategoryDto {
  categoryId: number
  name: string
  sortOrder: number
  position: SkillCategoryPosition
  skills: PlayerSkillDto[]
}

/** GET /playerskills/me and GET /playerskills/member/{id}. */
export interface PlayerSkillCardDto {
  memberId: number
  firstName: string
  lastName: string
  position: PlayerPosition
  explicitRole: PlayerPosition | null
  teamRole: MemberTeamRole
  clubName: string
  birthYear: number
  teams: string[]
  categories: PlayerSkillCategoryDto[]
}

/** GET /playerskills/roster - since #85 also available to a Hráč account ("Režim prohlížení"). */
export interface PlayerSkillRosterMemberDto {
  memberId: number
  firstName: string
  lastName: string
  position: PlayerPosition
  teamRole: MemberTeamRole
  birthYear: number
  teams: string[]
  categoryGrades: RosterCategoryGradeDto[]
}

/** One category's average grade in the roster list - the roster row's colored grade strip. */
export interface RosterCategoryGradeDto {
  categoryId: number
  name: string
  /** Splits a "Both" player's strip into one row per position. */
  position: SkillCategoryPosition
  /** Average 1 (best)-5 (worst) of the latest grades; null when no skill in the category is rated. */
  average: number | null
}

/** GET /playerskills/member/{id}/skill/{skillId}/history - one row per past rating, oldest first. */
export interface PlayerSkillHistoryEntryDto {
  grade: number
  targetGrade: number | null
  recommendation: string | null
  ratedAt: string
  ratedByUserName: string | null
  /** Result value of the source test ("3.45 s", "Ano", ...) when this rating was test-derived (#92); null for a manual rating. */
  testValueLabel: string | null
}

/** PUT /playerskills/member/{id} request body (Etapa 10, #88) - one item per edited skill. */
export interface PlayerSkillBatchItemDto {
  skillId: number
  grade: number
  targetGrade: number | null
  recommendation: string | null
}

// Raw enum int, not a string - System.Text.Json has no string-enum converter registered for this
// DTO (unlike PlayerSkillCategoryDto.position, which the backend converts with .ToString()), so
// the wire value is 0/1. Matches FloTr web's own `TestType = number // 0=Number, 1=Grade` (#92).
export type TestType = number

/** One selectable answer of a Grade-type test - GradeOptionDto (#92). */
export interface GradeOptionDto {
  id: number
  label: string
  numericValue: number
  colour: string | null
  sortOrder: number
  /** Fixed skill grade (1-5) this option implies, when the test is linked to a Skill. */
  skillGrade: number | null
}

/** GET /testdefinitions - club's test library, filtered client-side by skillId (#92). */
export interface TestDefinitionDto {
  id: number
  name: string
  testType: TestType
  unit: string | null
  skillId: number | null
  gradeOptions: GradeOptionDto[]
}

/** POST /testresults request body - only the fields the mobile "Zaznamenat test" form fills in (#92). */
export interface CreateTestResultDto {
  testDefinitionId: number
  memberId: number
  numericValue: number | null
  gradeOptionId: number | null
  testDate: string
  note: string | null
}

/** POST /testresults response - DerivedSkillGrade is only populated when the test is linked to a Skill (#92). */
export interface TestResultDto {
  id: number
  testDefinitionId: number
  memberId: number
  derivedSkillGrade: number | null
}

/** GET /guardian/children - a child a guardian is linked to (guardian's own read-only view, #102). */
export interface GuardianChildDto {
  memberId: number
  firstName: string
  lastName: string
  birthYear: number
  clubName: string
  totalXp: number
  level: number
  rank: string
  /** The child's seasonal placement in their club (1-based); null when not yet ranked. */
  clubRank: number | null
  clubSize: number
}

/** GET /fan/children - a guardian's child with matches to cheer + family Fan XP and streak (#103). */
export interface FanChildDto {
  memberId: number
  firstName: string
  lastName: string
  /** Family Fan XP = 10 × all guardians' check-ins for this child. */
  familyXp: number
  /** Consecutive most-recent started matches with a family check-in. */
  cheerStreak: number
  matches: FanMatchDto[]
}

/** One of a child's upcoming/current matches. */
export interface FanMatchDto {
  appointmentId: number
  name: string | null
  start: string
  end: string
  /** Match is on/running and this guardian hasn't checked in yet - the "Fandím" button is active. */
  canCheckIn: boolean
  checkedIn: boolean
}

/** POST /fan/checkin body. */
export interface FanCheckInRequest {
  appointmentId: number
  memberId: number
}

/** GET /xp/member/{id} - lifetime career rank/level + per-season form (#94/#95). */
export interface XpSummaryDto {
  memberId: number
  totalXp: number
  career: CareerXpDto
  bySeason: SeasonXpDto[]
  /** Lifetime XP per event type (non-zero only); HomeTraining is the capped/counted figure. */
  byType: XpByTypeDto[]
}

/** Lifetime XP earned for one XpEventType (its enum name). */
export interface XpByTypeDto {
  type: string
  xp: number
}

/** Career progression derived from lifetime XP (#95). */
export interface CareerXpDto {
  totalXp: number
  /** 0 (Nováček) .. 6 (Legenda) - drives the localized rank name. */
  rankIndex: number
  rank: string
  /** Level within the current rank; resets to 1 on promotion. */
  level: number
  xpToNextLevel: number
  /** 0..1 progress within the current level - fills the card's XP bar. */
  levelProgress: number
  nextRank: string | null
  xpToNextRank: number | null
  rankProgress: number
}

export interface SeasonXpDto {
  seasonId: number
  xp: number
  /** Seasonal form 1..5. */
  stars: number
}

/** One earnable reward in the "How to earn XP" catalog (#107). Title/desc come from `xpHowto.name.*`
 *  / `xpHowto.desc.*` keyed by `code`. */
export interface XpRuleCatalogItemDto {
  code: string
  /** Effective club value (#106 override, else default). */
  points: number
  /** "A" automatic | "B" coach-granted | "C" capped self-report. */
  layer: 'A' | 'B' | 'C'
  /** "player" | "coach" | "parent". */
  trigger: 'player' | 'coach' | 'parent'
  selfActionable: boolean
}

/** GET /xp/leaderboard - a club/team ranking (#98). Default sort is seasonal (fair); "career" = lifetime. */
export interface LeaderboardDto {
  seasonId: number | null
  sort: 'season' | 'career'
  rows: LeaderboardRowDto[]
  /** Top XP gainer over the trailing 30 days, or null if nobody gained XP. */
  playerOfMonth: LeaderboardRowDto | null
}

export interface LeaderboardRowDto {
  /** 1-based position in the current sort. */
  position: number
  memberId: number
  name: string
  birthYear: number
  seasonXp: number
  /** Seasonal form 1..5. */
  stars: number
  lifetimeXp: number
  careerRank: string
  careerRankIndex: number
  /** XP gained in the player-of-the-month window; only meaningful on playerOfMonth. */
  recentXp: number
}

/** GET /xp/badges/{id} - one milestone badge's status: earned (with date) or in-progress (#97). */
export interface BadgeStatusDto {
  /** BadgeCode name; i18n via badge.{code}.name / .desc. */
  code: string
  /** Emoji shown for the badge. */
  icon: string
  threshold: number
  current: number
  earned: boolean
  earnedAt: string | null
  /** 0..1 progress toward the threshold (1.0 when earned). */
  progress: number
}

/** One self-completable challenge's live progress for a member (#108/#109). Title/desc come from
 *  `challenge.{code}.title` / `.desc`; the window drives `challenge.window.{window}`. */
export interface ChallengeDto {
  /** ChallengeCode name — i18n key base and completion key. */
  code: string
  /** ChallengeMetric name. */
  metric: string
  /** "Week" | "Month" | "Season". */
  window: string
  /** The window this figure belongs to, e.g. "2026-W31". */
  periodKey: string
  target: number
  /** Progress count in the window (clamped to target). */
  current: number
  /** 0..1. */
  progress: number
  rewardXp: number
  completed: boolean
  completedAt: string | null
}

/** GET /xp/challenges/{id} — a member's challenge board (#109): in progress now + recently earned. */
export interface ChallengesDto {
  active: ChallengeDto[]
  recentlyCompleted: ChallengeDto[]
}

/** An individual/home training from the catalog (GET /trainings/individual) — #104. */
export interface IndividualTrainingDto {
  id: number
  name: string
  description?: string | null
}

/** A self-reported home training (#104). "Pending" | "Confirmed" | "Rejected". */
export interface HomeTrainingLogDto {
  id: number
  memberId: number
  memberName?: string | null
  trainingId?: number | null
  title: string
  durationMin?: number | null
  note?: string | null
  loggedAt: string
  status: 'Pending' | 'Confirmed' | 'Rejected'
  confirmedByUserId?: string | null
  confirmedAt?: string | null
  rejectedAt?: string | null
  appointmentId?: number | null
}

export interface CreateHomeTrainingLogDto {
  trainingId?: number | null
  title?: string | null
  durationMin?: number | null
  note?: string | null
  loggedAt: string
}

/** Minimal appointment for the mobile Events list (#104) — GET /appointments. */
export interface AppointmentDto {
  id: number
  name?: string | null
  description?: string | null
  start: string
  end: string
  appointmentType?: number | null
  teamId?: number | null
  trainingId?: number | null
  trainingName?: string | null
  locationName?: string | null
}

/** Video attached to an appointment (#124/#127/#131). Mirrors FloTr's VideoDto. */
export type VideoType = 0 | 1 | 2 | 3 // 0=UploadedFile, 1=YouTube, 2=Instagram, 3=OtherLink

export interface VideoDto {
  id: number
  videoType: VideoType
  url?: string
  filePath?: string
  title?: string
  thumbnailUrl?: string
  createdByUserId?: string
  createdAt: string
}

/** Saved video editor analysis (#137). Read-only here - drawing/editing is web-only (#142). */
export interface VideoAnnotationDto {
  id: number
  videoId: number
  trimStartMs?: number | null
  trimEndMs?: number | null
  dataJson: string
  updatedAt?: string | null
}

/** Coach 1-click bonus (layer B, #100/#110). Label lives under i18n `xpHowto.name.<type>`. */
export type AwardType = 'PlayerOfTraining' | 'FairPlay' | 'FamilyCheered'

export interface XpAwardDto {
  id: number
  appointmentId: number
  memberId: number
  type: AwardType
  awardedByUserId: string
  awardedAt: string
}

export interface CreateXpAwardDto {
  appointmentId: number
  memberId: number
  type: AwardType
}

/** GET /ratings?appointmentId=X — the caller's own rating of a past event. Grade 1 (best)-5 (worst),
 *  same school-grade scale as PlayerSkillDto; editable/deletable only within the backend's 3-day window. */
export interface AppointmentRatingDto {
  id: number
  appointmentId: number
  grade: number
  comment?: string | null
  createdAt: string
}

/** POST /ratings and PUT /ratings/{id} body. */
export interface RateAppointmentRequest {
  appointmentId: number
  grade: number
  comment?: string | null
}
