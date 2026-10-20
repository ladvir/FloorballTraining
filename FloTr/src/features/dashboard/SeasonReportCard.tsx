import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { seasonGoalsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import { TeamSeasonReportTab } from '../planning/TeamSeasonReportTab'

/** Dashboard card: the season report (opens on the current month) for a team I coach or play in. */
export function SeasonReportCard() {
  const { t } = useTranslation()
  const defaultTeamId = useAuthStore((s) => s.user?.defaultTeamId ?? null)
  const [picked, setPicked] = useState<number | null>(null)
  // Capture the month once (lazy) — Date in the render body trips react-hooks/purity.
  const [month] = useState(() => format(new Date(), 'yyyy-MM'))

  const { data: teams = [] } = useQuery({
    queryKey: ['seasonReport', 'myTeams'],
    queryFn: seasonGoalsApi.getMyReportTeams,
  })
  if (teams.length === 0) return null

  const teamId =
    teams.find((x) => x.teamId === picked)?.teamId ??
    teams.find((x) => x.teamId === defaultTeamId)?.teamId ??
    teams[0].teamId
  const coachTeams = teams.filter((x) => x.role === 'coach')
  const playerTeams = teams.filter((x) => x.role === 'player')

  return (
    <div className="mb-6">
      {teams.length > 1 && (
        <div className="mb-2 flex items-center gap-2">
          <label htmlFor="season-report-team" className="text-xs font-medium text-gray-500">
            {t('seasonReport.team')}
          </label>
          <select
            id="season-report-team"
            value={teamId}
            onChange={(e) => setPicked(Number(e.target.value))}
            className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:border-sky-400 focus:outline-none"
          >
            {coachTeams.length > 0 && (
              <optgroup label={t('seasonReport.asCoach')}>
                {coachTeams.map((x) => (
                  <option key={x.teamId} value={x.teamId}>
                    {x.teamName}
                  </option>
                ))}
              </optgroup>
            )}
            {playerTeams.length > 0 && (
              <optgroup label={t('seasonReport.asPlayer')}>
                {playerTeams.map((x) => (
                  <option key={x.teamId} value={x.teamId}>
                    {x.teamName}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      )}
      <TeamSeasonReportTab key={teamId} teamId={teamId} initialLabel={month} />
    </div>
  )
}
