// Tokens extracted from the Higgsfield design system mockup (design/images/01-design-system.png,
// see design/README.md). Grade colors follow spec section 9 exactly: 1 is best/green, 5 is
// worst/red - the opposite of a FIFA-style rating, which several mockups got backwards.
export const colors = {
  background: '#0B1120',
  backgroundElevated: '#141E33',
  cardBorder: '#3B82F6',
  accent: '#3B82F6',
  gradientStart: '#3B82F6',
  gradientEnd: '#8B5CF6',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  danger: '#EF4444',
} as const

/** Grade 1 (best) through 5 (worst) - spec section 9's fixed color table. */
export const gradeColors: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: '#22C55E',
  2: '#A3E635',
  3: '#EAB308',
  4: '#F97316',
  5: '#EF4444',
}

export const gradeLabels: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Výborná úroveň',
  2: 'Velmi dobrá úroveň',
  3: 'Dobrá úroveň',
  4: 'Slabší úroveň',
  5: 'Nedostatečná úroveň',
}

/** Averages (e.g. 1.8) round to the nearest whole grade to pick a color band. */
export const colorForGrade = (grade: number): string => {
  const rounded = Math.min(5, Math.max(1, Math.round(grade))) as 1 | 2 | 3 | 4 | 5
  return gradeColors[rounded]
}
