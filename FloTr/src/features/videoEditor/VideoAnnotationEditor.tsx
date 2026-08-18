import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnnotationOverlay } from './components/AnnotationOverlay'
import { AnnotationToolbar } from './components/AnnotationToolbar'
import { VideoControls } from './components/VideoControls'
import { useAnnotationHistory } from './hooks/useAnnotationHistory'
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

  const history = useAnnotationHistory()

  // Reset when a different video is loaded.
  useEffect(() => {
    setAnnotations(EMPTY_STATE)
    setSelected(null)
    history.clear()
    setCurrentMs(0)
    setDurationMs(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

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
    if (video.paused) void video.play()
    else video.pause()
  }

  const seek = (ms: number) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = ms / 1000
    setCurrentMs(ms)
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
            setDurationMs(video.duration * 1000)
            setNaturalSize({ width: video.videoWidth || 1280, height: video.videoHeight || 720 })
          }}
          onTimeUpdate={(e) => setCurrentMs(e.currentTarget.currentTime * 1000)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
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
      </div>

      <VideoControls
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        currentMs={currentMs}
        durationMs={durationMs}
        onSeek={seek}
        playbackRate={playbackRate}
        onRateChange={setPlaybackRate}
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
    </div>
  )
}
