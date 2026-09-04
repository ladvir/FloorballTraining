// Ported from the standalone "Hlasatel" PWA (c:\Claude\hlasatel\parse.js).
//
// Authoring markers control delivery. Wrap a phrase in a matched pair; the inner
// text may not start or end with a space, so a lone "!" as sentence punctuation
// is NOT a marker.
//   *emphasis*    -> slow + isolated by silence, said deliberately
//   !excited!     -> fast + higher, "!" forced so the engine adds excitement
//   ALLCAPS (3+)  -> chant: each word punched out staccato, "!" per word, lowercased
//   //            -> explicit pause (also [pauza] / [pause])
//
// Web Speech honours `rate` on almost every voice but many neural voices ignore
// `pitch` and clamp `rate` to a narrow band — so the *audible* dynamics come from
// (a) big rate contrast, (b) real silence framing each marked phrase, and
// (c) reshaping the spoken string (trailing "," / "!", per-word chant) so the
// engine's own prosody model does the work. `pitch` is still set as a bonus.

export type SegmentKind = 'plain' | 'emphasis' | 'excited' | 'chant' | 'pause'

export interface Segment {
  /** Text shown in the preview. */
  text: string
  /** String actually handed to the synthesizer, when it differs from `text`. */
  speak?: string
  kind: SegmentKind
  rate: number
  pitch: number
  /** kind === 'pause' only: silent gap in milliseconds. */
  pauseMs?: number
  /** Silence inserted before / after this segment (scaled by the Dynamics slider). */
  gapBeforeMs?: number
  gapAfterMs?: number
}

/** Delivery profiles — the single place to tune the dynamics. */
export const DYNAMICS: Record<
  'emphasis' | 'excited' | 'chant',
  { rate: number; pitch: number; gapBeforeMs: number; gapAfterMs: number }
> = {
  emphasis: { rate: 0.6, pitch: 1.6, gapBeforeMs: 380, gapAfterMs: 380 },
  excited: { rate: 1.45, pitch: 1.9, gapBeforeMs: 110, gapAfterMs: 220 },
  chant: { rate: 1.45, pitch: 1.75, gapBeforeMs: 200, gapAfterMs: 240 },
}
/** Gap between the words of a chant and between the clauses of a marked phrase. */
const CHANT_WORD_GAP = 140
const CLAUSE_GAP = 90

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

/** Split a phrase on comma/semicolon/dash/colon boundaries, keeping the delimiter attached. */
function clauseSplit(s: string): string[] {
  return s
    .split(/(?<=[,;:–—])\s+/)
    .map((x) => x.trim())
    .filter(Boolean)
}

/**
 * A `*…*` or `!…!` phrase. Long / multi-clause phrases are broken into one segment per
 * clause (each also length-capped for the TTS cutoff) so the engine never has to render a
 * long string at an extreme rate in one go — that was silently dropping whole phrases.
 */
function pushShaped(kind: 'emphasis' | 'excited', inner: string, out: Segment[]): void {
  const d = DYNAMICS[kind]
  const chunks = clauseSplit(inner)
    .flatMap((c) => splitForTts(c))
    .map((c) => c.trim())
    .filter(Boolean)
  chunks.forEach((chunk, i) => {
    const first = i === 0
    const last = i === chunks.length - 1
    const speak =
      kind === 'excited'
        ? chunk.replace(/[,;:–—]?$/, '') + '!' // every burst punched out
        : /[.,;:!?…]$/.test(chunk)
          ? chunk
          : chunk + ',' // trailing comma → the engine keeps slowing & stressing
    out.push({
      text: chunk,
      speak: speak === chunk ? undefined : speak,
      kind,
      rate: d.rate,
      pitch: d.pitch,
      gapBeforeMs: first ? d.gapBeforeMs : CLAUSE_GAP,
      gapAfterMs: last ? d.gapAfterMs : CLAUSE_GAP,
    })
  })
}

function pushChant(raw: string, out: Segment[]): void {
  const d = DYNAMICS.chant
  const words = raw.replace(/\s+/g, ' ').trim().toLowerCase().split(' ').filter(Boolean)
  words.forEach((w, i) => {
    out.push({
      text: w,
      speak: `${w}!`, // punched out, one word at a time
      kind: 'chant',
      rate: d.rate,
      pitch: d.pitch,
      // Only the leading edge carries the block gap; inner words are spaced by the
      // previous word's gapAfter alone (no double-count between words).
      gapBeforeMs: i === 0 ? d.gapBeforeMs : 0,
      gapAfterMs: i === words.length - 1 ? d.gapAfterMs : CHANT_WORD_GAP,
    })
  })
}

function parseChunk(input: string, out: Segment[]): void {
  let last = 0
  let m: RegExpExecArray | null
  TOKEN.lastIndex = 0
  while ((m = TOKEN.exec(input))) {
    if (m.index > last) pushPlain(input.slice(last, m.index), out)
    const s = m[0]
    if (s[0] === '*') pushShaped('emphasis', s.slice(1, -1), out)
    else if (s[0] === '!') pushShaped('excited', s.slice(1, -1), out)
    else pushChant(s, out)
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
