/**
 * Parse a user-typed decimal that may use a comma (Czech locale) or a dot
 * as the decimal separator. Returns `undefined` for empty or non-numeric input.
 */
export function parseDecimalInput(value: string): number | undefined {
  const trimmed = value.trim().replace(',', '.')
  if (trimmed === '') return undefined
  const num = Number(trimmed)
  return Number.isFinite(num) ? num : undefined
}
