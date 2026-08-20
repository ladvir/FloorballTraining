import { useCallback, useEffect, useRef, useState, type ReactEventHandler } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { AnnotationOverlay } from './components/AnnotationOverlay'
import { AnnotationToolbar } from './components/AnnotationToolbar'
import { VideoControls } from './components/VideoControls'
import { TrimBar } from './components/TrimBar'
import { useAnnotationHistory } from './hooks/useAnnotationHistory'
import { clampTrim } from './utils/trim'
import {
  DASH_OPTIONS,
  type AnnotationState,
  type AnnotationTool,
  type DashStyle,
  type SelectedAnnotation,
  type TimedLine,
  type TimedFreehandLine,
} from './annotationTypes'

interface VideoAnnotationEditorProps {
  src: string
}

const EMPTY_STATE: AnnotationState = { lines: [], freehandLines: [] }

export function VideoAnnotationEditor({ src }: VideoAnnotationEditorProps) {
  const { t } = useTranslation()
  const videoRef = useRef<HTMLVideoElement>(null)

  const [annotations, setAnnotations] = useState<AnnotationState>(EMPTY_STATE)
  const [selected, setSelected] = useState<SelectedAnnotation | null>(null)
  const [tool, setTool] = useState<AnnotationTool>('select')
  const [color, setColor] = useState('#cc0000')
  const [thickness, setThickness] = useState(3)
  const [dash, setDash] = useState<DashStyle>('solid')

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentMs, setCurrentMs] = useState(0)
  const [durationMs, setDurationMs] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [naturalSize, setNaturalSize] = useState({ width: 1280, height: 720 })
  const [trimStartMs, setTrimStartMs] = useState(0)
  const [trimEndMs, setTrimEndMs] = useState(0)
  const [playbackError, setPlaybackError] = useState<string | null>(null)

  const history = useAnnotationHistory()

  // Reset when a different video is loaded.
  useEffect(() => {
    setAnnotations(EMPTY_STATE)
    setSelected(null)
    history.clear()
    setCurrentMs(0)
    setDurationMs(0)
    setTrimStartMs(0)
    setTrimEndMs(0)
    setPlaybackError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  const handleVideoError: ReactEventHandler<HTMLVideoElement> = (e) => {
    const error = e.currentTarget.error
    setPlaybackError(
      error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED ||
        error?.code === MediaError.MEDIA_ERR_DECODE
        ? t('videoEditor.unsupportedFormat')
        : t('videoEditor.playbackError')
    )
  }

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = playbackRate
  }, [playbackRate])

  const dashArray = DASH_OPTIONS.find((d) => d.id === dash)?.dasharray ?? ''

  const beginChange = useCallback(() => history.record(annotations), [history, annotations])

  const handleCreateLine = useCallback(
    (line: TimedLine) => {
      history.record(annotations)
      setAnnotations((s) => ({ ...s, lines: [...s.lines, line] }))
      setSelected({ kind: 'line', index: annotations.lines.length })
    },
    [history, annotations]
  )

  const handleCreateFreehand = useCallback(
    (freehand: TimedFreehandLine) => {
      history.record(annotations)
      setAnnotations((s) => ({ ...s, freehandLines: [...s.freehandLines, freehand] }))
      setSelected({ kind: 'freehand', index: annotations.freehandLines.length })
    },
    [history, annotations]
  )

  const deleteSelected = useCallback(() => {
    if (!selected) return
    history.record(annotations)
    setAnnotations((s) =>
      selected.kind === 'line'
        ? { ...s, lines: s.lines.filter((_, i) => i !== selected.index) }
        : { ...s, freehandLines: s.freehandLines.filter((_, i) => i !== selected.index) }
    )
    setSelected(null)
  }, [selected, history, annotations])

  const undo = useCallback(() => {
    const prev = history.undo(annotations)
    if (prev) {
      setAnnotations(prev)
      setSelected(null)
    }
  }, [history, annotations])

  const redo = useCallback(() => {
    const next = history.redo(annotations)
    if (next) {
      setAnnotations(next)
      setSelected(null)
    }
  }, [history, annotations])

  // Delete key removes the selected annotation, unless the user is typing in a form field.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return
      const tag = (document.activeElement?.tagName ?? '').toLowerCase()
      if (tag === 'input' || tag === 'textarea') return
      if (selected) deleteSelected()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selected, deleteSelected])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      const ms = video.currentTime * 1000
      if (ms < trimStartMs || ms >= trimEndMs) {
        video.currentTime = trimStartMs / 1000
        setCurrentMs(trimStartMs)
      }
      void video.play()
    } else {
      video.pause()
    }
  }

  const seek = (ms: number) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = ms / 1000
    setCurrentMs(ms)
  }

  const changeTrim = (startMs: number, endMs: number) => {
    const clamped = clampTrim(startMs, endMs, durationMs)
    setTrimStartMs(clamped.startMs)
    setTrimEndMs(clamped.endMs)
  }

  const resetTrim = () => {
    setTrimStartMs(0)
    setTrimEndMs(durationMs)
  }

  const selectedRangeSec = (() => {
    if (!selected) return null
    const item =
      selected.kind === 'line'
        ? annotations.lines[selected.index]
        : annotations.freehandLines[selected.index]
    if (!item) return null
    return { startSec: item.startMs / 1000, endSec: item.endMs / 1000 }
  })()

  const changeSelectedRange = (startSec: number, endSec: number) => {
    if (!selected) return
    const startMs = Math.max(0, startSec) * 1000
    const endMs = Math.max(startSec, endSec) * 1000
    setAnnotations((s) =>
      selected.kind === 'line'
        ? {
            ...s,
            lines: s.lines.map((l, i) => (i === selected.index ? { ...l, startMs, endMs } : l)),
          }
        : {
            ...s,
            freehandLines: s.freehandLines.map((f, i) =>
              i === selected.index ? { ...f, startMs, endMs } : f
            ),
          }
    )
  }

  return (
    <div className="space-y-3">
      <div
        className="relative w-full overflow-hidden rounded-lg bg-black"
        style={{ aspectRatio: `${naturalSize.width} / ${naturalSize.height}` }}
      >
        <video
          ref={videoRef}
          src={src}
          className="h-full w-full"
          onLoadedMetadata={(e) => {
            const video = e.currentTarget
            const durationMsValue = video.duration * 1000
            setDurationMs(durationMsValue)
            setTrimStartMs(0)
            setTrimEndMs(durationMsValue)
            setNaturalSize({ width: video.videoWidth || 1280, height: video.videoHeight || 720 })
          }}
          onTimeUpdate={(e) => {
            const video = e.currentTarget
            const ms = video.currentTime * 1000
            setCurrentMs(ms)
            if (trimEndMs > 0 && ms >= trimEndMs && !video.paused) {
              video.pause()
              video.currentTime = trimEndMs / 1000
            }
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={handleVideoError}
        />
        {!playbackError && (
          <AnnotationOverlay
            state={annotations}
            onChangeLive={setAnnotations}
            onBeginChange={beginChange}
            onCreateLine={handleCreateLine}
            onCreateFreehand={handleCreateFreehand}
            currentMs={currentMs}
            durationMs={durationMs}
            tool={tool}
            color={color}
            thickness={thickness}
            dashArray={dashArray}
            selected={selected}
            onSelect={setSelected}
            viewBoxWidth={naturalSize.width}
            viewBoxHeight={naturalSize.height}
          />
        )}
        {playbackError && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <Card className="max-w-sm border-amber-200 bg-amber-50">
              <CardContent className="flex items-start gap-2 py-3 text-sm text-amber-800">
                <AlertTriangle className="h-4 w-4 shrink-0 translate-y-0.5" />
                {playbackError}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {!playbackError && (
        <>
          <VideoControls
            isPlaying={isPlaying}
            onTogglePlay={togglePlay}
            currentMs={currentMs}
            durationMs={durationMs}
            onSeek={seek}
            playbackRate={playbackRate}
            onRateChange={setPlaybackRate}
          />

          <TrimBar
            durationMs={durationMs}
            trimStartMs={trimStartMs}
            trimEndMs={trimEndMs}
            onChange={changeTrim}
            onReset={resetTrim}
          />

          <AnnotationToolbar
            tool={tool}
            onToolChange={setTool}
            color={color}
            onColorChange={setColor}
            thickness={thickness}
            onThicknessChange={setThickness}
            dash={dash}
            onDashChange={setDash}
            canUndo={history.canUndo}
            canRedo={history.canRedo}
            onUndo={undo}
            onRedo={redo}
            hasSelection={!!selected}
            onDeleteSelected={deleteSelected}
            selectedRangeSec={selectedRangeSec}
            onChangeSelectedRange={changeSelectedRange}
            durationSec={durationMs / 1000}
          />

          <p className="text-xs text-gray-400">{t('videoEditor.hint')}</p>
        </>
      )}
    </div>
  )
}
