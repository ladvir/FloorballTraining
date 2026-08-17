import { describe, it, expect } from 'vitest'
import { buildRadarData } from './skillRadar'
import type { PlayerSkillCategoryDto } from '../../types/domain.types'

function category(
  categoryId: number,
  name: string,
  skills: { skillId: number; grade?: number | null }[]
): PlayerSkillCategoryDto {
  return {
    categoryId,
    name,
    sortOrder: 0,
    position: 'FieldPlayer',
    skills: skills.map((s) => ({
      skillId: s.skillId,
      name: `Skill${s.skillId}`,
      sortOrder: 0,
      grade: s.grade,
    })),
  }
}

describe('buildRadarData', () => {
  it('averages rated skills within a category', () => {
    const categories = [
      category(1, 'Ball control', [
        { skillId: 1, grade: 2 },
        { skillId: 2, grade: 4 },
      ]),
    ]
    const [point] = buildRadarData(categories, {})
    expect(point.avg).toBe(3)
  })

  it('inverts the average onto a 1-5 scale so a higher value means better performance', () => {
    const categories = [category(1, 'Ball control', [{ skillId: 1, grade: 2 }])]
    const [point] = buildRadarData(categories, {})
    expect(point.avg).toBe(2)
    expect(point.inverted).toBe(4) // 6 - 2
  })

  it('ignores never-rated skills when averaging', () => {
    const categories = [
      category(1, 'Ball control', [
        { skillId: 1, grade: 2 },
        { skillId: 2, grade: null },
      ]),
    ]
    const [point] = buildRadarData(categories, {})
    expect(point.avg).toBe(2)
  })

  it('returns null avg and 0 inverted for a category with no rated skills', () => {
    const categories = [category(1, 'Ball control', [{ skillId: 1, grade: null }])]
    const [point] = buildRadarData(categories, {})
    expect(point.avg).toBeNull()
    expect(point.inverted).toBe(0)
  })

  it('applies an in-progress (unsaved) edit instead of the saved grade', () => {
    const categories = [category(1, 'Ball control', [{ skillId: 1, grade: 4 }])]
    const [point] = buildRadarData(categories, {
      1: { grade: 1, targetGrade: null, recommendation: '' },
    })
    expect(point.avg).toBe(1)
  })

  it('produces one point per category in the same order', () => {
    const categories = [
      category(1, 'Ball control', [{ skillId: 1, grade: 1 }]),
      category(2, 'Finishing', [{ skillId: 2, grade: 5 }]),
    ]
    const data = buildRadarData(categories, {})
    expect(data.map((d) => d.category)).toEqual(['Ball control', 'Finishing'])
  })
})
