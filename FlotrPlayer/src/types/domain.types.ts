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
}

/** PUT /playerskills/member/{id} request body (Etapa 10, #88) - one item per edited skill. */
export interface PlayerSkillBatchItemDto {
  skillId: number
  grade: number
  targetGrade: number | null
  recommendation: string | null
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

/** GET /xp/member/{id} - lifetime career rank/level + per-season form (#94/#95). */
export interface XpSummaryDto {
  memberId: number
  totalXp: number
  career: CareerXpDto
  bySeason: SeasonXpDto[]
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
