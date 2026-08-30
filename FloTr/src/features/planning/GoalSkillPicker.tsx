import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { playerSkillsApi } from '../../api/index'
import { skillPalette } from '../../utils/skillColors'
import { cn } from '../../utils/cn'

const MAX_GOAL_SKILLS = 3

interface GoalSkillPickerProps {
  selectedIds: number[]
  onChange: (ids: number[]) => void
}

/** Chip toggle over the skill catalog (max 3), grouped by category and colored by category hue. */
export function GoalSkillPicker({ selectedIds, onChange }: GoalSkillPickerProps) {
  const { t } = useTranslation()
  const { data: catalog } = useQuery({
    queryKey: ['skillCatalog'],
    queryFn: playerSkillsApi.getCatalog,
  })

  const groups = useMemo(() => {
    const map = new Map<number, { name: string; skills: { id: number; name: string }[] }>()
    for (const s of catalog ?? []) {
      if (!map.has(s.categoryId)) map.set(s.categoryId, { name: s.categoryName, skills: [] })
      map.get(s.categoryId)!.skills.push({ id: s.skillId, name: s.skillName })
    }
    return [...map.entries()]
  }, [catalog])

  const toggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id))
    } else if (selectedIds.length < MAX_GOAL_SKILLS) {
      onChange([...selectedIds, id])
    }
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {t('planning.goalSkills')}
        <span className="ml-2 text-xs font-normal text-gray-400">
          {t('planning.goalSkillsHint', { max: MAX_GOAL_SKILLS })}
        </span>
      </label>
      {!groups.length ? (
        <p className="text-sm text-gray-400">{t('planning.noGoalSkills')}</p>
      ) : (
        <div className="max-h-48 space-y-2 overflow-y-auto">
          {groups.map(([categoryId, group]) => {
            const palette = skillPalette(categoryId)
            return (
              <div key={categoryId}>
                <p className="mb-1 text-xs font-semibold" style={{ color: palette.categoryText }}>
                  {group.name}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {group.skills.map((skill) => {
                    const selected = selectedIds.includes(skill.id)
                    const full = !selected && selectedIds.length >= MAX_GOAL_SKILLS
                    return (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => toggle(skill.id)}
                        disabled={full}
                        className={cn(
                          'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                          selected
                            ? 'border-transparent text-white'
                            : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50',
                          full && 'cursor-not-allowed opacity-40'
                        )}
                        style={selected ? { backgroundColor: palette.activeBg } : undefined}
                      >
                        {skill.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
