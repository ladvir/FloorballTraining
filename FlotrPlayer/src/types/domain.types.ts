export type EffectiveRole = 'Admin' | 'ClubAdmin' | 'HeadCoach' | 'Coach' | 'User'
export type AccountType = 'Player' | 'Coach'

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
}

/** GET /playerskills/member/{id}/skill/{skillId}/history - one row per past rating, oldest first. */
export interface PlayerSkillHistoryEntryDto {
  grade: number
  targetGrade: number | null
  recommendation: string | null
  ratedAt: string
  ratedByUserName: string | null
}
