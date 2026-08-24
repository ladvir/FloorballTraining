import { useCallback, useEffect, useRef, useState, type ReactEventHandler } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery } from '@tanstack/react-query'
import { AlertTriangle, Clapperboard, Save } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { videoAnnotationsApi } from '../../api/videoAnnotations.api'
import { videosApi } from '../../api/videos.api'
import { toast } from '../../utils/toast'
import type { VideoOwnerKind } from '../../types/domain.types'
import { AnnotationOverlay } from './components/AnnotationOverlay'
import { AnnotationToolbar } from './components/AnnotationToolbar'
import { VideoControls } from './components/VideoControls'
import { VideoOwnerPickerModal } from './components/VideoOwnerPickerModal'
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
  type TimedText,
} from './annotationTypes'

export interface VideoAnnotationOwner {
  kind: VideoOwnerKind
  ownerId: number
  videoId: number
}

interface VideoAnnotationEditorProps {
  src: string
  /** Present only for a video already in the system — enables loading/saving the analysis (#139). */
  owner?: VideoAnnotationOwner
  /** Present when `src` is a local device file not yet uploaded — lets the trainer attach it to
   *  a Training/Activity/Appointment and save the analysis in one step (#140). */
  localFile?: File
  /** Called once the local file has been uploaded and its analysis saved, so the page can switch
   *  to treating this as a regular system video (update the URL, drop the local blob). */
  onAttached?: (owner: VideoAnnotationOwner) => void
}

const EMPTY_STATE: AnnotationState = { lines: [], freehandLines: [], texts: [] }

