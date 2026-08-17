import { describe, it, expect } from 'vitest'
import { sortTrainings, type SortKey } from './sortTrainings'
import type { TrainingDto } from '../../types/domain.types'

// ── helpers ───────────────────────────────────────────────────────────────────

function makeTraining(id: number, name: string, duration: number): TrainingDto {
  return {
    id,
    name,
    duration,
    tagIds: [],
    activityIds: [],
    parts: [],
    goals: [],
  } as unknown as TrainingDto
}

const TRAININGS: TrainingDto[] = [
  makeTraining(1, 'Základy', 60),
  makeTraining(2, 'Přihrávky', 90),
  makeTraining(3, 'Střelba', 45),
  makeTraining(4, 'Obrana', 75),
]

// ── sortTrainings ─────────────────────────────────────────────────────────────

describe('sortTrainings', () => {
  it('name-asc sorts alphabetically A → Z (Czech locale)', () => {
    const result = sortTrainings(TRAININGS, 'name-asc')
    const names = result.map((t) => t.name)
    expect(names).toEqual(['Obrana', 'Přihrávky', 'Střelba', 'Základy'])
  })

  it('name-desc sorts alphabetically Z → A (Czech locale)', () => {
    const result = sortTrainings(TRAININGS, 'name-desc')
    const names = result.map((t) => t.name)
    expect(names).toEqual(['Základy', 'Střelba', 'Přihrávky', 'Obrana'])
  })

  it('duration-asc sorts by shortest first', () => {
    const result = sortTrainings(TRAININGS, 'duration-asc')
    const durations = result.map((t) => t.duration)
    expect(durations).toEqual([45, 60, 75, 90])
  })

  it('duration-desc sorts by longest first', () => {
    const result = sortTrainings(TRAININGS, 'duration-desc')
    const durations = result.map((t) => t.duration)
    expect(durations).toEqual([90, 75, 60, 45])
  })

  it('does not mutate the original list', () => {
    const original = [...TRAININGS]
    sortTrainings(TRAININGS, 'name-asc')
    expect(TRAININGS.map((t) => t.name)).toEqual(original.map((t) => t.name))
  })

  it('returns empty array when given empty input', () => {
    expect(sortTrainings([], 'name-asc')).toEqual([])
    expect(sortTrainings([], 'duration-desc')).toEqual([])
  })

  it('single-item list is returned unchanged', () => {
    const single = [makeTraining(1, 'Jen jeden', 30)]
    const result = sortTrainings(single, 'name-asc')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Jen jeden')
  })

  it('duration-asc treats missing duration (0) as shortest', () => {
    const list = [
      makeTraining(1, 'A', 30),
      makeTraining(2, 'B', 0), // no duration set
    ]
    const result = sortTrainings(list, 'duration-asc')
    expect(result[0].name).toBe('B')
  })

  it('all SortKey values produce a result without throwing', () => {
    const keys: SortKey[] = ['name-asc', 'name-desc', 'duration-asc', 'duration-desc']
    for (const key of keys) {
      expect(() => sortTrainings(TRAININGS, key)).not.toThrow()
    }
  })
})
