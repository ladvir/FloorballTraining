import type { SeasonXpDto } from '../../types/domain.types'

/** Seasonal form = stars of the latest season on record (highest seasonId); 0 when none. */
export function latestSeasonStars(bySeason: SeasonXpDto[]): number {
  if (bySeason.length === 0) return 0
  return bySeason.reduce((a, b) => (b.seasonId > a.seasonId ? b : a)).stars
}
