import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import LineLayer from '../../../components/ui/drawing/LineLayer'
import FreehandLayer from '../../../components/ui/drawing/FreehandLayer'
import { pointsToSmoothPath } from '../../../components/ui/drawing/DrawingUtils'
import { clientToSvgPoint } from '../utils/svgPoint'
import {
  DEFAULT_ANNOTATION_WINDOW_MS,
  generateAnnotationId,
  isActiveAt,
  type AnnotationState,
  type AnnotationTool,
  type SelectedAnnotation,
  type TimedLine,
  type TimedFreehandLine,
} from '../annotationTypes'

type Point = { x: number; y: number }
type DrawingShape =
  | { kind: 'line'; start: Point; current: Point }
  | { kind: 'freehand'; points: Point[] }

type DragInfo = {
  kind: 'line' | 'freehand'
  index: number
  startSvg: Point
  orig: TimedLine | TimedFreehandLine
}

interface AnnotationOverlayProps {
  state: AnnotationState
  onChangeLive: (state: AnnotationState) => void
  onBeginChange: () => void
  onCreateLine: (line: TimedLine) => void
  onCreateFreehand: (freehand: TimedFreehandLine) => void
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
  const svgRef = useRef<SVGSVGElement>(null)
  const [dragging, setDragging] = useState<DragInfo | null>(null)
  const [drawingShape, setDrawingShape] = useState<DrawingShape | null>(null)

  // Latest values captured in a ref so the window-level drag/draw effects don't need to
  // resubscribe on every render (state changes continuously while playing/dragging).
  const liveRef = useRef({ state, currentMs, durationMs, color, thickness, dashArray })
  useEffect(() => {
    liveRef.current = { state, currentMs, durationMs, color, thickness, dashArray }
  })

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

  const selectedLineFilteredIndex =
    selected?.kind === 'line' ? visibleLineEntries.findIndex((e) => e.idx === selected.index) : -1
  const selectedFreehandFilteredIndex =
    selected?.kind === 'freehand'
      ? visibleFreehandEntries.findIndex((e) => e.idx === selected.index)
      : -1

  const beginDrag = (
    kind: 'line' | 'freehand',
    index: number,
    orig: TimedLine | TimedFreehandLine,
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

  const onBackgroundMouseDown = (e: MouseEvent) => {
    if (!svgRef.current) return
    if (tool === 'select') {
      onSelect(null)
      return
    }
    const p = clientToSvgPoint(svgRef.current, e.clientX, e.clientY)
    setDrawingShape(
      tool === 'line' ? { kind: 'line', start: p, current: p } : { kind: 'freehand', points: [p] }
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
      } else {
        const orig = dragging.orig as TimedFreehandLine
        onChangeLive({
          ...liveState,
          freehandLines: liveState.freehandLines.map((f, i) =>
            i === dragging.index
              ? { ...f, points: orig.points.map((pt) => ({ x: pt.x + dx, y: pt.y + dy })) }
              : f
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
    const onUp = () => {
      setDrawingShape((prev) => {
        const {
          currentMs: startMs,
          durationMs: total,
          color: c,
          thickness: w,
          dashArray: d,
        } = liveRef.current
        const endMs =
          total > 0
            ? Math.min(total, startMs + DEFAULT_ANNOTATION_WINDOW_MS)
            : startMs + DEFAULT_ANNOTATION_WINDOW_MS
        if (prev?.kind === 'line') {
          const dist = Math.hypot(prev.current.x - prev.start.x, prev.current.y - prev.start.y)
          if (dist > 3) {
            onCreateLine({
              id: generateAnnotationId(),
              x1: prev.start.x,
              y1: prev.start.y,
              x2: prev.current.x,
              y2: prev.current.y,
              color: c,
              strokeWidth: w,
              dash: d,
              type: 'line',
              arrow: false,
              startMs,
              endMs,
            })
          }
        } else if (prev?.kind === 'freehand' && prev.points.length > 2) {
          onCreateFreehand({
            id: generateAnnotationId(),
            points: prev.points,
            color: c,
            strokeWidth: w,
            dash: d,
            arrow: false,
            startMs,
            endMs,
          })
        }
        return null
      })
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
      {drawingShape?.kind === 'line' && (
        <line
          x1={drawingShape.start.x}
          y1={drawingShape.start.y}
          x2={drawingShape.current.x}
          y2={drawingShape.current.y}
          stroke={color}
          strokeWidth={thickness}
          strokeDasharray={dashArray}
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
    </svg>
  )
}
