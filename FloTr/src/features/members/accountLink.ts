import type { MemberDto } from '../../types/domain.types'
import type { EffectiveRole } from '../../types/domain.types'

/** UI languages selectable for a user/member account. */
export const SUPPORTED_LANGUAGES = ['cs', 'sk', 'pl', 'de', 'en'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

/** Normalize a language code to a supported one, or null when unsupported. */
export function normalizeLanguage(code: string | null | undefined): SupportedLanguage | null {
  if (!code) return null
  const short = code.trim().toLowerCase().slice(0, 2)
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(short)
    ? (short as SupportedLanguage)
    : null
}

/** Whether the member is connected to a login account. */
export type LinkState = 'linked' | 'roster-only'

export function linkState(member: Pick<MemberDto, 'appUserId' | 'hasLogin'>): LinkState {
  return member.hasLogin || !!member.appUserId ? 'linked' : 'roster-only'
}

/** Minimal e-mail sanity check (a login cannot be created without one). */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

/** A login can be created only for an unlinked member that has a valid e-mail. */
export function canCreateLogin(
  member: Pick<MemberDto, 'appUserId' | 'hasLogin' | 'email'>
): boolean {
  return linkState(member) === 'roster-only' && isValidEmail(member.email)
}

/**
 * Whether the caller may manage a member↔account link in the given club.
 * Admin anywhere; ClubAdmin/HeadCoach only within their active club.
 */
export function canManageLink(
  callerRole: EffectiveRole,
  memberClubId: number | null | undefined,
  callerClubId: number | null | undefined
): boolean {
  if (callerRole === 'Admin') return true
  if (callerRole === 'ClubAdmin' || callerRole === 'HeadCoach')
    return memberClubId != null && memberClubId === callerClubId
  return false
}
