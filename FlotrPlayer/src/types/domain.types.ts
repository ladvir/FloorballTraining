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
