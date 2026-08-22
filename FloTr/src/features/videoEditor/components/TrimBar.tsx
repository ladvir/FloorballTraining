import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Scissors } from 'lucide-react'
import { formatTime } from '../utils/formatTime'

interface TrimBarProps {
  durationMs: number
  trimStartMs: number
  trimEndMs: number
  onChange: (startMs: number, endMs: number) => void
  onReset: () => void
}

/** Non-destructive trim range (#138) — drag either handle to narrow playback to a clip. */
export function TrimBar({ durationMs, trimStartMs, trimEndMs, onChange, onReset }: TrimBarProps) {
  const { t } = useTranslation()
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<'start' | 'end' | null>(null)

  useEffect(() => {
    if (!dragging || !trackRef.current) return
    const track = trackRef.current
    const onMove = (e: MouseEvent) => {
      const rect = track.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      const ms = ratio * durationMs
      if (dragging === 'start') onChange(Math.min(ms, trimEndMs), trimEndMs)
      else onChange(trimStartMs, Math.max(ms, trimStartMs))
    }
    const onUp = () => setDragging(null)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging, durationMs, trimStartMs, trimEndMs, onChange])

  if (durationMs <= 0) return null

  const startPct = (trimStartMs / durationMs) * 100
  const endPct = (trimEndMs / durationMs) * 100
  const isTrimmed = trimStartMs > 0 || trimEndMs < durationMs

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
      <Scissors className="h-4 w-4 shrink-0 text-gray-400" />
      <span className="w-24 shrink-0 text-xs tabular-nums text-gray-500">
        {formatTime(trimStartMs)} – {formatTime(trimEndMs)}
      </span>

      <div ref={trackRef} className="relative h-2 min-w-[160px] flex-1 rounded-full bg-gray-200">
        <div
          className="absolute h-2 rounded-full bg-sky-400"
          style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
        />
        <button
          type="button"
          aria-label={t('videoEditor.trimStart')}
          onMouseDown={() => setDragging('start')}
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-full border-2 border-sky-500 bg-white"
          style={{ left: `${startPct}%` }}
        />
        <button
          type="button"
          aria-label={t('videoEditor.trimEnd')}
          onMouseDown={() => setDragging('end')}
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-full border-2 border-sky-500 bg-white"
          style={{ left: `${endPct}%` }}
        />
      </div>

      {isTrimmed && (
        <button
          type="button"
          onClick={onReset}
          className="shrink-0 text-xs font-medium text-gray-500 underline hover:text-gray-700"
        >
          {t('videoEditor.trimReset')}
        </button>
      )}
    </div>
  )
}
