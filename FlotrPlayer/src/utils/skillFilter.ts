import type { PlayerSkillCategoryDto, PlayerSkillDto } from '../types/domain.types'

export type SkillFilterMode = 'all' | 'weakest' | 'strongest' | 'category'

export interface SkillSection {
  categoryId: number
  categoryName: string
  skills: PlayerSkillDto[]
}

// Spec section 13: filter (all / weakest 4-5 / strongest 1 / by category) + live search, always
// scoped to the currently open card - client-side only, no round-trip per keystroke.
export function filterSkillSections(
  categories: PlayerSkillCategoryDto[],
  mode: SkillFilterMode,
  categoryId: number | null,
  search: string,
): SkillSection[] {
  const query = search.trim().toLowerCase()

  return categories
    .filter((c) => mode !== 'category' || c.categoryId === categoryId)
    .map((c) => ({
      categoryId: c.categoryId,
      categoryName: c.name,
      skills: c.skills.filter((s) => {
        if (query && !s.name.toLowerCase().includes(query)) return false
        if (mode === 'weakest') return s.grade != null && s.grade >= 4
        if (mode === 'strongest') return s.grade === 1
        return true
      }),
    }))
    .filter((section) => section.skills.length > 0)
}
