import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { announcerTtsApi } from '../../api'
import { parseAnnouncement } from './announcerParse'
import { buildSsml } from './announcerSsml'

export interface VoiceOption {
  id: string
  label: string
}

export type AnnouncerEngine = 'browser' | 'azure'

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
const INTENSITY_KEY = 'flotr.announcer.intensity'
const ENGINE_KEY = 'flotr.announcer.engine'
const AZ_VOICE_KEY = 'flotr.announcer.azureVoice'
const AZ_STYLE_KEY = 'flotr.announcer.azureStyle'

/** Dynamics slider range: 1 = as authored, 3 = pushed hard. Default is already strong. */
export const INTENSITY_MIN = 1
export const INTENSITY_MAX = 3
const INTENSITY_DEFAULT = 1.8

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

const errText = (e: unknown): string => {
  const r = (e as { response?: { data?: unknown } })?.response?.data
  if (typeof r === 'string' && r) return r
  return (e as Error)?.message || 'Chyba převodu textu na řeč.'
}

/** Locale (xml:lang) from an Azure voice ShortName, e.g. "cs-CZ-VlastaNeural" → "cs-CZ". */
const localeOf = (shortName: string) => shortName.split('-').slice(0, 2).join('-') || 'cs-CZ'

/**
 * Playback for the announcer page, with two interchangeable engines:
 *  - `browser`: Web Speech API — free, offline, marker dynamics faked via rate/pitch/silence.
 *  - `azure`: our /announcer/tts proxy to Azure AI Speech — neural voices, real SSML prosody.
 * The engine switch is the only thing that changes; every caller uses the same `speak()`.
 */
