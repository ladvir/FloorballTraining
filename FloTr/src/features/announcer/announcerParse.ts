// Ported from the standalone "Hlasatel" PWA (c:\Claude\hlasatel\parse.js).
//
// Authoring markers control delivery. Wrap a phrase in a matched pair; the inner
// text may not start or end with a space, so a lone "!" as sentence punctuation
// is NOT a marker.
//   *emphasis*    -> slower, higher pitch
//   !excited!     -> faster, much higher pitch
//   ALLCAPS (3+)  -> chant: fast, high pitch, lowercased
//   //            -> explicit pause (also [pauza] / [pause])
// Volume is always max — the Web Speech API caps it at 1.0.

export type SegmentKind = 'plain' | 'emphasis' | 'excited' | 'chant' | 'pause'

export interface Segment {
  /** Text handed to the synthesizer (already lowercased for a chant). Empty for a pause. */
  text: string
  kind: SegmentKind
  rate: number
  pitch: number
  /** kind === 'pause' only: silent gap in milliseconds. */
  pauseMs?: number
}

/** Delivery profiles — the single place to tune the dynamics. */
export const DYNAMICS: Record<'emphasis' | 'excited' | 'chant', { rate: number; pitch: number }> = {
  emphasis: { rate: 0.82, pitch: 1.45 },
  excited: { rate: 1.35, pitch: 1.75 },
  chant: { rate: 1.25, pitch: 1.55 },
}

const PAUSE_MS = 550
/** Split anything longer than this so Chrome's ~15 s TTS cutoff can't truncate a segment. */
const MAX_CHARS = 200

const TOKEN = /(\*(?!\s)[^*\n]*?(?<!\s)\*|!(?!\s)[^!\n]*?(?<!\s)!|\p{Lu}{3,}(?:\s+\p{Lu}{3,})*)/gu
const PAUSE = /\/\/|\[pauz[ae]\]|\[pause\]/gi

function hardWrap(s: string): string[] {
  const out: string[] = []
  let buf = ''
  for (const w of s.split(/\s+/)) {
    if (buf && (buf + ' ' + w).length > MAX_CHARS) {
      out.push(buf)
      buf = w
    } else {
      buf = buf ? buf + ' ' + w : w
    }
  }
  if (buf) out.push(buf)
  return out
}

/** Sentence-split, then break over-long punctuation-free runs on clause boundaries, then on words. */
function splitForTts(text: string): string[] {
  const parts: string[] = []
  for (const sentence of text.split(/(?<=[.!?…])\s+/)) {
    if (sentence.length <= MAX_CHARS) {
      parts.push(sentence)
      continue
    }
    let buf = ''
    for (const clause of sentence.split(/(?<=[,;–—])\s+/)) {
      if (buf && (buf + ' ' + clause).length > MAX_CHARS) {
        parts.push(buf.trim())
        buf = clause
      } else {
        buf = buf ? buf + ' ' + clause : clause
      }
    }
    if (buf.trim()) parts.push(buf.trim())
  }
  return parts.flatMap((s) => (s.length <= MAX_CHARS * 1.5 ? [s] : hardWrap(s)))
}

function pushPlain(text: string, out: Segment[]): void {
  for (const part of splitForTts(text)) {
    const s = part.trim()
    if (s) out.push({ text: s, kind: 'plain', rate: 1, pitch: 1 })
  }
}

function parseChunk(input: string, out: Segment[]): void {
  let last = 0
  let m: RegExpExecArray | null
  TOKEN.lastIndex = 0
  while ((m = TOKEN.exec(input))) {
    if (m.index > last) pushPlain(input.slice(last, m.index), out)
    const s = m[0]
    if (s[0] === '*') out.push({ text: s.slice(1, -1), kind: 'emphasis', ...DYNAMICS.emphasis })
    else if (s[0] === '!') out.push({ text: s.slice(1, -1), kind: 'excited', ...DYNAMICS.excited })
    else
      out.push({
        text: s.replace(/\s+/g, ' ').trim().toLowerCase(),
        kind: 'chant',
        ...DYNAMICS.chant,
      })
    last = m.index + s.length
  }
  if (last < input.length) pushPlain(input.slice(last), out)
}

/** Tokenize an announcement into an ordered queue of delivery segments. */
export function parseAnnouncement(input: string): Segment[] {
  const out: Segment[] = []
  let last = 0
  let m: RegExpExecArray | null
  PAUSE.lastIndex = 0
  while ((m = PAUSE.exec(input))) {
    parseChunk(input.slice(last, m.index), out)
    out.push({ text: '', kind: 'pause', rate: 1, pitch: 1, pauseMs: PAUSE_MS })
    last = m.index + m[0].length
  }
  parseChunk(input.slice(last), out)
  return out.filter((x) => x.kind === 'pause' || x.text.trim())
}
