import { describe, it, expect } from 'vitest'
import { isActiveAt, generateAnnotationId } from './annotationTypes'

describe('isActiveAt', () => {
  it('is active exactly on the boundaries', () => {
    expect(isActiveAt(1000, 3000, 1000)).toBe(true)
    expect(isActiveAt(1000, 3000, 3000)).toBe(true)
  })

  it('is active strictly inside the window', () => {
    expect(isActiveAt(1000, 3000, 2000)).toBe(true)
  })

  it('is inactive before start or after end', () => {
    expect(isActiveAt(1000, 3000, 999)).toBe(false)
    expect(isActiveAt(1000, 3000, 3001)).toBe(false)
  })
})

describe('generateAnnotationId', () => {
  it('never returns the same id twice', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateAnnotationId()))
    expect(ids.size).toBe(50)
  })
})
