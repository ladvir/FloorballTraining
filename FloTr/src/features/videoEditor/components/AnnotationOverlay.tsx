import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import LineLayer from '../../../components/ui/drawing/LineLayer'
import FreehandLayer from '../../../components/ui/drawing/FreehandLayer'
import TextLayer from '../../../components/ui/drawing/TextLayer'
import { pointsToSmoothPath } from '../../../components/ui/drawing/DrawingUtils'
import { useTextEditor, type EditingText } from '../../../components/ui/drawing/hooks/useTextEditor'
import type { TextItem } from '../../../components/ui/drawing/DrawingTypes'
import { clientToSvgPoint } from '../utils/svgPoint'
import {
  COLOR_OPTIONS,
  DEFAULT_ANNOTATION_WINDOW_MS,
  generateAnnotationId,
  isActiveAt,
  type AnnotationState,
  type AnnotationTool,
  type SelectedAnnotation,
  type TimedLine,
  type TimedFreehandLine,
  type TimedText,
} from '../annotationTypes'

type Point = { x: number; y: number }
type DrawingShape =
  | { kind: 'line'; start: Point; current: Point }
  | { kind: 'freehand'; points: Point[] }

type DragInfo = {
  kind: 'line' | 'freehand' | 'text'
  index: number
  startSvg: Point
  orig: TimedLine | TimedFreehandLine | TimedText
}

interface AnnotationOverlayProps {
  state: AnnotationState
  onChangeLive: (state: AnnotationState) => void
  onBeginChange: () => void
  onCreateLine: (line: TimedLine) => void
  onCreateFreehand: (freehand: TimedFreehandLine) => void
  onCreateText: (text: TimedText) => void
  onUpdateText: (id: string, updates: Partial<Omit<TimedText, 'id' | 'startMs' | 'endMs'>>) => void
  onDeleteText: (id: string) => void
  currentMs: number
  durationMs: number
  tool: AnnotationTool
  color: string
  thickness: number
  dashArray: string
  selected: SelectedAnnotation | null
  onSelect: (selection: SelectedAnnotation | null) => void
  viewBoxWidth: number
  viewBoxHeight: number
}

