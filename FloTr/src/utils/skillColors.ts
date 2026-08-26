/**
 * Deterministic color palette for skill categories/skills — no backend storage needed.
 * Each category gets its own hue (spread via the golden angle so neighbors stay visually
 * distinct as categories are added); skills within a category share that hue and vary only
 * in lightness ("subtone"), producing one coherent palette per category.
 */

const GOLDEN_ANGLE = 137.508

function categoryHue(categoryId: number): number {
  return (categoryId * GOLDEN_ANGLE) % 360
}

export interface SkillPalette {
  hue: number
  /** Very light tint — idle skill pill / category header background. */
  idleBg: string
  idleBorder: string
  idleText: string
  /** Solid tone — selected skill pill background. */
  activeBg: string
  activeBorder: string
  categoryBg: string
  categoryBorder: string
  categoryText: string
  /** Small solid dot for compact list rows (filter dropdowns). */
  dot: string
}

/**
 * @param indexInCategory position of this skill within its category's ordered skill list
 * @param categorySize total number of skills in that category
 */
export function skillPalette(
  categoryId: number,
  indexInCategory = 0,
  categorySize = 1
): SkillPalette {
  const hue = categoryHue(categoryId)
  const spread = categorySize > 1 ? (indexInCategory / (categorySize - 1)) * 16 - 8 : 0
  const activeL = 42 + spread

  return {
    hue,
    idleBg: `hsl(${hue}, 45%, 96%)`,
    idleBorder: `hsl(${hue}, 35%, 85%)`,
    idleText: `hsl(${hue}, 45%, 28%)`,
    activeBg: `hsl(${hue}, 55%, ${activeL}%)`,
    activeBorder: `hsl(${hue}, 55%, ${activeL - 8}%)`,
    categoryBg: `hsl(${hue}, 40%, 97%)`,
    categoryBorder: `hsl(${hue}, 35%, 88%)`,
    categoryText: `hsl(${hue}, 45%, 32%)`,
    dot: `hsl(${hue}, 55%, ${activeL}%)`,
  }
}
