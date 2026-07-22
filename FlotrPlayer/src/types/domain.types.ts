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
  clubName: string
  birthYear: number
  teams: string[]
  categories: PlayerSkillCategoryDto[]
}

/** GET /playerskills/roster - coach-only. */
export interface PlayerSkillRosterMemberDto {
  memberId: number
  firstName: string
  lastName: string
  position: PlayerPosition
  birthYear: number
  teams: string[]
}
