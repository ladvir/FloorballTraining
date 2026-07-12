import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { dfLocale } from '../../utils/dateLocale'
import { useTranslation } from 'react-i18next'
import {
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts'
import {
  Calendar,
  Users,
  Star,
  TrendingUp,
  CheckCircle,
  CalendarClock,
  ClipboardList,
  Medal,
  Activity,
} from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { kpiApi } from '../../api/index'

const EVENT_TYPE_COLORS: Record<number, string> = {
  0: '#0ea5e9',
  1: '#22c55e',
  2: '#f59e0b',
  3: '#ef4444',
  4: '#94a3b8',
  5: '#6366f1',
  6: '#10b981',
  7: '#64748b',
  8: '#8b5cf6',
}

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  color?: string
}

function StatCard({ label, value, sub, icon, color = 'text-sky-600' }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-4">
        <div className={`flex-shrink-0 ${color}`}>{icon}</div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

export function KpiDashboardPage() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: ['kpi', 'summary'],
    queryFn: kpiApi.getSummary,
    staleTime: 120_000,
  })

  if (isLoading) return <LoadingSpinner />
  if (!data) return null

  const EVENT_TYPE_LABELS: Record<number, string> = {
    0: t('appointments.typeTraining'),
    1: t('appointments.typeCamp'),
    2: t('appointments.typePromotion'),
    3: t('appointments.typeMatch'),
    4: t('appointments.typeOther'),
    5: t('appointments.typeWorkshop'),
    6: t('appointments.typeOrganizing'),
    7: t('appointments.typePreperation'),
    8: t('appointments.typeTesting'),
  }

  const {
    eventsThisMonth,
    eventsLast30Days,
    upcomingNext30Days,
    eventsByTypeLast30Days,
    activeMembers,
    avgRatingLast30Days,
    ratingCountLast30Days,
    avgAttendancePctLast30Days,
    eventsWithAttendanceLast30Days,
    recentEvents,
    topAttendees,
  } = data

  // Events by type — bar chart data
  const byTypeData = Object.entries(eventsByTypeLast30Days)
    .map(([type, count]) => ({
      label: EVENT_TYPE_LABELS[Number(type)] ?? `Typ ${type}`,
      count,
      color: EVENT_TYPE_COLORS[Number(type)] ?? '#94a3b8',
    }))
    .sort((a, b) => b.count - a.count)

  // Recent events — line chart (ratings + attendance)
  const trendData = recentEvents.map((e) => ({
    date: format(parseISO(e.start), 'd.M.', { locale: dfLocale() }),
    label: e.name || format(parseISO(e.start), 'd. M. yyyy', { locale: dfLocale() }),
    rating: e.avgRating ?? null,
    attendance: e.attendancePct ?? null,
  }))

  const ratingLabel = avgRatingLast30Days != null ? `${avgRatingLast30Days.toFixed(1)} / 5` : '–'

  const attendanceLabel =
    avgAttendancePctLast30Days != null ? `${avgAttendancePctLast30Days.toFixed(1)} %` : '–'

  return (
    <div data-testid="kpi-dashboard" className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">{t('kpi.title')}</h1>

      {/* ── Stat cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label={t('kpi.eventsThisMonth')}
          value={eventsThisMonth}
          icon={<Calendar className="h-6 w-6" />}
          color="text-sky-600"
        />
        <StatCard
          label={t('kpi.eventsLast30')}
          value={eventsLast30Days}
          icon={<Activity className="h-6 w-6" />}
          color="text-indigo-600"
        />
        <StatCard
          label={t('kpi.upcomingNext30')}
          value={upcomingNext30Days}
          icon={<CalendarClock className="h-6 w-6" />}
          color="text-emerald-600"
        />
        <StatCard
          label={t('kpi.activeMembers')}
          value={activeMembers}
          icon={<Users className="h-6 w-6" />}
          color="text-violet-600"
        />
        <StatCard
          label={t('kpi.avgRating')}
          value={ratingLabel}
          sub={
            ratingCountLast30Days > 0
              ? `${ratingCountLast30Days} ${t('kpi.ratingsCount')}`
              : t('kpi.noData')
          }
          icon={<Star className="h-6 w-6" />}
          color="text-amber-500"
        />
        <StatCard
          label={t('kpi.avgAttendance')}
          value={attendanceLabel}
          sub={
            eventsWithAttendanceLast30Days > 0
              ? `${eventsWithAttendanceLast30Days} ${t('kpi.attendanceEvents')}`
              : t('kpi.noData')
          }
          icon={<CheckCircle className="h-6 w-6" />}
          color="text-green-600"
        />
      </div>

      {/* ── Two-column section ───────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Events by type */}
        {byTypeData.length > 0 && (
          <Card>
            <CardContent className="py-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-gray-400" />
                {t('kpi.eventsByType')}
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byTypeData} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip formatter={(v) => [`${v} ${t('kpi.count')}`]} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {byTypeData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Trend chart */}
        {trendData.length > 0 && (
          <Card>
            <CardContent className="py-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gray-400" />
                {t('kpi.attendanceTrend')} / {t('kpi.ratingTrend')}
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData} margin={{ left: 0, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="rating" domain={[0, 5]} tick={{ fontSize: 10 }} width={24} />
                  <YAxis
                    yAxisId="att"
                    domain={[0, 100]}
                    orientation="right"
                    tick={{ fontSize: 10 }}
                    width={28}
                  />
                  <Tooltip
                    formatter={(value, name) =>
                      name === t('kpi.rating') ? [`${value} / 5`, name] : [`${value} %`, name]
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine
                    yAxisId="rating"
                    y={3}
                    stroke="#fbbf24"
                    strokeDasharray="4 2"
                    strokeWidth={1}
                  />
                  <Line
                    yAxisId="rating"
                    type="monotone"
                    dataKey="rating"
                    stroke="#f59e0b"
                    name={t('kpi.rating')}
                    dot={{ r: 3 }}
                    connectNulls
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="att"
                    type="monotone"
                    dataKey="attendance"
                    stroke="#22c55e"
                    name={t('kpi.attendancePct')}
                    dot={{ r: 3 }}
                    connectNulls
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Attendance per event table ───────────────────────── */}
      {recentEvents.some((e) => e.attendanceTotal > 0) && (
        <Card>
          <CardContent className="py-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-gray-400" />
              {t('kpi.recentEvents')}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                    <th className="pb-2 font-medium">{t('nav.appointments')}</th>
                    <th className="pb-2 font-medium">{t('common.date')}</th>
                    <th className="pb-2 font-medium text-right">
                      {t('attendance.presentCount', { count: '' }).replace(': ', '')}
                    </th>
                    <th className="pb-2 font-medium text-right">{t('common.total')}</th>
                    <th className="pb-2 font-medium text-right">%</th>
                    <th className="pb-2 font-medium text-right pl-4">{t('kpi.rating')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...recentEvents]
                    .filter((e) => e.attendanceTotal > 0)
                    .reverse()
                    .slice(0, 10)
                    .map((e) => (
                      <tr key={e.appointmentId} className="border-b border-gray-50 last:border-0">
                        <td className="py-1.5 text-gray-800 max-w-40 truncate">
                          {e.name || EVENT_TYPE_LABELS[e.appointmentType] || '–'}
                        </td>
                        <td className="py-1.5 text-gray-500">
                          {format(parseISO(e.start), 'd. M. yyyy', { locale: dfLocale() })}
                        </td>
                        <td className="py-1.5 text-right text-green-700 font-medium">
                          {e.attendancePresent}
                        </td>
                        <td className="py-1.5 text-right text-gray-500">{e.attendanceTotal}</td>
                        <td className="py-1.5 text-right">
                          {e.attendancePct != null ? (
                            <span
                              className={`font-medium ${
                                e.attendancePct >= 80
                                  ? 'text-green-600'
                                  : e.attendancePct >= 60
                                    ? 'text-amber-600'
                                    : 'text-red-600'
                              }`}
                            >
                              {e.attendancePct.toFixed(0)} %
                            </span>
                          ) : (
                            '–'
                          )}
                        </td>
                        <td className="py-1.5 text-right pl-4 text-amber-600">
                          {e.avgRating != null ? `${e.avgRating.toFixed(1)} ★` : '–'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Top attendees ────────────────────────────────────── */}
      {topAttendees.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Medal className="h-4 w-4 text-gray-400" />
              {t('kpi.topMembers')}
            </h2>
            <div className="space-y-2">
              {topAttendees.map((m, i) => (
                <div key={m.memberId} className="flex items-center gap-3">
                  <span className="w-5 text-xs text-gray-400 text-right flex-shrink-0">
                    {i + 1}.
                  </span>
                  <span className="flex-1 text-sm text-gray-800 truncate">
                    {m.lastName} {m.firstName}
                  </span>
                  <span className="text-xs text-gray-400">
                    {m.present}/{m.eventsTotal}
                  </span>
                  <div className="w-24 h-2 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{ width: `${m.attendancePct}%` }}
                    />
                  </div>
                  <span
                    className={`text-xs font-semibold w-10 text-right flex-shrink-0 ${
                      m.attendancePct >= 80
                        ? 'text-green-600'
                        : m.attendancePct >= 60
                          ? 'text-amber-600'
                          : 'text-red-600'
                    }`}
                  >
                    {m.attendancePct.toFixed(0)} %
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {recentEvents.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-400 text-sm">
            {t('kpi.noData')}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
