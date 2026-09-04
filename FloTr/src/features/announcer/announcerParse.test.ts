import { describe, it, expect } from 'vitest'
import { parseAnnouncement } from './announcerParse'

describe('parseAnnouncement', () => {
  it('splits plain text and applies the three dynamic markers', () => {
    const seg = parseAnnouncement('Vítejte. *Pozor* na dráhu a !nadšení! a GÓÓÓL')
    expect(seg[0].text.trim()).toBe('Vítejte.')
    expect(seg.some((s) => s.text === 'Pozor' && s.kind === 'emphasis' && s.pitch > 1.3)).toBe(true)
    expect(seg.some((s) => s.text === 'nadšení' && s.kind === 'excited' && s.pitch > 1.6)).toBe(
      true
    )
    expect(
      seg.some((s) => /g[óo]+l/.test(s.text) && s.kind === 'chant' && s.rate > 1 && s.pitch > 1.4)
    ).toBe(true)
  })

  it('does not treat a bare exclamation mark as a marker', () => {
    const p = parseAnnouncement('Pozor! Změna!')
    expect(p).toHaveLength(2)
    expect(p.every((s) => s.pitch === 1 && s.kind === 'plain')).toBe(true)
  })

  it('keeps underscores as literal text', () => {
    const u = parseAnnouncement('teplota _25_ stupňů')
    expect(u.every((s) => s.pitch === 1)).toBe(true)
    expect(u.some((s) => s.text.includes('_25_'))).toBe(true)
  })

  it('emits a pause segment for // and [pauza]', () => {
    const seg = parseAnnouncement('První // druhý [pauza] třetí')
    expect(seg.filter((s) => s.kind === 'pause')).toHaveLength(2)
    expect(seg.find((s) => s.kind === 'pause')?.pauseMs).toBeGreaterThan(0)
  })

  it('breaks an over-long punctuation-free run into TTS-safe chunks', () => {
    const long = 'slovo '.repeat(80).trim() // ~480 chars, no sentence punctuation
    const seg = parseAnnouncement(long)
    expect(seg.length).toBeGreaterThan(1)
    expect(seg.every((s) => s.text.length <= 220)).toBe(true)
  })

  it('frames a marked phrase with silence and reshapes the spoken string', () => {
    const [emph] = parseAnnouncement('*Pozor*')
    expect(emph.gapBeforeMs).toBeGreaterThan(0)
    expect(emph.gapAfterMs).toBeGreaterThan(0)
    expect(emph.speak).toBe('Pozor,') // trailing comma -> engine slows & stresses

    const [exc] = parseAnnouncement('!teď!')
    expect(exc.speak).toBe('teď!') // forced exclamation
    expect(exc.gapAfterMs).toBeGreaterThan(0)
  })

  it('breaks a chant into one punched-out segment per word', () => {
    const seg = parseAnnouncement('HRAJEME HRAJEME')
    expect(seg).toHaveLength(2)
    expect(seg.every((s) => s.kind === 'chant' && s.speak === `${s.text}!`)).toBe(true)
    expect(seg[0].text).toBe('hrajeme')
    expect(seg[0].gapAfterMs).toBeGreaterThan(0)
  })
})
