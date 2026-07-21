export type EffectiveRole = 'Admin' | 'ClubAdmin' | 'HeadCoach' | 'Coach' | 'User'

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  id: string
  token: string
  email: string
  firstName: string
  lastName: string
  roles: string[]
  effectiveRole: EffectiveRole
  accountType: 'Player' | 'Coach'
}
