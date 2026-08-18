import { useTranslation } from 'react-i18next'
import { Play, Pause } from 'lucide-react'
import { cn } from '../../../utils/cn'

const SPEED_OPTIONS = [0.25, 0.5, 1, 1.5, 2]

function formatTime(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}

interface VideoControlsProps {
  isPlaying: boolean
  onTogglePlay: () => void
  currentMs: number
  durationMs: number
  onSeek: (ms: number) => void
  playbackRate: number
  onRateChange: (rate: number) => void
}

export function VideoControls({
  isPlaying,
  onTogglePlay,
  currentMs,
  durationMs,
  onSeek,
  playbackRate,
  onRateChange,
}: VideoControlsProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
      <button
        type="button"
        onClick={onTogglePlay}
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500 text-white hover:bg-sky-600"
        title={isPlaying ? t('videoEditor.pause') : t('videoEditor.play')}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>

      <span className="w-24 shrink-0 text-xs tabular-nums text-gray-500">
        {formatTime(currentMs)} / {formatTime(durationMs)}
      </span>

      <input
        type="range"
        min={0}
        max={Math.max(durationMs, 1)}
        step={10}
        value={Math.min(currentMs, durationMs)}
        onChange={(e) => onSeek(Number(e.target.value))}
        className="min-w-[160px] flex-1 accent-sky-500"
      />

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
  )
}