export function useAnnouncer() {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voiceId, setVoiceId] = useState<string>(() => readLS(VOICE_KEY) ?? '')
  const [tempo, setTempo] = useState<number>(() => Number(readLS(TEMPO_KEY)) || 1)
  const [intensity, setIntensity] = useState<number>(
    () => Number(readLS(INTENSITY_KEY)) || INTENSITY_DEFAULT
  )
  const [engine, setEngine] = useState<AnnouncerEngine>(() =>
    readLS(ENGINE_KEY) === 'azure' ? 'azure' : 'browser'
  )
  const [azureVoice, setAzureVoice] = useState<string>(() => readLS(AZ_VOICE_KEY) ?? '')
  const [azureStyle, setAzureStyle] = useState<string>(() => readLS(AZ_STYLE_KEY) ?? '')
  const [azureError, setAzureError] = useState<string | null>(null)

  const [speaking, setSpeaking] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const genRef = useRef(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)

  useEffect(() => {
    if (!synth) return
    const load = () => setVoices(synth.getVoices())
    load()
    synth.addEventListener('voiceschanged', load)
    return () => synth.removeEventListener('voiceschanged', load)
  }, [synth])

  const isCzech = (v: SpeechSynthesisVoice) => /^cs/i.test(v.lang) || /czech|česk/i.test(v.name)
  const isNatural = (v: SpeechSynthesisVoice) => /natural|neural|online/i.test(v.name)

  const csVoices = useMemo(() => voices.filter(isCzech), [voices])

  // All installed voices, Czech first, then the "natural/neural/online" ones (the interesting,
  // more expressive voices), then the rest — each with the 3 pitch/rate variants.
  const options: VoiceOption[] = useMemo(() => {
    const ranked = [...voices].sort((a, b) => {
      const rank = (v: SpeechSynthesisVoice) => (isCzech(v) ? 0 : isNatural(v) ? 1 : 2)
      return rank(a) - rank(b) || a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name)
    })
    return ranked.flatMap((v) =>
      VARIANTS.map(([suffix, p, r]) => {
        const base = v.name.replace(/^Microsoft /, '')
        const tag = isCzech(v) ? '' : ` (${v.lang})`
        return { id: `${v.name}|${p}|${r}`, label: base + tag + (suffix ? ` · ${suffix}` : '') }
      })
    )
  }, [voices])

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
  useEffect(() => {
    writeLS(INTENSITY_KEY, String(intensity))
  }, [intensity])
  useEffect(() => {
    writeLS(ENGINE_KEY, engine)
  }, [engine])
  useEffect(() => {
    writeLS(AZ_VOICE_KEY, azureVoice)
  }, [azureVoice])
  useEffect(() => {
    writeLS(AZ_STYLE_KEY, azureStyle)
  }, [azureStyle])

  // Chrome silently stops speech after ~15 s and sometimes never fires `onend`;
  // a periodic resume() while speaking is the standard workaround.
  useEffect(() => {
    if (!synth || !speaking || engine !== 'browser') return
    const id = window.setInterval(() => {
      if (synth.speaking) synth.resume()
    }, 8000)
    return () => window.clearInterval(id)
  }, [synth, speaking, engine])

  const releaseAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }
  }, [])

  // Clear any wedged state left by a previous page (Chrome bug) + on unmount.
  useEffect(() => {
    synth?.cancel()
    return () => {
      synth?.cancel()
      releaseAudio()
    }
  }, [synth, releaseAudio])

  const stop = useCallback(() => {
    genRef.current++
    synth?.cancel()
    releaseAudio()
    setSpeaking(false)
    setActiveIndex(-1)
  }, [synth, releaseAudio])

  const speakBrowser = useCallback(
    (text: string, from: number) => {
      if (!synth) return
      const queue = parseAnnouncement(text)
      if (!queue.length) return

      const myGen = ++genRef.current
      synth.cancel()

      const [name, p, r] = (voiceId || '').split('|')
      const voice = voices.find((v) => v.name === name) || null
      const pitchAdj = parseFloat(p) || 1
      const rateAdj = (parseFloat(r) || 1) * tempo

      // The dynamics slider widens each segment's deviation from neutral.
      const shape = (base: number) => 1 + (base - 1) * intensity
      const gap = (ms: number | undefined) => Math.round((ms ?? 0) * intensity)
      // Duck the body a touch so marked phrases pop louder (only when there's contrast to show).
      const hasDynamics = queue.some((s) => s.kind !== 'plain' && s.kind !== 'pause')
      const plainVolume = hasDynamics ? clamp(1 - 0.12 * intensity, 0.55, 1) : 1

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
          window.setTimeout(next, gap(seg.pauseMs ?? 500))
          return
        }
        const after = () => {
          const g = gap(seg.gapAfterMs)
          if (g) window.setTimeout(next, g)
          else next()
        }
        // `safeRate` = a rate the engine is guaranteed to accept; some voices error
        // (and would then be silently skipped) on the extremes the slider can reach.
        const go = (safeRate = false) => {
          if (myGen !== genRef.current) return
          const u = new SpeechSynthesisUtterance(seg.speak ?? seg.text)
          if (voice) {
            u.voice = voice
            u.lang = voice.lang
          } else {
            u.lang = 'cs-CZ'
          }
          // Floor 0.5 keeps a heavily-slowed emphasis intelligible; ceiling 2.0 is
          // Chrome's real max — asking above it makes some voices drop the utterance.
          u.rate = safeRate
            ? clamp(rateAdj * (seg.rate > 1 ? 1.3 : 0.8), 0.6, 1.6)
            : clamp(rateAdj * shape(seg.rate), 0.5, 2.0)
          u.pitch = clamp(pitchAdj * shape(seg.pitch), 0, 2)
          u.volume = seg.kind === 'plain' ? plainVolume : 1
          let done = false
          u.onend = () => {
            if (done) return
            done = true
            after()
          }
          u.onerror = () => {
            if (done) return
            done = true
            // First failure at an extreme rate → retry once at a conservative rate so
            // the phrase is never lost. Second failure → give up and move on.
            if (!safeRate) go(true)
            else after()
          }
          synth.speak(u)
        }
        const before = gap(seg.gapBeforeMs)
        if (before) window.setTimeout(() => go(), before)
        else go()
      }
      window.setTimeout(next, 50) // Chrome drops the first utterance right after cancel()
    },
    [synth, voiceId, voices, tempo, intensity]
  )

  const speakAzure = useCallback(
    async (text: string) => {
      if (!azureVoice) {
        setAzureError('Vyberte hlas.')
        return
      }
      const myGen = ++genRef.current
      synth?.cancel()
      releaseAudio()
      setAzureError(null)
      setActiveIndex(-1)
      setSpeaking(true)

      const ssml = buildSsml(text, {
        voice: azureVoice,
        locale: localeOf(azureVoice),
        style: azureStyle || undefined,
        tempo,
        intensity,
      })

      try {
        const blob = await announcerTtsApi.speak(ssml)
        if (myGen !== genRef.current) return
        const url = URL.createObjectURL(blob)
        audioUrlRef.current = url
        const a = audioRef.current ?? (audioRef.current = new Audio())
        a.src = url
        a.onended = () => {
          if (myGen === genRef.current) setSpeaking(false)
          releaseAudio()
        }
        a.onerror = () => {
          if (myGen === genRef.current) {
            setSpeaking(false)
            setAzureError('Přehrávání se nezdařilo.')
          }
          releaseAudio()
        }
        await a.play()
      } catch (e) {
        if (myGen === genRef.current) {
          setSpeaking(false)
          setAzureError(errText(e))
        }
      }
    },
    [azureVoice, azureStyle, tempo, intensity, synth, releaseAudio]
  )

  /**
   * Speak `text`. `from` (segment index, for "play from here") only applies to the browser
   * engine — Azure renders the whole announcement in one request.
   */
  const speak = useCallback(
    (text: string, from = 0) => {
      if (engine === 'azure') void speakAzure(text)
      else speakBrowser(text, from)
    },
    [engine, speakAzure, speakBrowser]
  )

  return {
    // engine
    engine,
    setEngine,
    // browser engine
    supported: !!synth,
    hasCzechVoice: csVoices.length > 0,
    options,
    voiceId,
    setVoiceId,
    // azure engine
    azureVoice,
    setAzureVoice,
    azureStyle,
    setAzureStyle,
    azureError,
    // shared
    tempo,
    setTempo,
    intensity,
    setIntensity,
    speaking,
    activeIndex,
    speak,
    stop,
  }
}