export function AnnotationOverlay({
  state,
  onChangeLive,
  onBeginChange,
  onCreateLine,
  onCreateFreehand,
  onCreateText,
  onUpdateText,
  onDeleteText,
  currentMs,
  durationMs,
  tool,
  color,
  thickness,
  dashArray,
  selected,
  onSelect,
  viewBoxWidth,
  viewBoxHeight,
}: AnnotationOverlayProps) {
  const { t } = useTranslation()
  const svgRef = useRef<SVGSVGElement>(null)
  const [dragging, setDragging] = useState<DragInfo | null>(null)
  const [drawingShape, setDrawingShape] = useState<DrawingShape | null>(null)
  const textEditor = useTextEditor()
  const defaultFontSize = Math.max(12, Math.round(viewBoxHeight * 0.05))

  // Latest values captured in a ref so the window-level drag/draw effects don't need to
  // resubscribe on every render (state changes continuously while playing/dragging).
  const liveRef = useRef({ state, currentMs, durationMs, color, thickness, dashArray, tool })
  useEffect(() => {
    liveRef.current = { state, currentMs, durationMs, color, thickness, dashArray, tool }
  })

  // Switching tools abandons an unsaved text draft (e.g. opened it, then picked Select instead)
  // rather than leaving it floating over the video. Doesn't affect double-click-to-edit, which
  // never changes `tool` itself.
  useEffect(() => {
    textEditor.stopEditing()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool])

  const visibleLineEntries = useMemo(
    () =>
      state.lines
        .map((l, idx) => ({ l, idx }))
        .filter(({ l }) => isActiveAt(l.startMs, l.endMs, currentMs)),
    [state.lines, currentMs]
  )
  const visibleFreehandEntries = useMemo(
    () =>
      state.freehandLines
        .map((l, idx) => ({ l, idx }))
        .filter(({ l }) => isActiveAt(l.startMs, l.endMs, currentMs)),
    [state.freehandLines, currentMs]
  )
  const visibleTextEntries = useMemo(
    () =>
      state.texts
        .map((l, idx) => ({ l, idx }))
        .filter(({ l }) => isActiveAt(l.startMs, l.endMs, currentMs)),
    [state.texts, currentMs]
  )

  const selectedLineFilteredIndex =
    selected?.kind === 'line' ? visibleLineEntries.findIndex((e) => e.idx === selected.index) : -1
  const selectedFreehandFilteredIndex =
    selected?.kind === 'freehand'
      ? visibleFreehandEntries.findIndex((e) => e.idx === selected.index)
      : -1
  const selectedTextFilteredIndex =
    selected?.kind === 'text' ? visibleTextEntries.findIndex((e) => e.idx === selected.index) : -1

  const beginDrag = (
    kind: 'line' | 'freehand' | 'text',
    index: number,
    orig: TimedLine | TimedFreehandLine | TimedText,
    e: MouseEvent
  ) => {
    if (!svgRef.current) return
    const startSvg = clientToSvgPoint(svgRef.current, e.clientX, e.clientY)
    if (Number.isNaN(startSvg.x) || Number.isNaN(startSvg.y)) return
    onBeginChange()
    setDragging({ kind, index, startSvg, orig })
  }

  const handleLineSelect = (_type: 'line', filteredIdx: number, e: MouseEvent) => {
    if (tool !== 'select') return
    e.stopPropagation()
    const entry = visibleLineEntries[filteredIdx]
    if (!entry) return
    onSelect({ kind: 'line', index: entry.idx })
    beginDrag('line', entry.idx, entry.l, e)
  }

  const handleFreehandSelect = (_type: 'freehand', filteredIdx: number, e: MouseEvent) => {
    if (tool !== 'select') return
    e.stopPropagation()
    const entry = visibleFreehandEntries[filteredIdx]
    if (!entry) return
    onSelect({ kind: 'freehand', index: entry.idx })
    beginDrag('freehand', entry.idx, entry.l, e)
  }

  const handleTextSelect = (_type: 'text', filteredIdx: number, e: MouseEvent) => {
    if (tool !== 'select') return
    e.stopPropagation()
    const entry = visibleTextEntries[filteredIdx]
    if (!entry) return
    onSelect({ kind: 'text', index: entry.idx })
    beginDrag('text', entry.idx, entry.l, e)
  }

  // Double-click an existing text to re-edit it, regardless of the currently active tool.
  const handleEditText = (item: TextItem, e: MouseEvent) => {
    e.stopPropagation()
    textEditor.startEditing({
      id: item.id,
      x: item.x,
      y: item.y,
      draft: item.text,
      fontSize: item.fontSize,
      color: item.color,
      fontWeight: item.fontWeight,
      fontStyle: item.fontStyle,
      mode: 'edit',
    })
  }

  const handleSaveText = (et: EditingText) => {
    if (!et.id) return
    if (et.mode === 'create') {
      const endMs =
        durationMs > 0
          ? Math.min(durationMs, currentMs + DEFAULT_ANNOTATION_WINDOW_MS)
          : currentMs + DEFAULT_ANNOTATION_WINDOW_MS
      onCreateText({
        id: et.id,
        x: et.x,
        y: et.y,
        text: et.draft,
        fontSize: et.fontSize,
        color: et.color,
        fontWeight: et.fontWeight,
        fontStyle: et.fontStyle,
        startMs: currentMs,
        endMs,
      })
    } else {
      onUpdateText(et.id, {
        text: et.draft,
        fontSize: et.fontSize,
        color: et.color,
        fontWeight: et.fontWeight,
        fontStyle: et.fontStyle,
      })
    }
  }

  const onBackgroundMouseDown = (e: MouseEvent) => {
    if (!svgRef.current) return
    if (tool === 'select') {
      onSelect(null)
      return
    }
    const p = clientToSvgPoint(svgRef.current, e.clientX, e.clientY)
    if (tool === 'text') {
      // Ignore a stray click elsewhere while a draft is already open, so it isn't discarded.
      if (!textEditor.editingText) {
        textEditor.startEditing({
          x: p.x,
          y: p.y,
          draft: '',
          fontSize: defaultFontSize,
          color,
          mode: 'create',
        })
      }
      return
    }
    setDrawingShape(
      tool === 'line' || tool === 'arrow'
        ? { kind: 'line', start: p, current: p }
        : { kind: 'freehand', points: [p] }
    )
  }

  // Drag an already-selected line/freehand.
  useEffect(() => {
    if (!dragging || !svgRef.current) return
    const svg = svgRef.current
    const onMove = (ev: globalThis.MouseEvent) => {
      const p = clientToSvgPoint(svg, ev.clientX, ev.clientY)
      const dx = p.x - dragging.startSvg.x
      const dy = p.y - dragging.startSvg.y
      const { state: liveState } = liveRef.current
      if (dragging.kind === 'line') {
        const orig = dragging.orig as TimedLine
        onChangeLive({
          ...liveState,
          lines: liveState.lines.map((l, i) =>
            i === dragging.index
              ? { ...l, x1: orig.x1 + dx, y1: orig.y1 + dy, x2: orig.x2 + dx, y2: orig.y2 + dy }
              : l
          ),
        })
      } else if (dragging.kind === 'freehand') {
        const orig = dragging.orig as TimedFreehandLine
        onChangeLive({
          ...liveState,
          freehandLines: liveState.freehandLines.map((f, i) =>
            i === dragging.index
              ? { ...f, points: orig.points.map((pt) => ({ x: pt.x + dx, y: pt.y + dy })) }
              : f
          ),
        })
      } else {
        const orig = dragging.orig as TimedText
        onChangeLive({
          ...liveState,
          texts: liveState.texts.map((txt, i) =>
            i === dragging.index ? { ...txt, x: orig.x + dx, y: orig.y + dy } : txt
          ),
        })
      }
    }
    const onUp = () => setDragging(null)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging, onChangeLive])

  // Draw a brand-new line/freehand annotation.
  useEffect(() => {
    if (!drawingShape || !svgRef.current) return
    const svg = svgRef.current
    const onMove = (ev: globalThis.MouseEvent) => {
      const p = clientToSvgPoint(svg, ev.clientX, ev.clientY)
      setDrawingShape((prev) => {
        if (!prev) return prev
        return prev.kind === 'line'
          ? { ...prev, current: p }
          : { ...prev, points: [...prev.points, p] }
      })
    }
    // A plain function (not a setState updater) — onCreateLine/onCreateFreehand have side
    // effects (they mutate the parent's state), and React's StrictMode double-invokes updater
    // functions in dev to check they're pure, which was creating two lines per drag.
    const onUp = () => {
      const shape = drawingShape
      const {
        currentMs: startMs,
        durationMs: total,
        color: c,
        thickness: w,
        dashArray: d,
        tool: activeTool,
      } = liveRef.current
      const endMs =
        total > 0
          ? Math.min(total, startMs + DEFAULT_ANNOTATION_WINDOW_MS)
          : startMs + DEFAULT_ANNOTATION_WINDOW_MS
      if (shape?.kind === 'line') {
        const dist = Math.hypot(shape.current.x - shape.start.x, shape.current.y - shape.start.y)
        if (dist > 3) {
          onCreateLine({
            id: generateAnnotationId(),
            x1: shape.start.x,
            y1: shape.start.y,
            x2: shape.current.x,
            y2: shape.current.y,
            color: c,
            strokeWidth: w,
            dash: d,
            type: 'line',
            arrow: activeTool === 'arrow',
            startMs,
            endMs,
          })
        }
      } else if (shape?.kind === 'freehand' && shape.points.length > 2) {
        onCreateFreehand({
          id: generateAnnotationId(),
          points: shape.points,
          color: c,
          strokeWidth: w,
          dash: d,
          arrow: false,
          startMs,
          endMs,
        })
      }
      setDrawingShape(null)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [drawingShape, onCreateLine, onCreateFreehand])

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      className="absolute inset-0 h-full w-full"
      style={{ cursor: tool === 'select' ? 'default' : 'crosshair' }}
    >
      {/* Open (unfilled chevron) arrowheads, one per palette color — same "arrow-{color}" marker
          id LineLayer already looks up for any Line with arrow:true, scoped to this SVG only so
          it doesn't affect the closed/filled arrowheads MarkersDefs.tsx defines elsewhere. */}
      <defs>
        {COLOR_OPTIONS.map((c) => (
          <marker
            key={c}
            id={`arrow-${c.replace('#', '')}`}
            viewBox="0 0 10 10"
            refX="0"
            refY="5"
            markerUnits="strokeWidth"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path
              d="M 0 0 L 9 5 L 0 10"
              fill="none"
              stroke={c}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </marker>
        ))}
      </defs>
      <rect
        x={0}
        y={0}
        width={viewBoxWidth}
        height={viewBoxHeight}
        fill="transparent"
        onMouseDown={onBackgroundMouseDown}
      />
      <LineLayer
        lines={visibleLineEntries.map((e) => e.l)}
        selectedItems={selectedLineFilteredIndex >= 0 ? [selectedLineFilteredIndex] : []}
        handleSelect={handleLineSelect}
      />
      <FreehandLayer
        freehandLines={visibleFreehandEntries.map((e) => e.l)}
        selectedItems={selectedFreehandFilteredIndex >= 0 ? [selectedFreehandFilteredIndex] : []}
        handleSelect={handleFreehandSelect}
      />
      <TextLayer
        texts={visibleTextEntries.map((e) => e.l)}
        selectedItems={selectedTextFilteredIndex >= 0 ? [selectedTextFilteredIndex] : []}
        handleSelect={handleTextSelect}
        onEditText={handleEditText}
      />
      {drawingShape?.kind === 'line' && (
        <line
          x1={drawingShape.start.x}
          y1={drawingShape.start.y}
          x2={drawingShape.current.x}
          y2={drawingShape.current.y}
          stroke={color}
          strokeWidth={thickness}
          strokeDasharray={dashArray}
          markerEnd={tool === 'arrow' ? `url(#arrow-${color.replace('#', '')})` : undefined}
        />
      )}
      {drawingShape?.kind === 'freehand' && drawingShape.points.length > 1 && (
        <path
          d={pointsToSmoothPath(drawingShape.points)}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeDasharray={dashArray}
        />
      )}
      {textEditor.editingText && (
        <foreignObject
          x={textEditor.editingText.x}
          y={textEditor.editingText.y}
          width={Math.min(viewBoxWidth * 0.5, 420)}
          height={Math.min(viewBoxHeight * 0.3, 160)}
        >
          <textarea
            autoFocus
            value={textEditor.editingText.draft}
            onChange={(e) => textEditor.updateDraft(e.target.value)}
            onKeyDown={(e) => textEditor.handleKeyDown(e.nativeEvent, handleSaveText, onDeleteText)}
            onMouseDown={(e) => e.stopPropagation()}
            placeholder={t('videoEditor.textPlaceholder')}
            className="box-border h-full w-full resize-none rounded border border-dashed border-sky-400 bg-white/90 p-1"
            style={{
              fontSize: textEditor.editingText.fontSize,
              color: textEditor.editingText.color,
              fontWeight: textEditor.editingText.fontWeight || 'normal',
              fontStyle: textEditor.editingText.fontStyle || 'normal',
            }}
          />
        </foreignObject>
      )}
    </svg>
  )
}