export function VideoAnnotationEditor({
  src,
  owner,
  localFile,
  onAttached,
}: VideoAnnotationEditorProps) {
  const { t } = useTranslation()
  const videoRef = useRef<HTMLVideoElement>(null)
  const appliedSavedRef = useRef(false)
  const [showOwnerPicker, setShowOwnerPicker] = useState(false)

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

  const annotationQuery = useQuery({
    queryKey: ['video-annotation', owner?.kind, owner?.ownerId, owner?.videoId],
    queryFn: () => videoAnnotationsApi.get(owner!.kind, owner!.ownerId, owner!.videoId),
    enabled: !!owner,
    // Poll while a burned-in export (#141) is running so its Completed/Failed result shows up
    // without the coach having to reopen the editor.
    refetchInterval: (query) => (query.state.data?.exportStatus === 1 ? 3000 : false),
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!owner) throw new Error('No owner to save the analysis to')
      return videoAnnotationsApi.save(owner.kind, owner.ownerId, owner.videoId, {
        trimStartMs,
        trimEndMs,
        dataJson: JSON.stringify({
          lines: annotations.lines,
          freehandLines: annotations.freehandLines,
          texts: annotations.texts,
        }),
      })
    },
    onSuccess: () => toast.success(t('videoEditor.saved')),
    onError: () => toast.error(t('videoEditor.saveFailed')),
  })

  const attachMutation = useMutation({
    mutationFn: async ({ kind, ownerId }: { kind: VideoOwnerKind; ownerId: number }) => {
      if (!localFile) throw new Error('No local file to upload')
      const video = await videosApi.addFile(kind, ownerId, localFile, undefined)
      await videoAnnotationsApi.save(kind, ownerId, video.id, {
        trimStartMs,
        trimEndMs,
        dataJson: JSON.stringify({
          lines: annotations.lines,
          freehandLines: annotations.freehandLines,
          texts: annotations.texts,
        }),
      })
      return { kind, ownerId, videoId: video.id }
    },
    onSuccess: ({ kind, ownerId, videoId }) => {
      toast.success(t('videoEditor.saved'))
      setShowOwnerPicker(false)
      onAttached?.({ kind, ownerId, videoId })
    },
    onError: () => toast.error(t('videoEditor.saveFailed')),
  })

  const exportMutation = useMutation({
    mutationFn: () => {
      if (!owner) throw new Error('No owner to export from')
      return videoAnnotationsApi.export(owner.kind, owner.ownerId, owner.videoId)
    },
    onSuccess: () => annotationQuery.refetch(),
    onError: () => toast.error(t('videoEditor.exportFailed')),
  })

  // Toast once when a running export finishes, not on every poll tick.
  const prevExportStatusRef = useRef<number | undefined>(undefined)
  useEffect(() => {
    const status = annotationQuery.data?.exportStatus
    if (prevExportStatusRef.current === 1 && status === 2)
      toast.success(t('videoEditor.exportCompleted'))
    if (prevExportStatusRef.current === 1 && status === 3)
      toast.error(t('videoEditor.exportFailed'))
    prevExportStatusRef.current = status
  }, [annotationQuery.data?.exportStatus, t])

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
    appliedSavedRef.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  // Apply a previously saved analysis once both the video's duration and the saved data are
  // known — whichever of the two arrives last triggers this (order isn't guaranteed).
  useEffect(() => {
    if (appliedSavedRef.current || durationMs <= 0 || !annotationQuery.isFetched) return
    appliedSavedRef.current = true
    const saved = annotationQuery.data
    if (!saved) return
    try {
      const parsed = JSON.parse(saved.dataJson) as Partial<AnnotationState>
      setAnnotations({
        lines: parsed.lines ?? [],
        freehandLines: parsed.freehandLines ?? [],
        texts: parsed.texts ?? [],
      })
    } catch {
      // Malformed data shouldn't block opening the editor — just start from an empty state.
    }
    if (saved.trimStartMs != null && saved.trimEndMs != null) {
      const clamped = clampTrim(saved.trimStartMs, saved.trimEndMs, durationMs)
      setTrimStartMs(clamped.startMs)
      setTrimEndMs(clamped.endMs)
    }
  }, [durationMs, annotationQuery.isFetched, annotationQuery.data])

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

  const handleCreateText = useCallback(
    (item: TimedText) => {
      history.record(annotations)
      setAnnotations((s) => ({ ...s, texts: [...s.texts, item] }))
      setSelected({ kind: 'text', index: annotations.texts.length })
    },
    [history, annotations]
  )

  const handleUpdateText = useCallback(
    (id: string, updates: Partial<Omit<TimedText, 'id' | 'startMs' | 'endMs'>>) => {
      history.record(annotations)
      setAnnotations((s) => ({
        ...s,
        texts: s.texts.map((item) => (item.id === id ? { ...item, ...updates } : item)),
      }))
    },
    [history, annotations]
  )

  const handleDeleteText = useCallback(
    (id: string) => {
      history.record(annotations)
      setAnnotations((s) => ({ ...s, texts: s.texts.filter((item) => item.id !== id) }))
      setSelected(null)
    },
    [history, annotations]
  )

  const deleteSelected = useCallback(() => {
    if (!selected) return
    history.record(annotations)
    setAnnotations((s) => {
      if (selected.kind === 'line')
        return { ...s, lines: s.lines.filter((_, i) => i !== selected.index) }
      if (selected.kind === 'freehand')
        return { ...s, freehandLines: s.freehandLines.filter((_, i) => i !== selected.index) }
      return { ...s, texts: s.texts.filter((_, i) => i !== selected.index) }
    })
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
      const ms = Math.round(video.currentTime * 1000)
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
        : selected.kind === 'freehand'
          ? annotations.freehandLines[selected.index]
          : annotations.texts[selected.index]
    if (!item) return null
    return { startSec: item.startMs / 1000, endSec: item.endMs / 1000 }
  })()

  const changeSelectedRange = (startSec: number, endSec: number) => {
    if (!selected) return
    const startMs = Math.round(Math.max(0, startSec) * 1000)
    const endMs = Math.round(Math.max(startSec, endSec) * 1000)
    setAnnotations((s) => {
      if (selected.kind === 'line')
        return {
          ...s,
          lines: s.lines.map((l, i) => (i === selected.index ? { ...l, startMs, endMs } : l)),
        }
      if (selected.kind === 'freehand')
        return {
          ...s,
          freehandLines: s.freehandLines.map((f, i) =>
            i === selected.index ? { ...f, startMs, endMs } : f
          ),
        }
      return {
        ...s,
        texts: s.texts.map((item, i) =>
          i === selected.index ? { ...item, startMs, endMs } : item
        ),
      }
    })
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
            const durationMsValue = Math.round(video.duration * 1000)
            setDurationMs(durationMsValue)
            setTrimStartMs(0)
            setTrimEndMs(durationMsValue)
            setNaturalSize({ width: video.videoWidth || 1280, height: video.videoHeight || 720 })
          }}
          onTimeUpdate={(e) => {
            const video = e.currentTarget
            const ms = Math.round(video.currentTime * 1000)
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
            onCreateText={handleCreateText}
            onUpdateText={handleUpdateText}
            onDeleteText={handleDeleteText}
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
            trimStartMs={trimStartMs}
            trimEndMs={trimEndMs}
            onTrimChange={changeTrim}
            onTrimReset={resetTrim}
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

          {(owner || localFile) && (
            <div className="flex flex-wrap items-center justify-end gap-3">
              {owner && annotationQuery.data && (
                <span className="text-xs text-gray-500">
                  {annotationQuery.data.exportStatus === 1 && t('videoEditor.exporting')}
                  {annotationQuery.data.exportStatus === 3 &&
                    (annotationQuery.data.exportError || t('videoEditor.exportFailed'))}
                </span>
              )}
              {owner && annotationQuery.data && (
                <Button
                  variant="outline"
                  onClick={() => exportMutation.mutate()}
                  loading={exportMutation.isPending}
                  disabled={annotationQuery.data.exportStatus === 1}
                >
                  <Clapperboard className="h-4 w-4" />
                  {t('videoEditor.exportVideo')}
                </Button>
              )}
              <Button
                onClick={() => (owner ? saveMutation.mutate() : setShowOwnerPicker(true))}
                loading={saveMutation.isPending || attachMutation.isPending}
              >
                <Save className="h-4 w-4" />
                {t('videoEditor.saveAnalysis')}
              </Button>
            </div>
          )}

          <p className="text-xs text-gray-400">{t('videoEditor.hint')}</p>
        </>
      )}

      <VideoOwnerPickerModal
        isOpen={showOwnerPicker}
        onClose={() => setShowOwnerPicker(false)}
        onSelect={(kind, ownerId) => attachMutation.mutate({ kind, ownerId })}
        saving={attachMutation.isPending}
      />
    </div>
  )
}
