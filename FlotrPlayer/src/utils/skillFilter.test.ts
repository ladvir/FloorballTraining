import { describe, expect, it } from 'vitest'
import { filterSkillSections } from './skillFilter'
import type { PlayerSkillCategoryDto, PlayerSkillDto } from '../types/domain.types'

const skill = (skillId: number, name: string, grade: number | null): PlayerSkillDto => ({
  skillId,
  name,
  sortOrder: skillId,
  grade,
  targetGrade: null,
  recommendation: null,
  ratedAt: null,
  ratedByUserName: null,
  isFocus: false,
})

const cat = (categoryId: number, name: string, skills: PlayerSkillDto[]): PlayerSkillCategoryDto => ({
  categoryId,
  name,
  sortOrder: categoryId,
  position: 'FieldPlayer',
  skills,
})

const categories: PlayerSkillCategoryDto[] = [
  cat(1, 'Technika', [skill(1, 'Vedení míčku', 2), skill(2, 'Přihrávka', null), skill(3, 'Střelba', 5)]),
  cat(2, 'Kondice', [skill(4, 'Vytrvalost', null), skill(5, 'Rychlost', null)]),
  cat(3, 'Taktika', [skill(6, 'Čtení hry', 1)]),
]

const idsOf = (sections: ReturnType<typeof filterSkillSections>) =>
  sections.flatMap((s) => s.skills.map((sk) => sk.skillId))

describe('filterSkillSections', () => {
  it("'all' hides never-rated skills and drops categories left empty", () => {
    const sections = filterSkillSections(categories, 'all', null, '')
    // skill 2 (null), 4 (null), 5 (null) gone; category 2 entirely gone.
    expect(idsOf(sections)).toEqual([1, 3, 6])
    expect(sections.map((s) => s.categoryId)).toEqual([1, 3])
  })

  it("'category' hides never-rated skills and scopes to the chosen category", () => {
    expect(idsOf(filterSkillSections(categories, 'category', 1, ''))).toEqual([1, 3])
    // category 2 has only unrated skills → no section at all.
    expect(filterSkillSections(categories, 'category', 2, '')).toEqual([])
  })

  it("'weakest' keeps only grade 4-5, 'strongest' only grade 1", () => {
    expect(idsOf(filterSkillSections(categories, 'weakest', null, ''))).toEqual([3])
    expect(idsOf(filterSkillSections(categories, 'strongest', null, ''))).toEqual([6])
  })

  it('search matches by name case-insensitively, still respecting the grade rule', () => {
    expect(idsOf(filterSkillSections(categories, 'all', null, 'míčku'))).toEqual([1])
    // "Přihrávka" matches the query but is unrated → still excluded in 'all'.
    expect(idsOf(filterSkillSections(categories, 'all', null, 'přih'))).toEqual([])
  })
})
