import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { parseAnnouncement } from './announcerParse'

export interface VoiceOption {
  id: string
  label: string
}

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))

// base | higher | lower — a cheap "second announcer" without installing more OS voices.
// [labelSuffix, pitchFactor, rateFactor]
const VARIANTS: readonly (readonly [string, number, number])[] = [
  ['', 1, 1],
  ['higher', 1.3, 1],
  ['lower', 0.8, 1.05],
]

const VOICE_KEY = 'flotr.announcer.voice'
const TEMPO_KEY = 'flotr.announcer.tempo'

const readLS = (k: string) => {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
const writeLS = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v)
  } catch {
    /* private mode / disabled */
  }
}

/**
 * Web Speech wrapper for the announcer page. Czech voices only (+ 3 pitch/rate
 * variants), a global tempo multiplier, karaoke `activeIndex`, and the usual
 * Chrome workarounds (cancel-on-mount, 50 ms first-utterance delay, resume heartbeat).
 */
export function useAnnouncer() {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voiceId, setVoiceId] = useState<string>(() => readLS(VOICE_KEY) ?? '')
  const [tempo, setTempo] = useState<number>(() => Number(readLS(TEMPO_KEY)) || 1)
  const [speaking, setSpeaking] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const genRef = useRef(0)

  useEffect(() => {
    if (!synth) return
    const load = () => setVoices(synth.getVoices())
    load()
    synth.addEventListener('voiceschanged', load)
    return () => synth.removeEventListener('voiceschanged', load)
  }, [synth])

  const csVoices = useMemo(
    () =>
      voices
        .filter((v) => /^cs/i.test(v.lang) || /czech|česk/i.test(v.name))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [voices]
  )

  const options: VoiceOption[] = useMemo(
    () =>
      csVoices.flatMap((v) =>
        VARIANTS.map(([suffix, p, r]) => ({
          id: `${v.name}|${p}|${r}`,
          label: v.name.replace(/^Microsoft /, '') + (suffix ? ` · ${suffix}` : ''),
        }))
      ),
    [csVoices]
  )

  // Keep the selection valid as voices arrive.
  useEffect(() => {
    if (options.length && !options.some((o) => o.id === voiceId)) setVoiceId(options[0].id)
  }, [options, voiceId])

  useEffect(() => {
    if (voiceId) writeLS(VOICE_KEY, voiceId)
  }, [voiceId])
  useEffect(() => {
    writeLS(TEMPO_KEY, String(tempo))
  }, [tempo])

  // Chrome silently stops speech after ~15 s and sometimes never fires `onend`;
  // a periodic resume() while speaking is the standard workaround.
  useEffect(() => {
    if (!synth || !speaking) return
    const id = window.setInterval(() => {
      if (synth.speaking) synth.resume()
    }, 8000)
    return () => window.clearInterval(id)
  }, [synth, speaking])

  // Clear any wedged state left by a previous page (Chrome bug) + on unmount.
  useEffect(() => {
    synth?.cancel()
    return () => synth?.cancel()
  }, [synth])

  const stop = useCallback(() => {
    genRef.current++
    synth?.cancel()
    setSpeaking(false)
    setActiveIndex(-1)
  }, [synth])

  /** Speak `text`, optionally starting from segment index `from` (for "play from here"). */
  const speak = useCallback(
    (text: string, from = 0) => {
      if (!synth) return
      const queue = parseAnnouncement(text)
      if (!queue.length) return

      const myGen = ++genRef.current
      synth.cancel()

      const [name, p, r] = (voiceId || '').split('|')
      const voice = voices.find((v) => v.name === name) || null
      const pitchAdj = parseFloat(p) || 1
      const rateAdj = (parseFloat(r) || 1) * tempo

      setSpeaking(true)
      let i = clamp(from, 0, queue.length - 1)

      const next = () => {
        if (myGen !== genRef.current) return // superseded or stopped
        if (i >= queue.length) {
          setSpeaking(false)
          setActiveIndex(-1)
          return
        }
        const idx = i++
        const seg = queue[idx]
        setActiveIndex(idx)
        if (seg.kind === 'pause') {
          window.setTimeout(next, seg.pauseMs ?? 500)
          return
        }
        const u = new SpeechSynthesisUtterance(seg.text)
        if (voice) {
          u.voice = voice
          u.lang = voice.lang
        } else {
          u.lang = 'cs-CZ'
        }
        u.rate = clamp(rateAdj * seg.rate, 0.1, 3)
        u.pitch = clamp(pitchAdj * seg.pitch, 0, 2)
        u.volume = 1 // Web Speech caps here
        u.onend = next
        u.onerror = next
        synth.speak(u)
      }
      window.setTimeout(next, 50) // Chrome drops the first utterance right after cancel()
    },
    [synth, voiceId, voices, tempo]
  )

  return {
    supported: !!synth,
    hasCzechVoice: csVoices.length > 0,
    options,
    voiceId,
    setVoiceId,
    tempo,
    setTempo,
    speaking,
    activeIndex,
    speak,
    stop,
  }
}
