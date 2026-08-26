import { skillPalette } from '../../utils/skillColors'
import type { SkillCatalogEntryDto } from '../../types/domain.types'

interface StripeSkill {
  skillId: number
  skillName: string
  skillCategoryId: number
}

/**
 * One thin colored vertical stripe per skill (deduped), colored by its category — skill name as
 * tooltip. `catalog` (the same ['skillCatalog'] data the training form's skill picker uses) lets
 * each skill's shade match its index-in-category there exactly; without it every skill in a
 * category falls back to the same mid-tone shade.
 *
 * `goalSkillIds` marks which stripes are the training's ≤3 stated goal skills (TrainingGoalSkill1/2/3)
 * with a darker rim, distinguishing them from the unlimited set of skills merely touched by the
 * training's activities (ActivitySkill) — the two are easy to conflate since they share one palette.
 */
export function SkillColorStripes({
  skills,
  catalog,
  goalSkillIds,
}: {
  skills: StripeSkill[]
  catalog?: SkillCatalogEntryDto[]
  goalSkillIds?: number[]
}) {
  const unique = Array.from(new Map(skills.map((s) => [s.skillId, s])).values())
  if (unique.length === 0) return null

  const categoryOrder = new Map<number, number[]>()
  for (const s of catalog ?? []) {
    if (!categoryOrder.has(s.categoryId)) categoryOrder.set(s.categoryId, [])
    categoryOrder.get(s.categoryId)!.push(s.skillId)
  }

  const goalIds = new Set(goalSkillIds ?? [])
  const goalSkills = unique.filter((s) => goalIds.has(s.skillId))
  const otherSkills = unique.filter((s) => !goalIds.has(s.skillId))

  const renderStripe = (skill: StripeSkill) => {
    const order = categoryOrder.get(skill.skillCategoryId)
    const idx = Math.max(order?.indexOf(skill.skillId) ?? 0, 0)
    const size = order?.length ?? 1
    const palette = skillPalette(skill.skillCategoryId, idx, size)
    const isGoal = goalIds.has(skill.skillId)
    return (
      <span
        key={skill.skillId}
        title={skill.skillName}
        className={`h-3 w-2.5 rounded-sm ${isGoal ? 'border' : ''}`}
        style={{
          backgroundColor: palette.dot,
          borderColor: isGoal ? palette.activeBorder : undefined,
        }}
      />
    )
  }

  return (
    <div className="mt-1.5 flex items-stretch gap-1">
      {goalSkills.map(renderStripe)}
      {goalSkills.length > 0 && otherSkills.length > 0 && <span className="w-2.5" />}
      {otherSkills.map(renderStripe)}
    </div>
  )
}
