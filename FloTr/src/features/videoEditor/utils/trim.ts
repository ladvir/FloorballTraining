/**
 * Clamps a trim range to [0, durationMs] and keeps start <= end. Always rounds to whole
 * milliseconds — inputs are often fractional (drag-handle ratio math, video.duration itself
 * having sub-ms precision), but the backend stores trim bounds as a plain int (#138 PUT 400s
 * on a fractional value).
 */
export function clampTrim(
  startMs: number,
  endMs: number,
  durationMs: number
): { startMs: number; endMs: number } {
  const clampedStart = Math.round(Math.max(0, Math.min(startMs, durationMs)))
  const clampedEnd = Math.round(Math.max(clampedStart, Math.min(endMs, durationMs)))
  return { startMs: clampedStart, endMs: clampedEnd }
}
