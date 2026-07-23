import type { PlayerSkillCategoryDto, PlayerSkillDto } from '../types/domain.types'

export interface CategoryAverage {
  categoryId: number
  name: string
  average: number
}

export interface StatsSummary {
  overallAverage: number | null
  categoryAverages: CategoryAverage[]
  bestSkills: PlayerSkillDto[]
  skillsToImprove: PlayerSkillDto[]
}

const average = (skills: PlayerSkillDto[]): number | null => {
  const rated = skills.filter((s) => s.grade != null)
  if (rated.length === 0) return null
  return rated.reduce((sum, s) => sum + s.grade!, 0) / rated.length
}

// Spec section 12: overall average, per-category average, best skills (grade 1) and skills to
// improve (grade 4-5) - all derived client-side from the already-fetched card, same approach as
// summarizeCard for the home screen. Categories with no rated skills are dropped rather than
// plotted as zero, matching how the home screen's average also ignores unrated skills.
export function summarizeStats(categories: PlayerSkillCategoryDto[]): StatsSummary {
  const allSkills = categories.flatMap((c) => c.skills)
  const categoryAverages = categories
    .map((c) => ({ categoryId: c.categoryId, name: c.name, average: average(c.skills) }))
    .filter((c): c is CategoryAverage => c.average != null)

  return {
    overallAverage: average(allSkills),
    categoryAverages,
    bestSkills: allSkills.filter((s) => s.grade === 1),
    skillsToImprove: allSkills.filter((s) => s.grade != null && s.grade >= 4),
  }
}
