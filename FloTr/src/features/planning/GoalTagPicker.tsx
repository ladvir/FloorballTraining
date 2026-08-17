import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { tagsApi } from '../../api/index'
import { cn } from '../../utils/cn'

const MAX_GOAL_TAGS = 3

interface GoalTagPickerProps {
  selectedIds: number[]
  onChange: (ids: number[]) => void
}

/** Chip toggle over training-goal tags (max 3), colored by the tag color. */
export function GoalTagPicker({ selectedIds, onChange }: GoalTagPickerProps) {
  const { t } = useTranslation()
  const { data: tags } = useQuery({ queryKey: ['tags'], queryFn: tagsApi.getAll })

  const goalTags = (tags ?? []).filter((tag) => tag.isTrainingGoal)

  const toggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id))
    } else if (selectedIds.length < MAX_GOAL_TAGS) {
      onChange([...selectedIds, id])
    }
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {t('planning.goalTags')}
        <span className="ml-2 text-xs font-normal text-gray-400">
          {t('planning.goalTagsHint', { max: MAX_GOAL_TAGS })}
        </span>
      </label>
      {!goalTags.length ? (
        <p className="text-sm text-gray-400">{t('planning.noGoalTags')}</p>
      ) : (
        <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto">
          {goalTags.map((tag) => {
            const selected = selectedIds.includes(tag.id)
            const full = !selected && selectedIds.length >= MAX_GOAL_TAGS
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggle(tag.id)}
                disabled={full}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                  selected
                    ? 'border-transparent text-white'
                    : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50',
                  full && 'cursor-not-allowed opacity-40'
                )}
                style={selected ? { backgroundColor: tag.color || '#0284c7' } : undefined}
              >
                {tag.name}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
