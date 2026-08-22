import type { Line, FreehandLine } from '../../components/ui/drawing/DrawingTypes'

/** A line annotation visible only while video playback is within [startMs, endMs]. */
export type TimedLine = Line & { id: string; startMs: number; endMs: number }

/** A freehand annotation visible only while video playback is within [startMs, endMs]. */
export type TimedFreehandLine = FreehandLine & { id: string; startMs: number; endMs: number }

export interface AnnotationState {
  lines: TimedLine[]
  freehandLines: TimedFreehandLine[]
}

export type AnnotationTool = 'select' | 'line' | 'freehand'

export type SelectedAnnotation =
  | { kind: 'line'; index: number }
  | { kind: 'freehand'; index: number }

/** New annotations default to a 2s window around the moment they were drawn, clamped to the video length. */
export const DEFAULT_ANNOTATION_WINDOW_MS = 2000

export function isActiveAt(startMs: number, endMs: number, currentMs: number): boolean {
  return currentMs >= startMs && currentMs <= endMs
}

let nextId = 1
export function generateAnnotationId(): string {
  nextId += 1
  return `ann-${Date.now()}-${nextId}`
}

export type DashStyle = 'solid' | 'dotted' | 'dashed'

export const DASH_OPTIONS: { id: DashStyle; dasharray: string }[] = [
  { id: 'solid', dasharray: '' },
  { id: 'dotted', dasharray: '2,4' },
  { id: 'dashed', dasharray: '8,4' },
]

export const THICKNESS_OPTIONS = [2, 3, 5, 8]

export const COLOR_OPTIONS = [
  '#cc0000',
  '#f2ab3f',
  '#f5e400',
  '#008800',
  '#0055cc',
  '#7700aa',
  '#ffffff',
  '#000000',
]
