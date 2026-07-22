import type { PlayerSkillCardDto } from '../types/domain.types'

export interface CardSummary {
  averageGrade: number | null
  lastRatedAt: string | null
}

// The card/roster DTOs carry only per-skill grade+ratedAt (spec section 9/10) - the "celkové
// hodnocení" and "datum posledního hodnocení" shown on the home screen (section 7) are derived
// client-side rather than duplicated as separate backend fields.
export const summarizeCard = (card: PlayerSkillCardDto): CardSummary => {
  const ratedSkills = card.categories.flatMap((c) => c.skills).filter((s) => s.grade != null)
  if (ratedSkills.length === 0) return { averageGrade: null, lastRatedAt: null }

  const averageGrade = ratedSkills.reduce((sum, s) => sum + s.grade!, 0) / ratedSkills.length
  // ISO 8601 UTC timestamps sort lexicographically the same as chronologically.
  const lastRatedAt = ratedSkills.map((s) => s.ratedAt!).reduce((latest, current) => (current > latest ? current : latest))

  return { averageGrade, lastRatedAt }
}
