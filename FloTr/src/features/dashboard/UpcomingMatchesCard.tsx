import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { format, parseISO, differenceInCalendarDays } from 'date-fns'
import { Swords, CalendarDays, Dumbbell, ArrowRight } from 'lucide-react'
import { dfLocale } from '../../utils/dateLocale'
import { Card, CardContent } from '../../components/ui/Card'
import type { AppointmentDto, TeamDto } from '../../types/domain.types'

interface Props {
  /** Future Match-type appointments across every team the coach is on, ascending by start. */
  matches: AppointmentDto[]
  /** All of the coach's future appointments (any team) — used to count trainings left per match. */
  allAppointments: AppointmentDto[]
  teams: TeamDto[]
}

/** Dashboard card: next few matches (across all of the coach's teams) with a countdown and a
 * deep link into its team's Matches tab (lineup/stats live only there, see TeamMatchesTab). */
export function UpcomingMatchesCard({ matches, allAppointments, teams }: Props) {
  const { t } = useTranslation()
  const teamNames = new Map(teams.map((tm) => [tm.id, tm.name]))

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
        {t('dashboard.upcomingMatches')}
      </h2>
      {matches.length === 0 ? (
        <p className="text-sm text-gray-500">{t('dashboard.noUpcomingMatches')}</p>
      ) : (
        <div className="space-y-3">
          {matches.slice(0, 3).map((m) => (
            <MatchCard
              key={m.id}
              appointment={m}
              teamName={m.teamId != null ? teamNames.get(m.teamId) : undefined}
              allAppointments={allAppointments}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function MatchCard({
  appointment,
  teamName,
  allAppointments,
}: {
  appointment: AppointmentDto
  teamName?: string
  allAppointments: AppointmentDto[]
}) {
  const { t } = useTranslation()
  const start = parseISO(appointment.start)
  const now = new Date()
  const daysLeft = Math.max(0, differenceInCalendarDays(start, now))
  const trainingsLeft = allAppointments.filter(
    (a) =>
      a.teamId === appointment.teamId &&
      Number(a.appointmentType) === 0 &&
      new Date(a.start) < start
  ).length

  return (
    <Card>
      <CardContent className="space-y-2.5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Swords className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="truncate font-medium text-gray-900">
              {appointment.opponentName?.trim() || t('stats.opponentFallback')}
            </span>
            <span className="shrink-0 text-xs text-gray-500">
              {format(start, 'EEEE d. M. HH:mm', { locale: dfLocale() })}
            </span>
            {teamName && (
              <span className="shrink-0 rounded bg-violet-50 px-1.5 py-0.5 text-[11px] font-medium text-violet-700">
                {teamName}
              </span>
            )}
          </div>
          {!!appointment.teamId && (
            <Link
              to={`/teams/${appointment.teamId}?tab=matches&matchId=${appointment.id}`}
              className="flex shrink-0 items-center gap-1 text-xs text-sky-600 hover:text-sky-800"
            >
              {t('dashboard.viewInTeam')}
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 font-medium text-gray-700">
            <CalendarDays className="h-3.5 w-3.5" />
            {daysLeft === 0
              ? t('dashboard.matchToday')
              : t('dashboard.daysUntilMatch', { count: daysLeft })}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 font-medium text-gray-700">
            <Dumbbell className="h-3.5 w-3.5" />
            {t('dashboard.trainingsUntilMatch', { count: trainingsLeft })}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
