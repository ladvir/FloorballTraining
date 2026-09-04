import { describe, it, expect } from 'vitest'
import { buildSsml } from './announcerSsml'

const opts = { voice: 'cs-CZ-VlastaNeural', locale: 'cs-CZ', tempo: 1, intensity: 1.8 }

describe('buildSsml', () => {
  it('wraps content in a valid speak/voice document', () => {
    const s = buildSsml('Ahoj', opts)
    expect(s.startsWith('<speak ')).toBe(true)
    expect(s).toContain('xml:lang="cs-CZ"')
    expect(s).toContain('<voice name="cs-CZ-VlastaNeural">')
    expect(s.trimEnd().endsWith('</speak>')).toBe(true)
  })

  it('maps the markers to prosody / emphasis / break', () => {
    const s = buildSsml('*Pozor* // T!nadšení!', { ...opts })
    expect(s).toContain('<emphasis level="strong">Pozor</emphasis>')
    expect(s).toContain('<prosody rate=')
    expect(s).toMatch(/<break time="\d+ms"\/>/)
  })

  it('XML-escapes the text', () => {
    const s = buildSsml('Tom & Jerry <3', opts)
    expect(s).toContain('Tom &amp; Jerry &lt;3')
    expect(s).not.toContain('Tom & Jerry')
  })

  it('applies an express-as style when given', () => {
    const s = buildSsml('Vítejte', { ...opts, style: 'cheerful' })
    expect(s).toContain('<mstts:express-as style="cheerful">')
  })

  it('scales break length with intensity', () => {
    const grab = (str: string) => Number(/<break time="(\d+)ms"\/>/.exec(str)?.[1] ?? 0)
    const low = grab(buildSsml('a // b', { ...opts, intensity: 1 }))
    const high = grab(buildSsml('a // b', { ...opts, intensity: 3 }))
    expect(high).toBeGreaterThan(low)
  })
})
