import { useMemo } from 'react'
import Svg, { Line, Path } from 'react-native-svg'

type Point = { x: number; y: number }

export type TimedLine = {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  strokeWidth: number
  dash?: string
  startMs: number
  endMs: number
}

export type TimedFreehandLine = {
  id: string
  points: Point[]
  color: string
  strokeWidth: number
  dash?: string
  startMs: number
  endMs: number
}

export interface VideoAnnotationState {
  lines: TimedLine[]
  freehandLines: TimedFreehandLine[]
}

function isActiveAt(startMs: number, endMs: number, currentMs: number) {
  return currentMs >= startMs && currentMs <= endMs
}

// Same Chaikin-smoothing FloTr's drawing tool applies before rendering a freehand stroke
// (DrawingUtils.ts), so strokes look identical here instead of jagged raw point-to-point lines.
function chaikinSmooth(points: Point[], iterations = 5, downsampleStep = 2): Point[] {
  let pts = points.filter((_, i) => i % downsampleStep === 0)
  if (pts.length < 2) pts = points
  for (let iter = 0; iter < iterations; iter++) {
    if (pts.length < 2) break
    const next: Point[] = [pts[0]]
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i]
      const p1 = pts[i + 1]
      next.push(
        { x: 0.75 * p0.x + 0.25 * p1.x, y: 0.75 * p0.y + 0.25 * p1.y },
        { x: 0.25 * p0.x + 0.75 * p1.x, y: 0.25 * p0.y + 0.75 * p1.y }
      )
    }
    next.push(pts[pts.length - 1])
    pts = next
  }
  return pts
}

function pointsToPath(points: Point[]): string {
  const smooth = chaikinSmooth(points)
  if (smooth.length < 2) return ''
  return smooth.reduce((d, p, i) => `${d}${i === 0 ? 'M' : 'L'} ${p.x},${p.y} `, '')
}

interface VideoAnnotationOverlayProps {
  state: VideoAnnotationState
  currentMs: number
  viewBoxWidth: number
  viewBoxHeight: number
}

/** Read-only render of a saved video analysis (#142) - just the lines/freehand strokes active
 *  at the current playback time, scaled onto the video via the SVG viewBox. No editing, no
 *  selection; the web video editor (FloTr) owns creating/editing this data. */
export function VideoAnnotationOverlay({
  state,
  currentMs,
  viewBoxWidth,
  viewBoxHeight,
}: VideoAnnotationOverlayProps) {
  const visibleLines = useMemo(
    () => state.lines.filter((l) => isActiveAt(l.startMs, l.endMs, currentMs)),
    [state.lines, currentMs]
  )
  const visibleFreehand = useMemo(
    () => state.freehandLines.filter((f) => isActiveAt(f.startMs, f.endMs, currentMs)),
    [state.freehandLines, currentMs]
  )

  if (visibleLines.length === 0 && visibleFreehand.length === 0) return null

  return (
    <Svg
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
    >
      {visibleLines.map((l) => (
        <Line
          key={l.id}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke={l.color}
          strokeWidth={l.strokeWidth}
          strokeDasharray={l.dash}
        />
      ))}
      {visibleFreehand.map((f) => (
        <Path
          key={f.id}
          d={pointsToPath(f.points)}
          fill="none"
          stroke={f.color}
          strokeWidth={f.strokeWidth}
          strokeDasharray={f.dash}
        />
      ))}
    </Svg>
  )
}
