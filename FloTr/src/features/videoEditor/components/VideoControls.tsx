import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Play, Pause, Scissors } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { formatTime } from '../utils/formatTime'

const SPEED_OPTIONS = [0.25, 0.5, 1, 1.5, 2]

function msToTimeInput(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return [h, m, s].map((v) => v.toString().padStart(2, '0')).join(':')
}

function timeInputToMs(value: string, durationMs: number): number {
  const [h, m, s] = value.split(':').map(Number)
  const ms = ((h * 60 + m) * 60 + s) * 1000
  return Math.max(0, Math.min(ms, durationMs))
}

interface VideoControlsProps {
  isPlaying: boolean
  onTogglePlay: () => void
  currentMs: number
  durationMs: number
  onSeek: (ms: number) => void
  playbackRate: number
  onRateChange: (rate: number) => void
  trimStartMs: number
  trimEndMs: number
  onTrimChange: (startMs: number, endMs: number) => void
  onTrimReset: () => void
}

type DragHandle = 'seek' | 'trimStart' | 'trimEnd' | null

/** Playback scrubber and non-destructive trim range (#138) share one track — dragging either
 *  trim handle narrows the clip, the playhead seeks, all on the same timeline. */
export function VideoControls({
  isPlaying,
  onTogglePlay,
  currentMs,
  durationMs,
  onSeek,
  playbackRate,
  onRateChange,
  trimStartMs,
  trimEndMs,
  onTrimChange,
  onTrimReset,
}: VideoControlsProps) {
  const { t } = useTranslation()
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<DragHandle>(null)

  useEffect(() => {
    if (!dragging || !trackRef.current) return
    const track = trackRef.current
    const update = (clientX: number) => {
      const rect = track.getBoundingClientRect()
      const ms = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * durationMs
      if (dragging === 'seek') onSeek(ms)
      else if (dragging === 'trimStart') onTrimChange(Math.min(ms, trimEndMs), trimEndMs)
      else onTrimChange(trimStartMs, Math.max(ms, trimStartMs))
    }
    const onMove = (e: MouseEvent) => update(e.clientX)
    const onUp = () => setDragging(null)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging, durationMs, trimStartMs, trimEndMs, onSeek, onTrimChange])

  const hasDuration = durationMs > 0
  const startPct = hasDuration ? (trimStartMs / durationMs) * 100 : 0
  const endPct = hasDuration ? (trimEndMs / durationMs) * 100 : 100
  const currentPct = hasDuration ? (Math.min(currentMs, durationMs) / durationMs) * 100 : 0
  const isTrimmed = trimStartMs > 0 || trimEndMs < durationMs

  return (
    <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onTogglePlay}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500 text-white hover:bg-sky-600"
          title={isPlaying ? t('videoEditor.pause') : t('videoEditor.play')}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>

        <span className="w-24 shrink-0 text-xs tabular-nums text-gray-500">
          {formatTime(currentMs)} / {formatTime(durationMs)}
        </span>

        <div
          ref={trackRef}
          className="relative h-2 min-w-[160px] flex-1 cursor-pointer rounded-full bg-gray-200"
          onMouseDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            onSeek(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * durationMs)
            setDragging('seek')
          }}
        >
          <div
            className="absolute h-2 rounded-full bg-sky-100"
            style={{ left: `${startPct}%`, width: `${Math.max(0, endPct - startPct)}%` }}
          />
          <div
            className="absolute h-2 rounded-full bg-sky-400"
            style={{
              left: `${startPct}%`,
              width: `${Math.max(0, Math.min(currentPct, endPct) - startPct)}%`,
            }}
          />
          {hasDuration && (
            <>
              <button
                type="button"
                aria-label={t('videoEditor.trimStart')}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  setDragging('trimStart')
                }}
                className="absolute top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-full border-2 border-sky-500 bg-white"
                style={{ left: `${startPct}%` }}
              />
              <button
                type="button"
                aria-label={t('videoEditor.trimEnd')}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  setDragging('trimEnd')
                }}
                className="absolute top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-full border-2 border-sky-500 bg-white"
                style={{ left: `${endPct}%` }}
              />
            </>
          )}
          <button
            type="button"
            aria-label={t('videoEditor.playhead')}
            onMouseDown={(e) => {
              e.stopPropagation()
              setDragging('seek')
            }}
            className="absolute top-1/2 z-20 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-full border-2 border-gray-700 bg-white shadow"
            style={{ left: `${currentPct}%` }}
          />
        </div>

        <div className="flex items-center gap-1">
          <span className="mr-1 text-xs text-gray-500">{t('videoEditor.speed')}</span>
          {SPEED_OPTIONS.map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => onRateChange(rate)}
              className={cn(
                'rounded border px-2 py-1 text-xs font-medium',
                playbackRate === rate
                  ? 'border-sky-500 bg-sky-50 text-sky-600'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              )}
            >
              {rate}×
            </button>
          ))}
        </div>
      </div>

      {hasDuration && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
          <Scissors className="h-4 w-4 shrink-0 text-gray-400" />
          <select
            aria-label={t('videoEditor.trimStart')}
            value={msToTimeInput(trimStartMs)}
            onChange={(e) => onTrimChange(timeInputToMs(e.target.value, durationMs), trimEndMs)}
            className="rounded border border-gray-300 px-1.5 py-1 tabular-nums"
          >
            {timeOptions(durationMs, trimEndMs, 'max').map((v) => (
              <option key={v} value={msToTimeInput(v)}>
                {msToTimeInput(v)}
              </option>
            ))}
          </select>
          <span>–</span>
          <select
            aria-label={t('videoEditor.trimEnd')}
            value={msToTimeInput(trimEndMs)}
            onChange={(e) => onTrimChange(trimStartMs, timeInputToMs(e.target.value, durationMs))}
            className="rounded border border-gray-300 px-1.5 py-1 tabular-nums"
          >
            {timeOptions(durationMs, trimStartMs, 'min').map((v) => (
              <option key={v} value={msToTimeInput(v)}>
                {msToTimeInput(v)}
              </option>
            ))}
          </select>
          {isTrimmed && (
            <button
              type="button"
              onClick={onTrimReset}
              className="font-medium text-gray-500 underline hover:text-gray-700"
            >
              {t('videoEditor.trimReset')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/** One option per whole second, bounded so the two dropdowns can never cross each other. */
function timeOptions(durationMs: number, boundMs: number, bound: 'min' | 'max'): number[] {
  const totalSec = Math.floor(durationMs / 1000)
  const boundSec = Math.round(boundMs / 1000)
  const options: number[] = []
  for (let s = 0; s <= totalSec; s++) {
    if (bound === 'min' ? s >= boundSec : s <= boundSec) options.push(s * 1000)
  }
  return options
}
