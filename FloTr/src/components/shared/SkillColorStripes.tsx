import { skillPalette } from '../../utils/skillColors'

interface StripeSkill {
  skillId: number
  skillName: string
  skillCategoryId: number
}

/** One thin colored vertical stripe per skill (deduped), colored by its category — skill name as tooltip. */
export function SkillColorStripes({ skills }: { skills: StripeSkill[] }) {
  const unique = Array.from(new Map(skills.map((s) => [s.skillId, s])).values())
  if (unique.length === 0) return null

  return (
    <div className="mt-1.5 flex items-stretch gap-0.5">
      {unique.map((skill) => (
        <span
          key={skill.skillId}
          title={skill.skillName}
          className="h-3 w-1.5 rounded-sm"
          style={{ backgroundColor: skillPalette(skill.skillCategoryId).dot }}
        />
      ))}
    </div>
  )
}
