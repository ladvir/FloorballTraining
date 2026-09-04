import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Play, Square, Trash2, Save, Upload } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { cn } from '../../utils/cn'
import { parseAnnouncement, type SegmentKind } from './announcerParse'
import { useAnnouncer, INTENSITY_MIN, INTENSITY_MAX } from './useAnnouncer'

const LIB_KEY = 'flotr.announcer.lib'
const ROSTER_KEY = (team: 'home' | 'away') => `flotr.announcer.roster.${team}`

interface LibItem {
  t: string
  x: string
}

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
    /* ignore */
  }
}
const getLib = (): LibItem[] => {
  try {
    return JSON.parse(readLS(LIB_KEY) || '[]')
  } catch {
    return []
  }
}

// Preview tint per dynamic — FloTr palette, styled to hint at how it will sound.
const KIND_CLASS: Record<SegmentKind, string> = {
  plain: 'text-gray-700',
  emphasis: 'bg-sky-100 text-sky-800 font-semibold tracking-wide',
  excited: 'bg-amber-100 text-amber-800 font-bold italic',
  chant: 'bg-violet-100 text-violet-800 font-bold uppercase tracking-tight',
  pause: 'bg-gray-100 text-gray-400',
}

export function AnnouncerPage() {
  const { t } = useTranslation()
  const {
    supported,
    hasCzechVoice,
    options,
    voiceId,
    setVoiceId,
    tempo,
    setTempo,
    intensity,
    setIntensity,
    speaking,
    activeIndex,
    speak,
    stop,
  } = useAnnouncer()

  const textRef = useRef<HTMLTextAreaElement>(null)
  const [text, setText] = useState('')

  // Rosters
  const [home, setHome] = useState(() => readLS(ROSTER_KEY('home')) || '')
  const [away, setAway] = useState(() => readLS(ROSTER_KEY('away')) || '')

  const rosterSpeech = useCallback(
    (team: 'home' | 'away') => {
      const lines = (team === 'home' ? home : away)
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
      if (!lines.length) return `${t(team === 'home' ? 'announcer.home' : 'announcer.away')}: — `
      return lines.join('.\n') + '. '
    },
    [home, away, t]
  )

  const expandedText = useMemo(
    () =>
      text
        .replace(/\[DOMÁCÍ\]/gi, () => rosterSpeech('home'))
        .replace(/\[HOSTÉ\]/gi, () => rosterSpeech('away')),
    [text, rosterSpeech]
  )

  const segments = useMemo(() => parseAnnouncement(expandedText), [expandedText])

  // Library
  const [lib, setLib] = useState<LibItem[]>(getLib)
  useEffect(() => writeLS(LIB_KEY, JSON.stringify(lib)), [lib])

  // ── textarea editing helpers (toolbar + shortcuts) ──────────────────────────
  const wrapSel = useCallback((mark: string) => {
    const el = textRef.current
    if (!el) return
    const s = el.selectionStart
    const e = el.selectionEnd
    const sel = el.value.slice(s, e) || 'text'
    setText(el.value.slice(0, s) + mark + sel + mark + el.value.slice(e))
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(s + mark.length, s + mark.length + sel.length)
    })
  }, [])

  const upperSel = useCallback(() => {
    const el = textRef.current
    if (!el) return
    const s = el.selectionStart
    const e = el.selectionEnd
    if (s === e) return
    setText(el.value.slice(0, s) + el.value.slice(s, e).toUpperCase() + el.value.slice(e))
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(s, e)
    })
  }, [])

  const insertText = useCallback((str: string) => {
    const el = textRef.current
    if (!el) return
    const s = el.selectionStart
    const e = el.selectionEnd
    setText(el.value.slice(0, s) + str + el.value.slice(e))
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(s + str.length, s + str.length)
    })
  }, [])

  const onKeyDown = (ev: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(ev.ctrlKey || ev.metaKey) || ev.altKey || ev.shiftKey) return
    const k = ev.key.toLowerCase()
    if (k === 'b') {
      ev.preventDefault()
      wrapSel('*')
    } else if (k === 'i') {
      ev.preventDefault()
      wrapSel('!')
    } else if (k === 'k') {
      ev.preventDefault()
      upperSel()
    }
  }

  const readNow = () => {
    const trimmed = expandedText.trim()
    if (trimmed) speak(trimmed)
  }

  const saveToLibrary = () => {
    const x = text.trim()
    if (!x) return
    const name = (
      window.prompt(t('announcer.namePrompt'), x.slice(0, 40).replace(/\s+/g, ' ')) || ''
    ).trim()
    if (!name) return
    setLib((a) => [...a, { t: name, x }])
  }

  const loadRosterFile = async (team: 'home' | 'away', file: File) => {
    const content = await file.text()
    if (team === 'home') {
      setHome(content)
      writeLS(ROSTER_KEY('home'), content)
    } else {
      setAway(content)
      writeLS(ROSTER_KEY('away'), content)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t('announcer.title')} description={t('announcer.subtitle')} />

      {!supported && (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <CardContent className="text-sm text-amber-800">{t('announcer.unsupported')}</CardContent>
        </Card>
      )}
      {supported && !hasCzechVoice && (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <CardContent className="text-sm text-amber-800">{t('announcer.noVoice')}</CardContent>
        </Card>
      )}

      {/* Voice + tempo + dynamics */}
      <Card className="mb-4">
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">{t('announcer.voice')}</span>
            <select
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              {options.length === 0 && <option value="">—</option>}
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">
              {t('announcer.tempo')} · {tempo.toFixed(2)}×
            </span>
            <input
              type="range"
              min={0.7}
              max={1.4}
              step={0.05}
              value={tempo}
              onChange={(e) => setTempo(Number(e.target.value))}
              className="mt-2 w-full accent-sky-500"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">
              {t('announcer.dynamics')} · {intensity.toFixed(1)}×
            </span>
            <input
              type="range"
              min={INTENSITY_MIN}
              max={INTENSITY_MAX}
              step={0.1}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="mt-2 w-full accent-sky-500"
            />
            <span className="text-xs text-gray-400">{t('announcer.dynamicsHint')}</span>
          </label>
        </CardContent>
      </Card>

      {/* Help / legend */}
      <details className="mb-4 rounded-xl border border-gray-200 bg-white shadow-sm">
        <summary className="cursor-pointer px-6 py-3 text-sm font-medium text-gray-700">
          {t('announcer.helpTitle')}
        </summary>
        <div className="space-y-1.5 px-6 pb-4 text-sm text-gray-600">
          <p>
            <code className="rounded bg-sky-100 px-1 text-sky-800">*text*</code> —{' '}
            {t('announcer.help.emphasis')}{' '}
            <kbd className="rounded border px-1 text-xs">Ctrl/⌘+B</kbd>
          </p>
          <p>
            <code className="rounded bg-amber-100 px-1 text-amber-800">!text!</code> —{' '}
            {t('announcer.help.excited')}{' '}
            <kbd className="rounded border px-1 text-xs">Ctrl/⌘+I</kbd>
          </p>
          <p>
            <code className="rounded bg-violet-100 px-1 text-violet-800">VELKÁ</code> —{' '}
            {t('announcer.help.chant')} <kbd className="rounded border px-1 text-xs">Ctrl/⌘+K</kbd>
          </p>
          <p>
            <code className="rounded bg-gray-100 px-1">//</code> — {t('announcer.help.pause')}
          </p>
          <p>
            <code className="rounded bg-gray-100 px-1">[DOMÁCÍ]</code> /{' '}
            <code className="rounded bg-gray-100 px-1">[HOSTÉ]</code> — {t('announcer.help.home')} /{' '}
            {t('announcer.help.away')}
          </p>
          <p className="pt-1 text-xs text-gray-400">{t('announcer.help.note')}</p>
        </div>
      </details>

      {/* Text + toolbar */}
      <label className="mb-1 block text-sm font-medium text-gray-700">{t('announcer.text')}</label>
      <div className="mb-2 flex flex-wrap gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => wrapSel('*')}
          title={t('announcer.toolbar.emphasis')}
        >
          *A*
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => wrapSel('!')}
          title={t('announcer.toolbar.excited')}
        >
          !A!
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={upperSel}
          title={t('announcer.toolbar.chant')}
        >
          AA
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => insertText(' // ')}
          title={t('announcer.toolbar.pause')}
        >
          //
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => insertText('[DOMÁCÍ]')}>
          [DOMÁCÍ]
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => insertText('[HOSTÉ]')}>
          [HOSTÉ]
        </Button>
      </div>

      <textarea
        ref={textRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        rows={5}
        placeholder={t('announcer.textPlaceholder')}
        className="w-full resize-y rounded-lg border border-gray-300 bg-white p-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
      />

      {/* Karaoke preview */}
      {segments.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">
            {t('announcer.preview')}
          </p>
          <div className="flex flex-wrap gap-1 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm leading-7">
            {segments.map((seg, i) => (
              <button
                key={i}
                type="button"
                onClick={() => speak(expandedText, i)}
                className={cn(
                  'rounded px-1 transition-shadow',
                  KIND_CLASS[seg.kind],
                  i === activeIndex && 'ring-2 ring-sky-500 ring-offset-1'
                )}
                title={t('announcer.playFromHere')}
              >
                {seg.kind === 'pause' ? '‖' : seg.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={readNow} disabled={!supported || speaking || !segments.length}>
          <Play className="h-4 w-4" />
          {t('announcer.read')}
        </Button>
        <Button variant="outline" onClick={stop} disabled={!speaking}>
          <Square className="h-4 w-4" />
          {t('announcer.stop')}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setText('')
            textRef.current?.focus()
          }}
        >
          <Trash2 className="h-4 w-4" />
          {t('announcer.clear')}
        </Button>
        <Button variant="ghost" onClick={saveToLibrary} disabled={!text.trim()}>
          <Save className="h-4 w-4" />
          {t('announcer.saveToLibrary')}
        </Button>
      </div>

      {/* Library */}
      <h2 className="mb-2 mt-8 text-xs font-semibold uppercase tracking-wider text-gray-400">
        {t('announcer.library')}
      </h2>
      {lib.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-3 text-sm text-gray-400">
          {t('announcer.libraryEmpty')}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {lib.map((it, idx) => (
            <li key={idx} className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="px-2"
                onClick={() => speak(it.x)}
                aria-label={`${t('announcer.play')}: ${it.t}`}
              >
                <Play className="h-4 w-4" />
              </Button>
              <button
                type="button"
                className="min-w-0 flex-1 truncate rounded-lg border border-gray-300 bg-white px-3 text-left text-sm text-gray-700 hover:bg-gray-50"
                title={t('announcer.loadToField')}
                onClick={() => {
                  setText(it.x)
                  textRef.current?.focus()
                }}
              >
                {it.t}
              </button>
              <Button
                variant="outline"
                size="sm"
                className="px-2"
                onClick={() => setLib((a) => a.filter((_, i) => i !== idx))}
                aria-label={`${t('announcer.delete')}: ${it.t}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* Rosters */}
      <h2 className="mb-2 mt-8 text-xs font-semibold uppercase tracking-wider text-gray-400">
        {t('announcer.rosters')}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <RosterCard
          label={t('announcer.home')}
          value={home}
          onChange={setHome}
          onSave={() => writeLS(ROSTER_KEY('home'), home)}
          onFile={(f) => loadRosterFile('home', f)}
          onSpeakLine={(line) => speak(line)}
        />
        <RosterCard
          label={t('announcer.away')}
          value={away}
          onChange={setAway}
          onSave={() => writeLS(ROSTER_KEY('away'), away)}
          onFile={(f) => loadRosterFile('away', f)}
          onSpeakLine={(line) => speak(line)}
        />
      </div>

      <p className="mt-8 text-xs text-gray-400">{t('announcer.aiNote')}</p>
    </div>
  )
}

function RosterCard({
  label,
  value,
  onChange,
  onSave,
  onFile,
  onSpeakLine,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  onSave: () => void
  onFile: (f: File) => void
  onSpeakLine: (line: string) => void
}) {
  const { t } = useTranslation()
  const lines = value
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
  return (
    <Card>
      <CardContent className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900">{label}</h3>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={6}
          placeholder={t('announcer.rosterPlaceholder')}
          className="w-full resize-y rounded-lg border border-gray-300 bg-white p-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
        />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onSave}>
            <Save className="h-4 w-4" />
            {t('announcer.save')}
          </Button>
          <label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-xs font-medium text-gray-700 hover:bg-gray-50">
            <Upload className="h-4 w-4" />
            {t('announcer.loadFile')}
            <input
              type="file"
              accept=".txt,.csv,text/plain"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onFile(f)
                e.target.value = ''
              }}
            />
          </label>
        </div>
        {lines.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {lines.map((line, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSpeakLine(line)}
                className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-200"
              >
                {line}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
