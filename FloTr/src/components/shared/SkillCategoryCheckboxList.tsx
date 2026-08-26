import { useMemo } from 'react'
import { skillPalette } from '../../utils/skillColors'
import type { SkillCatalogEntryDto } from '../../types/domain.types'

interface Props {
  skills: SkillCatalogEntryDto[]
  selectedIds: number[]
  onChange: (ids: number[]) => void
}

/** Skill filter list grouped by category — checking a category toggles all its skills at once. */
export function SkillCategoryCheckboxList({ skills, selectedIds, onChange }: Props) {
  const groups = useMemo(() => {
    const map = new Map<number, { categoryName: string; skills: SkillCatalogEntryDto[] }>()
    for (const skill of skills) {
      if (!map.has(skill.categoryId)) {
        map.set(skill.categoryId, { categoryName: skill.categoryName, skills: [] })
      }
      map.get(skill.categoryId)!.skills.push(skill)
    }
    return Array.from(map.entries())
  }, [skills])

  const toggleOne = (id: number) =>
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id])

  const toggleCategory = (ids: number[]) => {
    const allSelected = ids.every((id) => selectedIds.includes(id))
    onChange(
      allSelected
        ? selectedIds.filter((id) => !ids.includes(id))
        : [...new Set([...selectedIds, ...ids])]
    )
  }

  return (
    <>
      {groups.map(([categoryId, group]) => {
        const ids = group.skills.map((s) => s.skillId)
        const allSelected = ids.every((id) => selectedIds.includes(id))
        const someSelected = !allSelected && ids.some((id) => selectedIds.includes(id))
        const palette = skillPalette(categoryId)
        return (
          <div key={categoryId}>
            <label
              className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm font-semibold"
              style={{ backgroundColor: palette.categoryBg, color: palette.categoryText }}
            >
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected
                }}
                onChange={() => toggleCategory(ids)}
                className="rounded border-gray-300 focus:ring-sky-500"
              />
              {group.categoryName}
            </label>
            {group.skills.map((skill, idx) => {
              const skillDot = skillPalette(categoryId, idx, group.skills.length)
              return (
                <label
                  key={skill.skillId}
                  className="flex cursor-pointer items-center gap-2 py-1.5 pl-8 pr-3 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(skill.skillId)}
                    onChange={() => toggleOne(skill.skillId)}
                    className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span
                    className="h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: skillDot.dot }}
                  />
                  <span className="text-sm">{skill.skillName}</span>
                </label>
              )
            })}
          </div>
        )
      })}
    </>
  )
}
