import { describe, it, expect } from 'vitest'
import { parseDecimalInput } from './number'

describe('parseDecimalInput', () => {
  it('parses a dot decimal', () => {
    expect(parseDecimalInput('3.5')).toBe(3.5)
  })

  it('parses a Czech comma decimal', () => {
    expect(parseDecimalInput('3,5')).toBe(3.5)
  })

  it('trims surrounding whitespace', () => {
    expect(parseDecimalInput('  42 ')).toBe(42)
  })

  it('returns undefined for empty input', () => {
    expect(parseDecimalInput('   ')).toBeUndefined()
  })

  it('returns undefined for non-numeric input', () => {
    expect(parseDecimalInput('abc')).toBeUndefined()
  })
})
