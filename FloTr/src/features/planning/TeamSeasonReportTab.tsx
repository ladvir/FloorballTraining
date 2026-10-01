import { useMemo, useRef, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { format, parseISO } from 'date-fns'
import type { Locale } from 'date-fns/locale'
import { toPng } from 'html-to-image'
import { Trophy, Zap, Goal, CalendarCheck, Award, Gift, Download } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { MemberLink } from '../../components/shared/MemberLink'
import { dfLocale } from '../../utils/dateLocale'
import { toast } from '../../utils/toast'
import { seasonGoalsApi } from '../../api/index'
import type {
  BadgeEarnRowDto,
  MonthlyTeamReportDto,
  PlayerRankRowDto,
  XpRankRowDto,
} from '../../types/domain.types'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

interface Props {
  teamId: number
}

/** Month-by-month + season-total report: best players by XP level, scoring, attendance, badges and rewards. */
export function TeamSeasonReportTab({ teamId }: Props) {
  const { t } = useTranslation()
  const [selectedLabel, setSelectedLabel] = useState<string>('season')
  const [exporting, setExporting] = useState(false)
  const captureRef = useRef<HTMLDivElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['seasonReport', teamId],
    queryFn: () => seasonGoalsApi.getTeamReport(teamId),
    enabled: teamId > 0,
  })

  const buckets = useMemo(
    () =>
      data
        ? [data.seasonTotal, ...[...data.months].reverse()].filter(
            (b): b is MonthlyTeamReportDto => !!b
          )
        : [],
    [data]
  )
  const selected = buckets.find((b) => b.label === selectedLabel) ?? data?.seasonTotal ?? null
  const isSeasonBucket = selected?.label === 'season'
  const bucketTitle = selected
    ? isSeasonBucket
      ? t('seasonReport.wholeSeason')
      : monthLabel(selected.label, dfLocale())
    : ''
  const crownLabel = isSeasonBucket
    ? t('seasonReport.playerOfSeason')
    : t('seasonReport.playerOfMonth')

  const handleExport = async () => {
    if (!captureRef.current) return
    setExporting(true)
    try {
      const dataUrl = await toPng(captureRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 })
      const link = document.createElement('a')
      link.download = `${data?.teamName ?? 'team'}-${selected?.label ?? 'season'}.png`.replace(
        /\s+/g,
        '-'
      )
      link.href = dataUrl
      link.click()
    } catch {
      toast.error(t('seasonReport.exportFailed'))
    } finally {
      setExporting(false)
    }
  }

  if (isLoading) return <LoadingSpinner />
  if (!data || !data.seasonId)
    return <p className="text-sm text-gray-500">{t('seasonGoals.noSeason')}</p>

  return (
    <Card>
      <CardContent className="py-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
            <Trophy className="h-4 w-4 text-amber-500" />
            {t('seasonReport.bestPlayers')}
          </h3>
          <div className="flex items-center gap-2">
            <select
              value={selectedLabel}
              onChange={(e) => setSelectedLabel(e.target.value)}
              className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:border-sky-400 focus:outline-none"
            >
              {buckets.map((b) => (
                <option key={b.label} value={b.label}>
                  {b.label === 'season'
                    ? t('seasonReport.wholeSeason')
                    : monthLabel(b.label, dfLocale())}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExport}
              disabled={exporting || !selected}
            >
              <Download className="h-3.5 w-3.5" />
              {exporting ? t('seasonReport.exporting') : t('seasonReport.saveImage')}
            </Button>
          </div>
        </div>

        {selected && (
          <div ref={captureRef} className="bg-white p-2">
            <p className="mb-3 text-sm font-semibold text-gray-800">
              {data.teamName} · {bucketTitle}
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <XpRankList
                icon={<Zap className="h-3.5 w-3.5 text-violet-500" />}
                title={t('seasonReport.topXp')}
                rows={selected.topXp}
                crownLabel={crownLabel}
              />
              <RankList
                icon={<Goal className="h-3.5 w-3.5 text-emerald-500" />}
                title={t('seasonReport.topScoring')}
                rows={selected.topScoring}
                format={(v) => `${v} b.`}
              />
              <RankList
                icon={<CalendarCheck className="h-3.5 w-3.5 text-sky-500" />}
                title={t('seasonReport.topAttendance')}
                rows={selected.topAttendance}
                format={(v) => `${v}%`}
              />
              <BadgeList
                icon={<Award className="h-3.5 w-3.5 text-amber-500" />}
                title={t('seasonReport.topBadges')}
                rows={selected.topBadges}
              />
              <RankList
                icon={<Gift className="h-3.5 w-3.5 text-rose-500" />}
                title={t('seasonReport.topRewards')}
                rows={selected.topRewards}
                format={(v) => `${v}×`}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function RankList({
  icon,
  title,
  rows,
  format,
}: {
  icon: ReactNode
  title: string
  rows: PlayerRankRowDto[]
  format: (value: number) => string
}) {
  const { t } = useTranslation()
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-500">
        {icon}
        {title}
      </p>
      {rows.length === 0 ? (
        <p className="text-xs text-gray-400">{t('seasonReport.noData')}</p>
      ) : (
        <ol className="space-y-1.5">
          {rows.map((r, i) => (
            <li key={r.memberId} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span className="w-4 flex-shrink-0 text-xs text-gray-400">{i + 1}.</span>
                <MemberLink memberId={r.memberId} name={r.name} />
              </span>
              <span className="flex-shrink-0 font-medium tabular-nums text-gray-700">
                {format(r.value)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function XpRankList({
  icon,
  title,
  rows,
  crownLabel,
}: {
  icon: ReactNode
  title: string
  rows: XpRankRowDto[]
  crownLabel: string
}) {
  const { t } = useTranslation()
  const topValue = rows[0]?.value
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-500">
        {icon}
        {title}
      </p>
      {rows.length === 0 ? (
        <p className="text-xs text-gray-400">{t('seasonReport.noData')}</p>
      ) : (
        <ol className="space-y-1.5">
          {rows.map((r, i) => {
            const isTop = topValue! > 0 && r.value === topValue
            return (
              <li
                key={r.memberId}
                className={`flex items-center justify-between gap-2 rounded-md text-sm ${
                  isTop ? 'border border-amber-200 bg-amber-50 px-1.5 py-1' : ''
                }`}
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  {isTop ? (
                    <Trophy className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                  ) : (
                    <span className="w-4 flex-shrink-0 text-xs text-gray-400">{i + 1}.</span>
                  )}
                  <MemberLink memberId={r.memberId} name={r.name} />
                  {isTop && (
                    <span className="whitespace-nowrap rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                      {crownLabel}
                    </span>
                  )}
                </span>
                <span className="flex flex-shrink-0 items-center gap-1.5">
                  <img
                    src={`${API_BASE_URL}/badges/rank${r.levelIndex}.png`}
                    alt=""
                    className="h-5 w-5 object-contain"
                  />
                  <span className="whitespace-nowrap text-xs text-gray-500">
                    {t(`xp.rank${r.levelIndex}`, { defaultValue: r.levelName })}
                  </span>
                  <span className="font-medium tabular-nums text-gray-700">{r.value} XP</span>
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

function BadgeList({
  icon,
  title,
  rows,
}: {
  icon: ReactNode
  title: string
  rows: BadgeEarnRowDto[]
}) {
  const { t } = useTranslation()
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-500">
        {icon}
        {title}
      </p>
      {rows.length === 0 ? (
        <p className="text-xs text-gray-400">{t('seasonReport.noData')}</p>
      ) : (
        <ol className="space-y-1.5">
          {rows.map((r, i) => (
            <li
              key={`${r.memberId}-${r.code}`}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="w-4 flex-shrink-0 text-xs text-gray-400">{i + 1}.</span>
                <MemberLink memberId={r.memberId} name={r.name} />
              </span>
              <span className="flex flex-shrink-0 items-center gap-1.5">
                <img src={`${API_BASE_URL}/${r.icon}`} alt="" className="h-5 w-5 object-contain" />
                <span className="whitespace-nowrap text-xs text-gray-500">
                  {t(`badge.${r.code}.name`, { defaultValue: r.code })}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function monthLabel(label: string, locale: Locale) {
  if (label === 'season') return label
  return format(parseISO(`${label}-01`), 'LLLL yyyy', { locale })
}
