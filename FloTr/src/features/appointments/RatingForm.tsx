import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ratingsApi } from '../../api/index'
import { Button } from '../../components/ui/Button'

const gradeColors = ['bg-green-500', 'bg-lime-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500']

interface Props {
  appointmentId: number
  /** Fired after the rating is created. */
  onSaved?: () => void
  onCancel?: () => void
}

/** Create-a-rating form (grade 1–5 + optional comment). Shared by the appointment detail modal
 * and the live training runner's finish step so there is one rating UI, not two. */
export function RatingForm({ appointmentId, onSaved, onCancel }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [grade, setGrade] = useState(1)
  const [comment, setComment] = useState('')

  const gradeLabels = [
    t('appointments.gradeExcellent'),
    t('appointments.gradeGood'),
    t('appointments.gradeOk'),
    t('appointments.gradeSufficient'),
    t('appointments.gradeFailed'),
  ]

  const createMutation = useMutation({
    mutationFn: ratingsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratings'] })
      onSaved?.()
    },
  })

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-600">{t('appointments.ratingGrade')}</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGrade(g)}
              className={`h-8 w-8 rounded-full text-sm font-bold text-white ${gradeColors[g - 1]} ${
                grade === g ? 'ring-2 ring-offset-1 ring-gray-400' : 'opacity-40 hover:opacity-70'
              }`}
              title={gradeLabels[g - 1]}
            >
              {g}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500">{gradeLabels[grade - 1]}</span>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t('appointments.ratingComment')}
        className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
        rows={2}
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          loading={createMutation.isPending}
          onClick={() =>
            createMutation.mutate({ appointmentId, grade, comment: comment || undefined })
          }
        >
          {t('appointments.ratingSave')}
        </Button>
        {onCancel && (
          <Button size="sm" variant="outline" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        )}
      </div>
      {createMutation.isError && (
        <p className="text-xs text-red-500">
          {(createMutation.error as { response?: { data?: { message?: string } } })?.response?.data
            ?.message || t('appointments.ratingError')}
        </p>
      )}
    </div>
  )
}
