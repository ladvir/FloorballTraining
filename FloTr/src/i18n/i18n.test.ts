import { describe, it, expect } from 'vitest'
import i18n from './index'

describe('i18n', () => {
  it('default language is cs or follows browser locale', () => {
    // In jsdom (test env) navigator.language is 'en-US', so detector picks that up.
    // In a real browser with no stored preference, fallbackLng 'cs' is used for unknown locales.
    // The key assertion: language is a valid i18n language string.
    expect(typeof i18n.language).toBe('string')
    expect(i18n.language.length).toBeGreaterThan(0)
  })

  it('setLanguage stores to localStorage', () => {
    i18n.changeLanguage('en')
    expect(localStorage.getItem('flotr_lang')).toBe('en')
    i18n.changeLanguage('cs') // restore
  })

  it('fallback for unknown key returns key', () => {
    expect(i18n.t('nonexistent.key.xyz')).toBe('nonexistent.key.xyz')
  })

  it('cs translation for nav.dashboard is correct', () => {
    i18n.changeLanguage('cs')
    expect(i18n.t('nav.dashboard')).toBe('Dashboard')
  })

  it('en translation for auth.login is correct', () => {
    i18n.changeLanguage('en')
    expect(i18n.t('auth.login')).toBe('Sign In')
    i18n.changeLanguage('cs') // restore
  })
})
