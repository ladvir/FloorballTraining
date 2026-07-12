import { describe, it, expect } from 'vitest'

function buildShareUrl(token: string, baseUrl: string): string {
  return `${baseUrl}/share/${token}`
}

function buildICalUrl(token: string, apiBaseUrl: string): string {
  return `${apiBaseUrl}/public/calendar/${token}.ics`
}

describe('calendar share URL helpers', () => {
  const token = 'abc123def456'
  const base = 'https://app.flotr.cz'
  const api = 'https://api.flotr.cz'

  it('buildShareUrl returns correct share URL', () => {
    expect(buildShareUrl(token, base)).toBe(`${base}/share/${token}`)
  })

  it('buildShareUrl embeds token correctly', () => {
    const url = buildShareUrl('deadbeef', 'http://localhost:3000')
    expect(url).toBe('http://localhost:3000/share/deadbeef')
  })

  it('buildICalUrl returns correct iCal URL', () => {
    expect(buildICalUrl(token, api)).toBe(`${api}/public/calendar/${token}.ics`)
  })

  it('buildICalUrl ends with .ics', () => {
    const url = buildICalUrl('mytoken', 'https://api.flotr.cz')
    expect(url.endsWith('.ics')).toBe(true)
  })
})
