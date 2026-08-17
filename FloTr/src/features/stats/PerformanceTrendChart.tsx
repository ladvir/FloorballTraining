import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { format, parseISO } from 'date-fns'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { dfLocale } from '../../utils/dateLocale'
import { statTrackersApi } from '../../api/index'
import type { PlayerStatsBySeasonDto } from '../../types/domain.types'

type Metric = 'points' | 'goals' | 'assists'

interface Props {
  memberId: number
}

/** Performance trend across matches (goals / assists / points per game) — Recharts. */
export function PerformanceTrendChart({ memberId }: Props) {
  const { t } = useTranslation()
  const [metric, setMetric] = useState<Metric>('points')

  const { data, isLoading } = useQuery({
    queryKey: ['stats-member-scoring', memberId],
    queryFn: () => statTrackersApi.memberSummary(memberId, 0),
  })

  const chartData = useMemo(() => buildSeries(data ?? []), [data])

  if (isLoading) return <LoadingSpinner />

  const metricLabels: Record<Metric, string> = {
    points: t('stats.trendPoints'),
    goals: t('stats.trendGoals'),
    assists: t('stats.trendAssists'),
  }

  return (
    <Card>
      <CardContent className="py-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            {t('stats.performanceTrend')}
          </h3>
          <select
            aria-label={t('stats.metricLabel')}
            value={metric}
            onChange={(e) => setMetric(e.target.value as Metric)}
            className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:border-sky-400 focus:outline-none"
          >
            <option value="points">{metricLabels.points}</option>
            <option value="goals">{metricLabels.goals}</option>
            <option value="assists">{metricLabels.assists}</option>
          </select>
        </div>

        {chartData.length < 2 ? (
          <p className="py-3 text-center text-sm text-gray-500">{t('stats.trendNoData')}</p>
        ) : (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickMargin={4} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  width={40}
                  allowDecimals={false}
                  domain={[0, 'auto']}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  labelStyle={{ color: '#64748b' }}
                />
                <Line
                  type="monotone"
                  dataKey={metric}
                  name={metricLabels[metric]}
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function buildSeries(groups: PlayerStatsBySeasonDto[]) {
  return groups
    .flatMap((g) => g.events)
    .filter((e) => e.eventCategory === 0 && e.scoring != null)
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
    .map((e) => ({
      date: format(parseISO(e.eventDate), 'd.M.yy', { locale: dfLocale() }),
      goals: e.scoring!.goals,
      assists: e.scoring!.assists,
      points: e.scoring!.points,
    }))
}
