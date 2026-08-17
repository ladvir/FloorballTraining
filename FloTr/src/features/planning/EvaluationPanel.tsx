import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { BarChart2, ChevronDown, ChevronUp, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { format, parseISO } from 'date-fns'
import { planningApi } from '../../api/planning.api'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { dfLocale } from '../../utils/dateLocale'
import { cn } from '../../utils/cn'
import type { MesocycleDto } from '../../types/domain.types'
import { buildCoverageRows, deltaImproves, gradeColorClass } from './evaluationUtils'

interface EvaluationPanelProps {
  mesocycle: MesocycleDto
}

/** Collapsible evaluation of a mesocycle; the summary is fetched on first expand. */
export function EvaluationPanel({ mesocycle }: EvaluationPanelProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  const { data: evaluation, isLoading } = useQuery({
    queryKey: ['mesocycleEvaluation', mesocycle.id],
    queryFn: () => planningApi.getEvaluation(mesocycle.id),
    enabled: expanded,
  })

  const coverageRows = useMemo(
    () =>
      evaluation
        ? buildCoverageRows(evaluation.total, evaluation.microcycles, t('planning.evalTotal'))
        : [],
    [evaluation, t]
  )

  return (
    <div className="border-t border-gray-100 pt-3">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-2 text-left text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        <BarChart2 className="h-4 w-4 text-sky-500" />
        {t('planning.evaluation')}
        {expanded ? (
          <ChevronUp className="ml-auto h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="ml-auto h-4 w-4 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="mt-3 space-y-4">
          {isLoading || !evaluation ? (
            <LoadingSpinner />
          ) : (
            <>
              {/* Headline stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-sky-50 px-2 py-2">
                  <p className="text-lg font-bold text-sky-700">
                    {evaluation.total.goalCoveragePercent} %
                  </p>
                  <p className="text-[11px] text-gray-500">{t('planning.evalCoverage')}</p>
                </div>
                <div className="rounded-lg bg-emerald-50 px-2 py-2">
                  <p className="text-lg font-bold text-emerald-700">
                    {evaluation.total.attendanceRatePercent} %
                  </p>
                  <p className="text-[11px] text-gray-500">{t('planning.evalAttendance')}</p>
                </div>
                <div className="rounded-lg bg-amber-50 px-2 py-2">
                  {evaluation.total.averageGrade != null ? (
                    <p className="text-lg font-bold text-amber-700">
                      <span
                        className={cn(
                          'inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-sm text-white',
                          gradeColorClass(evaluation.total.averageGrade)
                        )}
                      >
                        {evaluation.total.averageGrade}
                      </span>
                    </p>
                  ) : (
                    <p className="text-lg font-bold text-gray-300">—</p>
                  )}
                  <p className="text-[11px] text-gray-500">{t('planning.evalGrade')}</p>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                {t('planning.evalTrainingsInfo', {
                  held: evaluation.total.trainingAppointmentsCount,
                  linked: evaluation.total.withLinkedTrainingCount,
                  minutes: evaluation.total.totalTrainingMinutes,
                })}
              </p>

              {/* Coverage stacked bar per block */}
              {evaluation.total.totalTrainingMinutes > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium text-gray-600">
                    {t('planning.evalCoverageChart')}
                  </p>
                  <ResponsiveContainer width="100%" height={40 + coverageRows.length * 28}>
                    <BarChart data={coverageRows} layout="vertical" margin={{ left: 8, right: 8 }}>
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={90}
                        tick={{ fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value, name) => [
                          `${value} min`,
                          name === 'matched'
                            ? t('planning.evalMatchedMinutes')
                            : t('planning.evalOtherMinutes'),
                        ]}
                      />
                      <Legend
                        formatter={(value: string) =>
                          value === 'matched'
                            ? t('planning.evalMatchedMinutes')
                            : t('planning.evalOtherMinutes')
                        }
                        wrapperStyle={{ fontSize: 10 }}
                      />
                      <Bar dataKey="matched" stackId="cov" fill="#0284c7" radius={[2, 0, 0, 2]} />
                      <Bar dataKey="other" stackId="cov" fill="#e2e8f0" radius={[0, 2, 2, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Per-tag coverage */}
              {evaluation.total.perTag.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {evaluation.total.perTag.map((tag) => (
                    <span
                      key={tag.tagId}
                      className="rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                      style={{ backgroundColor: tag.color || '#0284c7' }}
                      title={t('planning.evalTagTrainings', { count: tag.trainingsCount })}
                    >
                      {tag.tagName}: {tag.matchedMinutes} min
                    </span>
                  ))}
                </div>
              )}

              {/* Attendance + ratings detail */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                <span>
                  {t('planning.evalPresent')}: <b>{evaluation.total.presentCount}</b>
                </span>
                <span>
                  {t('planning.evalAbsent')}: <b>{evaluation.total.absentCount}</b>
                </span>
                <span>
                  {t('planning.evalExcused')}: <b>{evaluation.total.excusedCount}</b>
                </span>
                {evaluation.total.coachAverageGrade != null && (
                  <span>
                    {t('planning.evalCoachGrade')}: <b>{evaluation.total.coachAverageGrade}</b>
                  </span>
                )}
                {evaluation.total.playerAverageGrade != null && (
                  <span>
                    {t('planning.evalPlayerGrade')}: <b>{evaluation.total.playerAverageGrade}</b>
                  </span>
                )}
              </div>

              {/* Test progression */}
              {evaluation.testProgression.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium text-gray-600">
                    {t('planning.evalTests')}
                  </p>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-[10px] uppercase tracking-wide text-gray-400">
                        <th className="py-1 pr-2">{t('planning.evalTestName')}</th>
                        <th className="py-1 pr-2">{t('planning.evalTestStart')}</th>
                        <th className="py-1 pr-2">{t('planning.evalTestEnd')}</th>
                        <th className="py-1 pr-2">{t('planning.evalTestDelta')}</th>
                        <th className="py-1">{t('planning.evalTestPlayers')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evaluation.testProgression.map((test) => {
                        const improves = deltaImproves(test)
                        return (
                          <tr key={test.testDefinitionId} className="border-t border-gray-100">
                            <td className="py-1 pr-2 font-medium text-gray-700">{test.name}</td>
                            <td className="py-1 pr-2">
                              {test.startAvg} {test.unit}
                            </td>
                            <td className="py-1 pr-2">
                              {test.endAvg} {test.unit}
                            </td>
                            <td
                              className={cn(
                                'py-1 pr-2 font-semibold',
                                improves === true && 'text-green-600',
                                improves === false && 'text-red-500',
                                improves === null && 'text-gray-400'
                              )}
                            >
                              <span className="inline-flex items-center gap-0.5">
                                {improves === true && <TrendingUp className="h-3 w-3" />}
                                {improves === false && <TrendingDown className="h-3 w-3" />}
                                {improves === null && <Minus className="h-3 w-3" />}
                                {test.delta != null && test.delta > 0 ? '+' : ''}
                                {test.delta} {test.unit}
                              </span>
                            </td>
                            <td className="py-1 text-gray-500">
                              {t('planning.evalImprovedWorsened', {
                                improved: test.improvedCount,
                                worsened: test.worsenedCount,
                                total: test.membersMeasuredBoth,
                              })}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {evaluation.testingAppointments.length > 0 && (
                    <p className="mt-1 text-[10px] text-gray-400">
                      {t('planning.evalTestingEvents')}:{' '}
                      {evaluation.testingAppointments
                        .map(
                          (a) =>
                            `${a.name} (${format(parseISO(a.start), 'd.M.yyyy', { locale: dfLocale() })})`
                        )
                        .join(', ')}
                    </p>
                  )}
                </div>
              )}

              {evaluation.total.trainingAppointmentsCount === 0 &&
                evaluation.testProgression.length === 0 && (
                  <p className="text-sm text-gray-400">{t('planning.evalEmpty')}</p>
                )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
