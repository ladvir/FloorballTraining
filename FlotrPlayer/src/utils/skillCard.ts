import type { PlayerSkillCardDto } from '../types/domain.types'

// The card/roster DTOs carry only per-skill grades (spec section 9/10) - the "celkové hodnocení"
// shown on the home screen (section 7) is derived client-side rather than duplicated as a
// separate backend field.
export const summarizeCard = (card: PlayerSkillCardDto): number | null => {
  const ratedSkills = card.categories.flatMap((c) => c.skills).filter((s) => s.grade != null)
  if (ratedSkills.length === 0) return null
  return ratedSkills.reduce((sum, s) => sum + s.grade!, 0) / ratedSkills.length
}
