export function avgGrade(grades: number[]): number | null {
  if (grades.length === 0) return null
  const sum = grades.reduce((acc, g) => acc + g, 0)
  return Math.round((sum / grades.length) * 10) / 10
}

export function formatCanadianScore(goals: number, assists: number): string {
  const points = goals + assists
  return `${goals}+${assists}=${points}`
}

export function calculateScoringRate(points: number, games: number): number {
  if (games <= 0) return 0
  return Math.round((points / games) * 100) / 100
}
