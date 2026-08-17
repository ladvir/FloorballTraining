import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { format, parseISO } from 'date-fns'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import { Modal } from '../../components/shared/Modal'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { dfLocale } from '../../utils/dateLocale'
import { playerSkillsApi } from '../../api/index'
import type { PlayerSkillDto } from '../../types/domain.types'

export interface PendingEdit {
  grade: number
  targetGrade: number | null
  recommendation: string
}

const GRADE_COLORS = ['bg-green-500', 'bg-lime-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500']

export function SkillGradeBadge({
  grade,
  size = 'md',
}: {
  grade?: number | null
  size?: 'sm' | 'md' | 'lg'
}) {
  const dim =
    size === 'lg' ? 'h-14 w-14 text-xl' : size === 'sm' ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm'
  if (!grade) {
    return (
      <span
        className={`inline-flex ${dim} flex-shrink-0 items-center justify-center rounded-full bg-gray-200 font-bold text-gray-400`}
      >
        –
      </span>
    )
  }
  return (
    <span
      className={`inline-flex ${dim} flex-shrink-0 items-center justify-center rounded-full font-bold text-white ${GRADE_COLORS[grade - 1]}`}
    >
      {grade}
    </span>
  )
}

interface Props {
  memberId: number
  skill: PlayerSkillDto
  pendingEdit?: PendingEdit
  editable: boolean
  onClose: () => void
  onSave: (edit: PendingEdit) => void
}

/** Skill detail (spec section 11): grade, target grade, coach recommendation, and history trend. */
export function SkillDetailModal({
  memberId,
  skill,
  pendingEdit,
  editable,
  onClose,
  onSave,
}: Props) {
  const { t } = useTranslation()
  const [grade, setGrade] = useState(pendingEdit?.grade ?? skill.grade ?? 0)
  const [targetGrade, setTargetGrade] = useState(pendingEdit?.targetGrade ?? skill.targetGrade ?? 0)
  const [recommendation, setRecommendation] = useState(
    pendingEdit?.recommendation ?? skill.recommendation ?? ''
  )

  const { data: history, isLoading } = useQuery({
    queryKey: ['player-skill-history', memberId, skill.skillId],
    queryFn: () => playerSkillsApi.getHistory(memberId, skill.skillId),
  })

  const chartData = useMemo(
    () =>
      (history ?? []).map((h) => ({
        date: format(parseISO(h.ratedAt), 'd.M.yy', { locale: dfLocale() }),
        grade: h.grade,
      })),
    [history]
  )

  const gradeLabels = [
    t('playerSkills.gradeExcellent'),
    t('playerSkills.gradeVeryGood'),
    t('playerSkills.gradeGood'),
    t('playerSkills.gradeWeak'),
    t('playerSkills.gradeInsufficient'),
  ]

  const canSave = editable && grade >= 1 && grade <= 5

  return (
    <Modal isOpen onClose={onClose} title={skill.name} maxWidth="lg">
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <SkillGradeBadge grade={grade || skill.grade} size="lg" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {grade ? gradeLabels[grade - 1] : t('playerSkills.notRatedYet')}
            </p>
            {skill.ratedAt && (
              <p className="text-xs text-gray-500">
                {t('playerSkills.lastRatedAt', {
                  date: format(parseISO(skill.ratedAt), 'd.M.yyyy', { locale: dfLocale() }),
                })}
                {skill.ratedByUserName ? ` · ${skill.ratedByUserName}` : ''}
              </p>
            )}
          </div>
        </div>

        {editable && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-gray-500">{t('playerSkills.grade')}</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGrade(g)}
                  className={`h-9 w-9 rounded-full text-sm font-bold text-white ${GRADE_COLORS[g - 1]} ${
                    grade === g ? 'ring-2 ring-gray-400 ring-offset-1' : 'opacity-50'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="mb-1.5 text-xs font-medium text-gray-500">
            {t('playerSkills.targetGrade')}
          </p>
          {editable ? (
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setTargetGrade(g)}
                  className={`h-8 w-8 rounded-full text-xs font-bold text-white ${GRADE_COLORS[g - 1]} ${
                    targetGrade === g ? 'ring-2 ring-gray-400 ring-offset-1' : 'opacity-50'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          ) : (
            <SkillGradeBadge grade={skill.targetGrade} size="sm" />
          )}
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-gray-500">
            {t('playerSkills.recommendation')}
          </p>
          {editable ? (
            <textarea
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
              placeholder={t('playerSkills.recommendationPlaceholder')}
            />
          ) : (
            <p className="text-sm text-gray-700">{skill.recommendation || '–'}</p>
          )}
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-gray-500">
            {t('playerSkills.historyTitle')}
          </p>
          {isLoading ? (
            <LoadingSpinner />
          ) : chartData.length < 2 ? (
            <p className="py-3 text-center text-xs text-gray-500">
              {t('playerSkills.historyNoData')}
            </p>
          ) : (
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis
                    domain={[1, 5]}
                    reversed
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    width={30}
                  />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Line
                    type="monotone"
                    dataKey="grade"
                    stroke="#0284c7"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            {editable ? t('common.cancel') : t('common.close')}
          </Button>
          {editable && (
            <Button
              size="sm"
              disabled={!canSave}
              onClick={() => onSave({ grade, targetGrade: targetGrade || null, recommendation })}
            >
              {t('playerSkills.applyChange')}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
