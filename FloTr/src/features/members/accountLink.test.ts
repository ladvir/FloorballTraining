import { describe, it, expect } from 'vitest'
import {
  normalizeLanguage,
  linkState,
  isValidEmail,
  canCreateLogin,
  canManageLink,
  SUPPORTED_LANGUAGES,
} from './accountLink'

describe('normalizeLanguage', () => {
  it('accepts supported short codes', () => {
    for (const code of SUPPORTED_LANGUAGES) {
      expect(normalizeLanguage(code)).toBe(code)
    }
  })

  it('truncates regional variants to the base language', () => {
    expect(normalizeLanguage('en-US')).toBe('en')
    expect(normalizeLanguage('DE-at')).toBe('de')
  })

  it('rejects unsupported and empty values', () => {
    expect(normalizeLanguage('fr')).toBeNull()
    expect(normalizeLanguage('')).toBeNull()
    expect(normalizeLanguage(null)).toBeNull()
    expect(normalizeLanguage(undefined)).toBeNull()
  })
})

describe('linkState', () => {
  it('is linked when hasLogin is true', () => {
    expect(linkState({ hasLogin: true, appUserId: undefined })).toBe('linked')
  })

  it('is linked when an appUserId is present', () => {
    expect(linkState({ hasLogin: false, appUserId: 'abc' })).toBe('linked')
  })

  it('is roster-only with neither', () => {
    expect(linkState({ hasLogin: false, appUserId: undefined })).toBe('roster-only')
    expect(linkState({})).toBe('roster-only')
  })
})

describe('isValidEmail', () => {
  it('accepts a plain address', () => {
    expect(isValidEmail('a@b.cz')).toBe(true)
  })
  it('rejects malformed or empty', () => {
    expect(isValidEmail('nope')).toBe(false)
    expect(isValidEmail('a@b')).toBe(false)
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail(null)).toBe(false)
  })
})

describe('canCreateLogin', () => {
  it('allows an unlinked member with a valid e-mail', () => {
    expect(canCreateLogin({ appUserId: undefined, hasLogin: false, email: 'x@y.cz' })).toBe(true)
  })
  it('blocks when already linked', () => {
    expect(canCreateLogin({ appUserId: 'u1', hasLogin: true, email: 'x@y.cz' })).toBe(false)
  })
  it('blocks when the e-mail is missing or invalid', () => {
    expect(canCreateLogin({ appUserId: undefined, hasLogin: false, email: '' })).toBe(false)
    expect(canCreateLogin({ appUserId: undefined, hasLogin: false, email: 'bad' })).toBe(false)
  })
})

describe('canManageLink', () => {
  it('lets an Admin manage any club', () => {
    expect(canManageLink('Admin', 5, null)).toBe(true)
    expect(canManageLink('Admin', 5, 9)).toBe(true)
  })

  it('lets ClubAdmin/HeadCoach manage only their own club', () => {
    expect(canManageLink('ClubAdmin', 5, 5)).toBe(true)
    expect(canManageLink('HeadCoach', 5, 5)).toBe(true)
    expect(canManageLink('ClubAdmin', 5, 9)).toBe(false)
    expect(canManageLink('HeadCoach', 5, null)).toBe(false)
  })

  it('never lets a plain Coach or User manage links', () => {
    expect(canManageLink('Coach', 5, 5)).toBe(false)
    expect(canManageLink('User', 5, 5)).toBe(false)
  })
})
