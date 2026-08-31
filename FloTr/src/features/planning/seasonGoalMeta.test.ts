import { describe, it, expect } from 'vitest'
import { fmtGoalValue, forcedAtMost, isPercentMetric, verdictMeta } from './seasonGoalMeta'

describe('seasonGoalMeta', () => {
  it('formats percent / test-unit / plain values', () => {
    expect(fmtGoalValue(66.666, { metric: 40, testUnit: null })).toBe('66.67 %')
    expect(fmtGoalValue(3.2, { metric: 20, testUnit: 's' })).toBe('3.2 s')
    expect(fmtGoalValue(12, { metric: 0, testUnit: null })).toBe('12')
    expect(fmtGoalValue(null, { metric: 0, testUnit: null })).toBe('–')
  })

  it('knows the percent metrics and the forced-at-most ones', () => {
    expect([4, 22, 40].every(isPercentMetric)).toBe(true)
    expect(isPercentMetric(0)).toBe(false)
    expect(forcedAtMost(1)).toBe(true) // Losses
    expect(forcedAtMost(6)).toBe(true) // GoalsAgainst
    expect(forcedAtMost(0)).toBe(false)
  })

  it('maps the verdict enum to a stable key', () => {
    expect(verdictMeta(1).key).toBe('Successful')
    expect(verdictMeta(2).key).toBe('Partial')
    expect(verdictMeta(3).key).toBe('Unsuccessful')
    expect(verdictMeta(0).key).toBe('Pending')
  })
})
