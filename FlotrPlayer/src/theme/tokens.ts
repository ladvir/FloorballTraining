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

/** Averages (e.g. 1.8) round to the nearest whole grade to pick a color band. */
export const colorForGrade = (grade: number): string => {
  const rounded = Math.min(5, Math.max(1, Math.round(grade))) as 1 | 2 | 3 | 4 | 5
  return gradeColors[rounded]
}

/** Goalkeeper card/avatar accent (design/images/13-goalkeeper-card.png) - amber instead of the
 * default blue/violet gradient, so a goalkeeper's card reads as a distinct position at a glance. */
export const goalkeeperAccent = {
  start: '#F59E0B',
  end: '#F97316',
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 26,
  pill: 999,
} as const

/** design/images/01-design-system.png's "Typography" panel: Display Bold 48 / Heading Bold 32 /
 * Body Regular 16 / Caption Medium 12. */
export const typography = {
  display: { fontSize: 48, fontWeight: '700' as const, lineHeight: 54 },
  heading: { fontSize: 32, fontWeight: '700' as const, lineHeight: 38 },
  title: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 22 },
  bodyBold: { fontSize: 16, fontWeight: '600' as const, lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
}

export const gradients = {
  /** Primary button / card border / active-tab fill - the one gradient pair used everywhere. */
  primary: [colors.gradientStart, colors.gradientEnd] as const,
  /** design/images/06-splash.png, 08-login.png: soft radial glow blobs behind content, not a
   * flat fill - Screen.tsx layers a couple of these instead of a single linear wash. */
  glow: [colors.gradientStart, 'transparent'] as const,
  goalkeeper: [goalkeeperAccent.start, goalkeeperAccent.end] as const,
}

/** BlurView-backed glass surfaces (GlassCard) - alpha layered over the blur, not a solid fill,
 * so content behind the blur still shows through per design/README.md's "glassmorphism" spec. */
export const glass = {
  // Bumped from an earlier 0.06/0.14 pass - verified in-browser against Screen's dark gradient,
  // flat (non-blurred) surfaces like search bars/chips read as an almost invisible smudge at
  // that alpha. GlassCard's own BlurView backdrop blur gives it some visible edge even at low
  // alpha, but bare `glass.fill` usages (no blur) need this to read as a distinct control at rest.
  fill: 'rgba(255,255,255,0.1)',
  fillStrong: 'rgba(255,255,255,0.14)',
  border: 'rgba(255,255,255,0.2)',
  tint: 'dark' as const,
  intensity: 40,
}
