import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Trophy, Dumbbell } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { statTrackersApi } from '../../api/index'
import type { TeamStatsBySeasonDto } from '../../types/domain.types'

interface Props {
  teamId: number
}

export function TeamSeasonStatsCard({ teamId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['stats-team-summary', teamId],
    queryFn: () => statTrackersApi.teamSummary(teamId),
  })

  const matchGroups = useMemo(() => (data ?? []).filter((g) => g.eventCategory === 0), [data])
  const trainingGroups = useMemo(() => (data ?? []).filter((g) => g.eventCategory === 1), [data])

  if (isLoading) return <LoadingSpinner />
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-gray-500">
          Zatím žádné záznamy statistik.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Section title="Zápasy a turnaje" icon={Trophy} groups={matchGroups} accent="sky" />
      <Section title="Tréninky" icon={Dumbbell} groups={trainingGroups} accent="emerald" />
    </div>
  )
}

function Section({
  title,
  icon: Icon,
  groups,
  accent,
}: {
  title: string
  icon: React.ElementType
  groups: TeamStatsBySeasonDto[]
  accent: 'sky' | 'emerald'
}) {
  return (
    <Card>
      <CardContent className="py-3">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">
          <Icon className={`mr-1 inline h-4 w-4 ${accent === 'sky' ? 'text-sky-500' : 'text-emerald-500'}`} />
          {title}
        </h3>
        {groups.length === 0 ? (
          <p className="text-xs text-gray-500 italic">Zatím nic.</p>
        ) : (
          <div className="space-y-3">
            {groups.map((g) => (
              <SeasonBlock key={`${g.seasonId ?? 0}-${g.eventCategory}`} group={g} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SeasonBlock({ group }: { group: TeamStatsBySeasonDto }) {
  const metricKeys = Object.keys(group.totals)
  return (
    <div className="rounded-lg border border-gray-200">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <p className="text-sm font-medium text-gray-800">
          {group.seasonName ?? 'Bez sezóny'}
          <span className="ml-1.5 text-xs text-gray-500">
            ({group.eventCount} {group.eventCount === 1 ? 'událost' : group.eventCount < 5 ? 'události' : 'událostí'})
          </span>
        </p>
        <div className="flex flex-wrap gap-1.5 text-xs">
          {metricKeys.map((k) => (
            <span key={k} className="rounded bg-gray-100 px-1.5 py-0.5 tabular-nums text-gray-700">
              {k}: <strong>{group.totals[k]}</strong>
            </span>
          ))}
        </div>
      </div>
      {group.players.length > 0 && (
        <div className="overflow-x-auto border-t border-gray-100">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-3 py-2 font-medium">Hráč</th>
                <th className="px-2 py-2 text-right font-medium">Účast</th>
                {metricKeys.map((k) => (
                  <th key={k} className="px-2 py-2 text-right font-medium">{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {group.players.map((p) => (
                <tr key={p.memberId} className="border-t border-gray-100">
                  <td className="px-3 py-1.5 text-gray-700">
                    {p.firstName} {p.lastName}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-gray-600">{p.eventCount}</td>
                  {metricKeys.map((k) => (
                    <td key={k} className="px-2 py-1.5 text-right tabular-nums text-gray-700">
                      {p.totals[k] ?? 0}
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
