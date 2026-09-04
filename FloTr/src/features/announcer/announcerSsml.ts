import { parseAnnouncement } from './announcerParse'

// Builds an Azure AI Speech SSML document from an announcement. Unlike Web Speech,
// Azure neural voices honour <prosody>, <emphasis> and <break>, so the marker DSL
// maps to real prosody markup. The Dynamics slider scales the prosody deltas and
// break lengths; Tempo is an outer <prosody rate>. See docs/announcer.md.

const XML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
}
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => XML_ESCAPES[c])
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))
const pct = (n: number) => `${n >= 0 ? '+' : ''}${Math.round(n)}%`

export interface SsmlOptions {
  /** Voice ShortName, e.g. "cs-CZ-VlastaNeural". */
  voice: string
  /** BCP-47 locale for xml:lang, e.g. "cs-CZ". */
  locale: string
  /** Optional mstts express-as style the voice supports (e.g. "cheerful"). */
  style?: string
  /** Overall speed multiplier (1 = as authored). */
  tempo: number
  /** Marker intensity multiplier (1 = subtle, 3 = theatrical). */
  intensity: number
}

export function buildSsml(input: string, opts: SsmlOptions): string {
  const { voice, locale, style, tempo, intensity } = opts
  const parts: string[] = []

  for (const s of parseAnnouncement(input)) {
    if (s.kind === 'pause') {
      parts.push(`<break time="${Math.round(550 * intensity)}ms"/>`)
      continue
    }
    const t = esc(s.text)
    if (s.kind === 'emphasis') {
      const gap = Math.round(360 * intensity)
      const rate = pct(clamp(-22 * intensity, -60, -5))
      const pitch = pct(clamp(10 * intensity, 0, 40))
      parts.push(
        `<break time="${gap}ms"/><prosody rate="${rate}" pitch="${pitch}">` +
          `<emphasis level="strong">${t}</emphasis></prosody><break time="${gap}ms"/>`
      )
    } else if (s.kind === 'excited') {
      const rate = pct(clamp(12 * intensity, 0, 45))
      const pitch = pct(clamp(12 * intensity, 0, 40))
      parts.push(
        `<prosody rate="${rate}" pitch="${pitch}">${t}!</prosody>` +
          `<break time="${Math.round(180 * intensity)}ms"/>`
      )
    } else if (s.kind === 'chant') {
      const rate = pct(clamp(8 * intensity, 0, 35))
      const pitch = pct(clamp(10 * intensity, 0, 35))
      parts.push(`<prosody rate="${rate}" pitch="${pitch}">${t}!</prosody><break time="140ms"/>`)
    } else {
      parts.push(t + ' ')
    }
  }

  let inner = parts.join('')
  if (Math.abs(tempo - 1) > 0.01) {
    inner = `<prosody rate="${pct((tempo - 1) * 100)}">${inner}</prosody>`
  }
  if (style) {
    inner = `<mstts:express-as style="${esc(style)}">${inner}</mstts:express-as>`
  }

  return (
    '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" ' +
    'xmlns:mstts="https://www.w3.org/2001/mstts" ' +
    `xml:lang="${esc(locale || 'cs-CZ')}"><voice name="${esc(voice)}">${inner}</voice></speak>`
  )
}
