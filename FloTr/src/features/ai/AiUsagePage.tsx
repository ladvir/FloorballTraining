import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { CheckCircle, XCircle } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/shared/PageHeader'
import { aiApi, clubsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import { providerLabel } from './aiProviders'
import type { AiUsageFilter } from '../../types/domain.types'

const FEATURE_COLORS: Record<number, string> = { 0: '#0284c7', 1: '#7c3aed' }

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function AiUsagePage() {
  const { t } = useTranslation()
  const { isAdmin, activeClubId } = useAuthStore()

  const [from, setFrom] = useState(() => isoDate(new Date(Date.now() - 29 * 24 * 3600 * 1000)))
  const [to, setTo] = useState(() => isoDate(new Date()))
  const [clubId, setClubId] = useState<number | ''>(() => (isAdmin ? '' : (activeClubId ?? '')))
  const [page, setPage] = useState(1)

  const featureLabel = (feature: number) =>
    t(`ai.usage.features.${feature}`, { defaultValue: `#${feature}` })

  const filter: AiUsageFilter = {
    from,
    to,
    clubId: clubId === '' ? undefined : clubId,
  }

  const { data: clubs } = useQuery({
    queryKey: ['clubs'],
    queryFn: clubsApi.getAll,
    enabled: isAdmin,
  })
  const { data: summary } = useQuery({
    queryKey: ['ai-usage', 'summary', filter],
    queryFn: () => aiApi.getUsageSummary(filter),
  })
  const { data: logs } = useQuery({
    queryKey: ['ai-usage', 'logs', filter, page],
    queryFn: () => aiApi.getUsageLogs({ ...filter, page, pageSize: 20 }),
  })

  // Pivot byDay rows into one row per date with a column per feature (stacked bars).
  const chartData = useMemo(() => {
    const byDate = new Map<string, Record<string, number | string>>()
    for (const row of summary?.byDay ?? []) {
      const entry = byDate.get(row.date) ?? { date: row.date }
      const key = featureLabel(row.feature)
      entry[key] = ((entry[key] as number) ?? 0) + row.inputTokens + row.outputTokens
      byDate.set(row.date, entry)
    }
    return [...byDate.values()]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary])

  const featureKeys = useMemo(
    () =>
      (summary?.byFeature ?? []).map((f) => ({ key: featureLabel(f.feature), feature: f.feature })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [summary]
  )

  const totalPages = logs ? Math.max(1, Math.ceil(logs.total / logs.pageSize)) : 1

  return (
    <div className="space-y-6">
      <PageHeader title={t('ai.usage.title')} description={t('ai.usage.subtitle')} />

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 py-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              {t('ai.usage.from')}
            </label>
            <input
              type="date"
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
              value={from}
              max={to}
              onChange={(e) => {
                setFrom(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              {t('ai.usage.to')}
            </label>
            <input
              type="date"
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
              value={to}
              min={from}
              onChange={(e) => {
                setTo(e.target.value)
                setPage(1)
              }}
            />
          </div>
          {isAdmin && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                {t('ai.usage.club')}
              </label>
              <select
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm"
                value={clubId}
                onChange={(e) => {
                  setClubId(e.target.value ? Number(e.target.value) : '')
                  setPage(1)
                }}
              >
                <option value="">{t('ai.usage.allClubs')}</option>
                {(clubs ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs uppercase tracking-wide text-gray-400">{t('ai.usage.calls')}</p>
            <p className="mt-1 text-3xl font-bold text-sky-600">{summary?.totals.calls ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs uppercase tracking-wide text-gray-400">{t('ai.usage.tokens')}</p>
            <p className="mt-1 text-3xl font-bold text-gray-800">
              {(
                (summary?.totals.inputTokens ?? 0) + (summary?.totals.outputTokens ?? 0)
              ).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">
              {t('ai.usage.tokensDetail', {
                input: (summary?.totals.inputTokens ?? 0).toLocaleString(),
                output: (summary?.totals.outputTokens ?? 0).toLocaleString(),
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs uppercase tracking-wide text-gray-400">
              {t('ai.usage.errorRate')}
            </p>
            <p className="mt-1 text-3xl font-bold text-gray-800">
              {summary?.totals.errorRatePct ?? 0} %
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs uppercase tracking-wide text-gray-400">
              {t('ai.usage.avgDuration')}
            </p>
            <p className="mt-1 text-3xl font-bold text-gray-800">
              {((summary?.totals.avgDurationMs ?? 0) / 1000).toFixed(1)} s
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tokens per day, stacked by feature */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">{t('ai.usage.perDay')}</h2>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="py-4 text-sm text-gray-500">{t('ai.usage.noData')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                {featureKeys.map(({ key, feature }) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    stackId="tokens"
                    fill={FEATURE_COLORS[feature] ?? '#64748b'}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Providers + top users + teams */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">{t('ai.usage.byProvider')}</h2>
          </CardHeader>
          <CardContent>
            {(summary?.byProvider ?? []).length === 0 ? (
              <p className="text-sm text-gray-500">{t('ai.usage.noData')}</p>
            ) : (
              <ul className="space-y-2">
                {(summary?.byProvider ?? []).map((p) => (
                  <li key={p.provider} className="flex items-center justify-between text-sm">
                    <Badge variant="info">{providerLabel(p.provider)}</Badge>
                    <span className="text-gray-600">
                      {t('ai.usage.callsAndTokens', {
                        calls: p.calls,
                        tokens: (p.inputTokens + p.outputTokens).toLocaleString(),
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">{t('ai.usage.byUser')}</h2>
          </CardHeader>
          <CardContent>
            {(summary?.byUser ?? []).length === 0 ? (
              <p className="text-sm text-gray-500">{t('ai.usage.noData')}</p>
            ) : (
              <ul className="space-y-2">
                {(summary?.byUser ?? []).map((u) => (
                  <li key={u.userId} className="flex items-center justify-between text-sm">
                    <span className="truncate">{u.userName}</span>
                    <span className="shrink-0 text-gray-600">
                      {t('ai.usage.callsAndTokens', {
                        calls: u.calls,
                        tokens: (u.inputTokens + u.outputTokens).toLocaleString(),
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">{t('ai.usage.byTeam')}</h2>
          </CardHeader>
          <CardContent>
            {(summary?.byTeam ?? []).length === 0 ? (
              <p className="text-sm text-gray-500">{t('ai.usage.noTeamData')}</p>
            ) : (
              <ul className="space-y-2">
                {(summary?.byTeam ?? []).map((team) => (
                  <li key={team.teamId} className="flex items-center justify-between text-sm">
                    <span className="truncate">{team.teamName}</span>
                    <span className="shrink-0 text-gray-600">
                      {t('ai.usage.callsAndTokens', {
                        calls: team.calls,
                        tokens: (team.inputTokens + team.outputTokens).toLocaleString(),
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent calls */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">{t('ai.usage.recentCalls')}</h2>
        </CardHeader>
        <CardContent>
          {(logs?.items ?? []).length === 0 ? (
            <p className="py-4 text-sm text-gray-500">{t('ai.usage.noData')}</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="py-2 pr-3 font-medium">{t('ai.usage.when')}</th>
                      <th className="py-2 pr-3 font-medium">{t('ai.usage.user')}</th>
                      <th className="py-2 pr-3 font-medium">{t('ai.usage.feature')}</th>
                      <th className="py-2 pr-3 font-medium">{t('ai.usage.provider')}</th>
                      <th className="py-2 pr-3 font-medium">{t('ai.usage.model')}</th>
                      <th className="py-2 pr-3 font-medium">{t('ai.usage.source')}</th>
                      <th className="py-2 pr-3 text-right font-medium">{t('ai.usage.tokens')}</th>
                      <th className="py-2 font-medium">{t('ai.usage.result')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(logs?.items ?? []).map((log) => (
                      <tr key={log.id} className="border-b border-gray-50">
                        <td className="whitespace-nowrap py-2 pr-3 text-gray-600">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2 pr-3">{log.userName}</td>
                        <td className="py-2 pr-3">{featureLabel(log.feature)}</td>
                        <td className="py-2 pr-3">{providerLabel(log.provider)}</td>
                        <td className="py-2 pr-3 text-gray-600">{log.model}</td>
                        <td className="py-2 pr-3">
                          {t(`ai.usage.sources.${log.credentialSource}`, { defaultValue: '—' })}
                        </td>
                        <td className="py-2 pr-3 text-right text-gray-600">
                          {(log.inputTokens + log.outputTokens).toLocaleString()}
                        </td>
                        <td className="py-2">
                          {log.success ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-red-600"
                              title={log.errorType ?? undefined}
                            >
                              <XCircle className="h-4 w-4" />
                              <span className="text-xs">{log.errorType}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="mt-3 flex items-center justify-end gap-2 text-sm">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    ‹
                  </Button>
                  <span className="text-gray-500">
                    {t('ai.usage.pageOf', { page, total: totalPages })}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    ›
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
