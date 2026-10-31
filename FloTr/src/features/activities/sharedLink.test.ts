import { describe, it, expect, beforeEach } from 'vitest'
import {
  bestSourceText,
  buildAiCriteria,
  buildManualSuggestion,
  cleanSharedUrl,
  clearPendingShare,
  extractSharedUrl,
  getSocialSource,
  hasPendingShare,
  loadPendingShare,
  savePendingShare,
  withSourceLink,
} from './sharedLink'

describe('extractSharedUrl', () => {
  it('prefers the url param', () => {
    const p = new URLSearchParams({ url: 'https://www.instagram.com/reel/abc/', text: 'x' })
    expect(extractSharedUrl(p)).toBe('https://www.instagram.com/reel/abc/')
  })

  it('finds the link inside shared text (Instagram/Facebook on Android)', () => {
    const p = new URLSearchParams({
      text: 'Podívej se na tohle https://www.instagram.com/reel/abc/?igsh=MW1x, super cvičení',
    })
    expect(extractSharedUrl(p)).toBe('https://www.instagram.com/reel/abc/?igsh=MW1x')
  })

  it('returns null when nothing looks like a link', () => {
    expect(extractSharedUrl(new URLSearchParams({ text: 'bez odkazu' }))).toBeNull()
  })
})

describe('cleanSharedUrl', () => {
  it('drops tracking params and fragment, keeps the rest', () => {
    expect(
      cleanSharedUrl('https://www.facebook.com/watch/?v=123&mibextid=abc&utm_source=x#frag')
    ).toBe('https://www.facebook.com/watch/?v=123')
    expect(cleanSharedUrl('https://www.instagram.com/reel/abc/?igsh=MW1x')).toBe(
      'https://www.instagram.com/reel/abc/'
    )
  })
})

describe('getSocialSource', () => {
  it.each([
    ['https://www.instagram.com/p/1/', 'instagram'],
    ['https://m.facebook.com/reel/1', 'facebook'],
    ['https://fb.watch/abc/', 'facebook'],
  ])('%s → %s', (url, expected) => {
    expect(getSocialSource(url)).toBe(expected)
  })

  it.each([
    'http://www.instagram.com/p/1/',
    'https://evilinstagram.com/p/1/',
    'https://instagram.com.evil.example/p/1/',
    'https://www.instagram.com:8443/p/1/',
    'https://youtube.com/watch?v=1',
    'nonsense',
    null,
  ])('rejects %s', (url) => {
    expect(getSocialSource(url)).toBeNull()
  })
})

describe('pending share storage', () => {
  beforeEach(() => sessionStorage.clear())

  it('round-trips and clears', () => {
    expect(hasPendingShare()).toBe(false)
    savePendingShare({ url: 'https://instagram.com/p/1/', text: 'hi' })
    expect(loadPendingShare()).toEqual({ url: 'https://instagram.com/p/1/', text: 'hi' })
    clearPendingShare()
    expect(loadPendingShare()).toBeNull()
  })

  it('ignores garbage', () => {
    sessionStorage.setItem('flotr.pendingShare', '{oops')
    expect(loadPendingShare()).toBeNull()
  })
})

describe('suggestion builders', () => {
  const url = 'https://www.instagram.com/reel/abc/'

  it('bestSourceText falls back from caption to description to shared text', () => {
    const share = { url, text: `Super drill ${url}` }
    expect(bestSourceText({ url, source: 'instagram', caption: 'Cap' }, share)).toBe('Cap')
    expect(bestSourceText({ url, source: 'instagram', description: 'Desc' }, share)).toBe('Desc')
    expect(bestSourceText(undefined, share)).toBe('Super drill')
    expect(bestSourceText(undefined, { url })).toBe('')
  })

  it('manual suggestion uses the first caption line without hashtags, max 50 chars', () => {
    const s = buildManualSuggestion(
      url,
      '#florbal Přihrávky ve trojici s doběhem na branku a střelou z první\n3 hráči',
      'Aktivita z Instagram',
      'Instagram'
    )
    expect(s.name.length).toBeLessThanOrEqual(50)
    expect(s.name.startsWith('Přihrávky ve trojici')).toBe(true)
    expect(s.description).toContain(`Instagram: ${url}`)
    expect(s.description.startsWith('#florbal Přihrávky')).toBe(true)
  })

  it('manual suggestion without caption uses fallback name and just the link', () => {
    const s = buildManualSuggestion(url, '', 'Aktivita z Instagram', 'Instagram')
    expect(s.name).toBe('Aktivita z Instagram')
    expect(s.description).toBe(`Instagram: ${url}`)
  })

  it('withSourceLink appends the link once', () => {
    const base = buildManualSuggestion(url, 'x', 'n', 'Instagram')
    const once = withSourceLink({ ...base, description: 'AI popis' }, url, 'Instagram')
    expect(once.description).toBe(`AI popis\n\nInstagram: ${url}`)
    expect(withSourceLink(once, url, 'Instagram').description).toBe(once.description)
  })

  it('AI criteria fit the 2000-char API limit', () => {
    expect(buildAiCriteria('Prefix', 'a'.repeat(5000)).length).toBe(2000)
  })
})
