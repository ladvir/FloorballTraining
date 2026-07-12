import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronRight, Trophy, Dumbbell } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { statTrackersApi } from '../../api/index'
import type { PlayerStatsBySeasonDto } from '../../types/domain.types'
import { format, parseISO } from 'date-fns'

interface Props {
  memberId: number
}

export function MemberSeasonStatsCard({ memberId }: Props) {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: ['stats-member-summary', memberId],
    queryFn: () => statTrackersApi.memberSummary(memberId),
  })

  const matchGroups = useMemo(() => (data ?? []).filter((g) => g.eventCategory === 0), [data])
  const trainingGroups = useMemo(() => (data ?? []).filter((g) => g.eventCategory === 1), [data])

  if (isLoading) return <LoadingSpinner />
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-gray-500">
          {t('stats.noStats')}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <CategorySection
        title={t('tournaments.title')}
        icon={Trophy}
        groups={matchGroups}
        accent="sky"
      />
      <CategorySection
        title={t('stats.training')}
        icon={Dumbbell}
        groups={trainingGroups}
        accent="emerald"
      />
    </div>
  )
}

function CategorySection({
  title,
  icon: Icon,
  groups,
  accent,
}: {
  title: string
  icon: React.ElementType
  groups: PlayerStatsBySeasonDto[]
  accent: 'sky' | 'emerald'
}) {
  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="py-3">
          <h3 className="text-sm font-semibold text-gray-700">
            <Icon
              className={`mr-1 inline h-4 w-4 ${accent === 'sky' ? 'text-sky-500' : 'text-emerald-500'}`}
            />
            {title}
          </h3>
          <p className="mt-2 text-xs text-gray-500 italic">{t('common.noData')}</p>
        </CardContent>
      </Card>
    )
  }
  return (
    <Card>
      <CardContent className="py-3">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">
          <Icon
            className={`mr-1 inline h-4 w-4 ${accent === 'sky' ? 'text-sky-500' : 'text-emerald-500'}`}
          />
          {title}
        </h3>
        <div className="space-y-2">
          {groups.map((g) => (
            <SeasonGroup key={`${g.seasonId ?? 0}-${g.eventCategory}`} group={g} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function SeasonGroup({ group }: { group: PlayerStatsBySeasonDto }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const totalKeys = Object.keys(group.totals)

  return (
    <div className="rounded-lg border border-gray-200">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
      >
        <span className="flex items-center gap-1.5">
          {open ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
          <span className="font-medium text-gray-800">{group.seasonName ?? 'Bez sezóny'}</span>
          <span className="text-xs text-gray-500">
            ({group.eventCount}{' '}
            {group.eventCount === 1 ? 'událost' : group.eventCount < 5 ? 'události' : 'událostí'})
          </span>
        </span>
        <span className="flex flex-wrap gap-1.5 text-xs">
          {totalKeys.length === 0 ? (
            <span className="text-gray-400">{t('common.noData')}</span>
          ) : (
            totalKeys.map((k) => (
              <span
                key={k}
                className="rounded bg-gray-100 px-1.5 py-0.5 tabular-nums text-gray-700"
              >
                {k}: <strong>{group.totals[k]}</strong>
              </span>
            ))
          )}
        </span>
      </button>

      {open && (
        <div className="overflow-x-auto border-t border-gray-100">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-3 py-2 font-medium">{t('common.date')}</th>
                <th className="px-3 py-2 font-medium">{t('appointments.title')}</th>
                {totalKeys.map((k) => (
                  <th key={k} className="px-2 py-2 text-right font-medium">
                    {k}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {group.events.map((e) => (
                <tr key={e.trackerId} className="border-t border-gray-100">
                  <td className="px-3 py-1.5 text-gray-600 tabular-nums">
                    {format(parseISO(e.eventDate), 'd.M.yyyy')}
                  </td>
                  <td className="px-3 py-1.5">
                    {e.tournamentName && (
                      <span className="text-gray-500">{e.tournamentName}: </span>
                    )}
                    {e.eventName ?? '?'}
                  </td>
                  {totalKeys.map((k) => (
                    <td key={k} className="px-2 py-1.5 text-right tabular-nums text-gray-700">
                      {e.metrics[k] ?? 0}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
