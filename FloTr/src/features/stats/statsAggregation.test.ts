import { describe, it, expect } from 'vitest'
import { avgGrade, formatCanadianScore, calculateScoringRate } from './statsAggregation'

describe('avgGrade', () => {
  it('returns null for empty array', () => {
    expect(avgGrade([])).toBeNull()
  })

  it('returns single value for one-element array', () => {
    expect(avgGrade([5])).toBe(5)
  })

  it('returns average of multiple grades', () => {
    expect(avgGrade([4, 6])).toBe(5)
  })

  it('rounds to one decimal place', () => {
    expect(avgGrade([1, 2, 3])).toBe(2)
    expect(avgGrade([1, 2])).toBe(1.5)
    expect(avgGrade([1, 1, 2])).toBe(1.3)
  })

  it('handles decimal grades', () => {
    expect(avgGrade([3.5, 4.5])).toBe(4)
  })

  it('handles all identical grades', () => {
    expect(avgGrade([7, 7, 7, 7])).toBe(7)
  })
})

describe('formatCanadianScore', () => {
  it('formats goals and assists with points total', () => {
    expect(formatCanadianScore(10, 5)).toBe('10+5=15')
  })

  it('formats zero goals and zero assists', () => {
    expect(formatCanadianScore(0, 0)).toBe('0+0=0')
  })

  it('formats goals only (no assists)', () => {
    expect(formatCanadianScore(3, 0)).toBe('3+0=3')
  })

  it('formats assists only (no goals)', () => {
    expect(formatCanadianScore(0, 7)).toBe('0+7=7')
  })

  it('calculates points correctly as sum of goals and assists', () => {
    expect(formatCanadianScore(21, 14)).toBe('21+14=35')
  })
})

describe('calculateScoringRate', () => {
  it('returns 0 when games is 0', () => {
    expect(calculateScoringRate(10, 0)).toBe(0)
  })

  it('returns 0 when games is negative', () => {
    expect(calculateScoringRate(10, -1)).toBe(0)
  })

  it('returns points per game', () => {
    expect(calculateScoringRate(10, 2)).toBe(5)
  })

  it('rounds to 2 decimal places', () => {
    expect(calculateScoringRate(1, 3)).toBe(0.33)
    expect(calculateScoringRate(2, 3)).toBe(0.67)
  })

  it('returns 0 when points is 0', () => {
    expect(calculateScoringRate(0, 10)).toBe(0)
  })

  it('handles 1 game', () => {
    expect(calculateScoringRate(5, 1)).toBe(5)
  })
})
