/** Clamps a trim range to [0, durationMs] and keeps start <= end. */
export function clampTrim(
  startMs: number,
  endMs: number,
  durationMs: number
): { startMs: number; endMs: number } {
  const clampedStart = Math.max(0, Math.min(startMs, durationMs))
  const clampedEnd = Math.max(clampedStart, Math.min(endMs, durationMs))
  return { startMs: clampedStart, endMs: clampedEnd }
}
