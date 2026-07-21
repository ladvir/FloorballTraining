import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  FileDown,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/shared/PageHeader'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { Modal } from '../../components/shared/Modal'
import { memberReportApi, aiApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import { toast } from '../../utils/toast'
import type { AiRecommendationsResultDto, PlayerReportTestDto } from '../../types/domain.types'
import { SkillRadarChart } from './SkillRadarChart'
import { SkillGradeBadge } from './SkillDetailModal'

function colourBadgeVariant(colour?: string | null): 'success' | 'warning' | 'danger' | 'default' {
  switch (colour) {
    case 'green':
      return 'success'
    case 'yellow':
      return 'warning'
    case 'red':
      return 'danger'
    default:
      return 'default'
  }
}

function TrendIcon({ trend }: { trend?: number | null }) {
  if (trend === 1) return <TrendingUp className="h-4 w-4 text-green-600" />
  if (trend === -1) return <TrendingDown className="h-4 w-4 text-red-600" />
  if (trend === 0) return <Minus className="h-4 w-4 text-gray-400" />
  return null
}

export function MemberReportPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const memberId = Number(id)
  const { activeClubId } = useAuthStore()

  const [selectedTestId, setSelectedTestId] = useState<number | null>(null)
  const [aiResult, setAiResult] = useState<AiRecommendationsResultDto | null>(null)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [pdfAnonymized, setPdfAnonymized] = useState(false)
  const [pdfIncludeAi, setPdfIncludeAi] = useState(false)
  const [pdfDownloading, setPdfDownloading] = useState(false)

  const { data: report, isLoading } = useQuery({
    queryKey: ['member-report', memberId],
    queryFn: () => memberReportApi.getReport(memberId),
    enabled: Number.isFinite(memberId),
  })
  const { data: aiStatus } = useQuery({
    queryKey: ['ai-status', activeClubId],
    queryFn: () => aiApi.getStatus(activeClubId),
    enabled: activeClubId != null,
  })

  const recommendMutation = useMutation({
    mutationFn: () => memberReportApi.getRecommendations(memberId),
    onSuccess: setAiResult,
  })
  const recommendErrorCode =
    (recommendMutation.error as { response?: { data?: { code?: string } } } | null)?.response?.data
      ?.code ?? 'unexpected'

  const chartTest: PlayerReportTestDto | null = useMemo(() => {
    if (!report) return null
    const withNumbers = report.tests.filter((test) =>
      test.results.some((r) => r.numericValue != null)
    )
    return (
      withNumbers.find((test) => test.testDefinitionId === selectedTestId) ?? withNumbers[0] ?? null
    )
  }, [report, selectedTestId])

  const chartData = useMemo(
    () =>
      (chartTest?.results ?? [])
        .filter((r) => r.numericValue != null)
        .map((r) => ({
          date: new Date(r.testDate).toLocaleDateString(),
          value: r.numericValue,
        })),
    [chartTest]
  )

  const handlePdfDownload = async () => {
    setPdfDownloading(true)
    try {
      const blob = await memberReportApi.downloadPdf(memberId, {
        anonymized: pdfAnonymized,
        includeAi: pdfIncludeAi,
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = pdfAnonymized
        ? `report-hrace-anonym-${memberId}.pdf`
        : `report-${report?.member.lastName ?? memberId}.pdf`
      link.click()
      URL.revokeObjectURL(url)
      setPdfOpen(false)
    } catch {
      toast.error(t('memberReport.pdfFailed'))
    } finally {
      setPdfDownloading(false)
    }
  }

  if (isLoading) return <LoadingSpinner />
  if (!report) return null

  const { member } = report

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${member.firstName} ${member.lastName}`}
        description={[
          report.member.clubName,
          member.teams.join(', '),
          member.position ? t(`memberReport.positions.${member.position}`) : null,
          t('memberReport.age', { age: member.age, year: member.birthYear }),
        ]
          .filter(Boolean)
          .join(' · ')}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPdfOpen(true)}>
              <FileDown className="h-4 w-4" />
              {t('memberReport.pdfButton')}
            </Button>
            <Link to={`/members/${memberId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4" />
                {t('memberReport.backToProfile')}
              </Button>
            </Link>
          </div>
        }
      />

      {/* PDF export options */}
      <Modal isOpen={pdfOpen} onClose={() => setPdfOpen(false)} title={t('memberReport.pdfTitle')}>
        <div className="space-y-3">
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={pdfAnonymized}
              onChange={(e) => setPdfAnonymized(e.target.checked)}
            />
            <span>
              {t('memberReport.pdfAnonymized')}
              <span className="block text-xs text-gray-500">
                {t('memberReport.pdfAnonymizedHint')}
              </span>
            </span>
          </label>
          {aiStatus?.enabled && aiStatus.hasCredential && (
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={pdfIncludeAi}
                onChange={(e) => setPdfIncludeAi(e.target.checked)}
              />
              <span>
                {t('memberReport.pdfIncludeAi')}
                <span className="block text-xs text-gray-500">
                  {t('memberReport.pdfIncludeAiHint')}
                </span>
              </span>
            </label>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setPdfOpen(false)}>
              {t('ai.cancel')}
            </Button>
            <Button loading={pdfDownloading} onClick={handlePdfDownload}>
              <FileDown className="h-4 w-4" />
              {t('memberReport.pdfDownload')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Summary tiles ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs uppercase tracking-wide text-gray-400">
              {t('memberReport.qualityScore')}
            </p>
            <p className="mt-1 text-3xl font-bold text-sky-600">
              {report.qualityScore != null ? report.qualityScore : '—'}
            </p>
            <p className="text-xs text-gray-400">{t('memberReport.qualityScoreScale')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs uppercase tracking-wide text-gray-400">
              {t('memberReport.scoring')}
            </p>
            <p className="mt-1 text-3xl font-bold text-gray-800">{report.scoring.points}</p>
            <p className="text-xs text-gray-400">
              {t('memberReport.scoringDetail', {
                goals: report.scoring.goals,
                assists: report.scoring.assists,
                games: report.scoring.games,
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs uppercase tracking-wide text-gray-400">
              {t('memberReport.attendance')}
            </p>
            <p className="mt-1 text-3xl font-bold text-gray-800">
              {report.attendance.pct != null ? `${report.attendance.pct} %` : '—'}
            </p>
            <p className="text-xs text-gray-400">
              {t('memberReport.attendanceDetail', {
                present: report.attendance.present,
                total: report.attendance.total,
              })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs uppercase tracking-wide text-gray-400">
              {t('memberReport.workouts')}
            </p>
            <p className="mt-1 text-3xl font-bold text-gray-800">
              {report.workouts.pct != null ? `${report.workouts.pct} %` : '—'}
            </p>
            <p className="text-xs text-gray-400">
              {t('memberReport.workoutsDetail', {
                completed: report.workouts.completed,
                assigned: report.workouts.assigned,
              })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Strengths / weaknesses ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <ThumbsUp className="h-5 w-5 text-green-600" />
              {t('memberReport.strengths')}
            </h2>
          </CardHeader>
          <CardContent>
            {report.strengths.length === 0 ? (
              <p className="text-sm text-gray-500">{t('memberReport.noStrengths')}</p>
            ) : (
              <ul className="space-y-2">
                {report.strengths.map((s) => (
                  <li key={s.testDefinitionId} className="flex items-center gap-2 text-sm">
                    <Badge variant="success">{s.name}</Badge>
                    <span className="text-gray-600">
                      {s.latestValue != null ? `${s.latestValue} ${s.unit ?? ''}` : ''}
                    </span>
                    <TrendIcon trend={s.trend} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <ThumbsDown className="h-5 w-5 text-red-600" />
              {t('memberReport.weaknesses')}
            </h2>
          </CardHeader>
          <CardContent>
            {report.weaknesses.length === 0 ? (
              <p className="text-sm text-gray-500">{t('memberReport.noWeaknesses')}</p>
            ) : (
              <ul className="space-y-2">
                {report.weaknesses.map((w) => (
                  <li key={w.testDefinitionId} className="flex items-center gap-2 text-sm">
                    <Badge variant="danger">{w.name}</Badge>
                    <span className="text-gray-600">
                      {w.latestValue != null ? `${w.latestValue} ${w.unit ?? ''}` : ''}
                      {w.benchmarkText
                        ? ` (${t('memberReport.benchmark')}: ${w.benchmarkText})`
                        : ''}
                    </span>
                    <TrendIcon trend={w.trend} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Tests ─────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">{t('memberReport.tests')}</h2>
          <p className="text-sm text-gray-500">{t('memberReport.testsHint')}</p>
        </CardHeader>
        <CardContent>
          {report.tests.length === 0 ? (
            <p className="text-sm text-gray-500">{t('memberReport.noTests')}</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="py-2 pr-4 font-medium">{t('memberReport.testName')}</th>
                      <th className="py-2 pr-4 font-medium">{t('memberReport.latest')}</th>
                      <th className="py-2 pr-4 font-medium">{t('memberReport.level')}</th>
                      <th className="py-2 pr-4 font-medium">{t('memberReport.trend')}</th>
                      <th className="py-2 font-medium">{t('memberReport.benchmark')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.tests.map((test) => (
                      <tr
                        key={test.testDefinitionId}
                        className={`cursor-pointer border-b border-gray-50 hover:bg-gray-50 ${
                          chartTest?.testDefinitionId === test.testDefinitionId ? 'bg-sky-50' : ''
                        }`}
                        onClick={() => setSelectedTestId(test.testDefinitionId)}
                      >
                        <td className="py-2 pr-4">{test.name}</td>
                        <td className="py-2 pr-4">
                          {test.latestGradeLabel ??
                            (test.latestValue != null
                              ? `${test.latestValue} ${test.unit ?? ''}`
                              : '—')}
                        </td>
                        <td className="py-2 pr-4">
                          {test.latestColour ? (
                            <Badge variant={colourBadgeVariant(test.latestColour)} size="sm">
                              {t(`memberReport.colour.${test.latestColour}`)}
                            </Badge>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-2 pr-4">
                          <TrendIcon trend={test.trend} />
                        </td>
                        <td className="py-2 text-gray-500">{test.benchmarkText ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {chartTest && chartData.length > 1 && (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-medium text-gray-700">
                    {t('memberReport.chartTitle', { test: chartTest.name })}
                  </p>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#0284c7"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Skills (#92) ──────────────────────────────────────────────────── */}
      {report.skillCategories.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">{t('memberReport.skillsTitle')}</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <SkillRadarChart categories={report.skillCategories} pending={{}} />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {report.skillCategories.flatMap((cat) =>
                cat.skills.map((skill) => (
                  <div
                    key={skill.skillId}
                    className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2"
                  >
                    <SkillGradeBadge grade={skill.grade} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-gray-800">{skill.name}</p>
                      <p className="truncate text-xs text-gray-400">{cat.name}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── AI recommendations ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Sparkles className="h-5 w-5 text-sky-500" />
                {t('memberReport.aiTitle')}
              </h2>
              <p className="text-sm text-gray-500">{t('memberReport.aiHint')}</p>
            </div>
            {aiStatus?.enabled && aiStatus.hasCredential && (
              <Button
                onClick={() => recommendMutation.mutate()}
                loading={recommendMutation.isPending}
              >
                {aiResult ? t('memberReport.aiRegenerate') : t('memberReport.aiGenerate')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!aiStatus?.enabled || !aiStatus.hasCredential ? (
            <p className="text-sm text-gray-500">
              {aiStatus && !aiStatus.enabled
                ? t('ai.generator.disabled')
                : t('ai.generator.noCredential')}
            </p>
          ) : recommendMutation.isError ? (
            <p className="flex items-center gap-2 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {t(`ai.generator.errors.${recommendErrorCode}`, {
                defaultValue: t('ai.generator.errors.unexpected'),
              })}
            </p>
          ) : aiResult ? (
            <div className="space-y-3">
              {aiResult.warnings.length > 0 && (
                <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
                  {aiResult.warnings.map((w, i) => (
                    <p key={i}>
                      {t(`ai.generator.warnings.${w.code}`, {
                        value: w.value ?? '',
                        defaultValue: w.code,
                      })}
                    </p>
                  ))}
                </div>
              )}
              <ol className="space-y-3">
                {aiResult.recommendations.map((rec, i) => (
                  <li key={i} className="rounded-lg border border-gray-100 p-3">
                    <p className="font-medium">
                      {i + 1}. {rec.title}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">{rec.rationale}</p>
                    {rec.activities.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {rec.activities.map((a) => (
                          <Link
                            key={a.activityId}
                            to={`/activities?highlight=${a.activityId}`}
                            className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs text-sky-700 hover:bg-sky-100"
                          >
                            {a.activityName}
                          </Link>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
              <p className="text-xs text-gray-400">
                {t('ai.generator.tokens', {
                  input: aiResult.usage.inputTokens,
                  output: aiResult.usage.outputTokens,
                })}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">{t('memberReport.aiEmpty')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
