import type { PlayerSkillCategoryDto } from '../../types/domain.types'
import type { PendingEdit } from './SkillDetailModal'

export interface RadarCategoryPoint {
  category: string
  /** Average grade (1 best–5 worst) across the category's rated skills, or null if none rated. */
  avg: number | null
  /** Inverted for the chart axis (6 - avg) so a bigger area means better performance; 0 when unrated. */
  inverted: number
}

/** Per-category average grade for the radar chart, applying any in-progress (unsaved) edits first. */
export function buildRadarData(
  categories: PlayerSkillCategoryDto[],
  pending: Record<number, PendingEdit>
): RadarCategoryPoint[] {
  return categories.map((cat) => {
    const grades = cat.skills
      .map((s) => pending[s.skillId]?.grade ?? s.grade)
      .filter((g): g is number => g != null)
    const avg = grades.length ? grades.reduce((a, b) => a + b, 0) / grades.length : null
    return {
      category: cat.name,
      avg,
      inverted: avg != null ? 6 - avg : 0,
    }
  })
}
