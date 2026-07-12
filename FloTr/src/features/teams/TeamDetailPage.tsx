import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Users,
  Clock,
  ClipboardCheck,
  LayoutGrid,
  Share2,
  Copy,
  RefreshCw,
  X,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { teamsApi } from '../../api/index'
import { TeamSeasonStatsCard } from '../stats/TeamSeasonStatsCard'
import { TeamAttendanceTab } from '../attendance/TeamAttendanceTab'
import { useAuthStore } from '../../store/authStore'

export function TeamDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { effectiveRole } = useAuthStore()
  const isHeadCoachPlus = ['HeadCoach', 'ClubAdmin', 'Admin'].includes(effectiveRole)
  const [copied, setCopied] = useState(false)

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: () => teamsApi.getById(Number(id)),
    enabled: !!id,
  })

  const generateTokenMutation = useMutation({
    mutationFn: () => teamsApi.generateCalendarToken(Number(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team', id] }),
  })

  const revokeTokenMutation = useMutation({
    mutationFn: () => teamsApi.revokeCalendarToken(Number(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team', id] }),
  })

  if (isLoading) return <LoadingSpinner />
  if (!team) return <p className="text-center text-gray-500 mt-12">{t('teams.teamNotFound')}</p>

  const teamMembers = team.teamMembers ?? []

  const apiBaseUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
  const shareUrl = team.publicCalendarToken
    ? `${window.location.origin}/share/${team.publicCalendarToken}`
    : null
  const icalUrl = team.publicCalendarToken
    ? `${apiBaseUrl}/public/calendar/${team.publicCalendarToken}.ics`
    : null

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  const coaches = teamMembers.filter((tm) => tm.isCoach)
  const players = teamMembers.filter((tm) => tm.isPlayer && !tm.isCoach)

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/teams')}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">{team.name}</h1>
      </div>

      {/* Info */}
      <Card className="mb-4">
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
            {team.ageGroup && (
              <span>
                {t('teams.formAgeGroup')}: <strong>{team.ageGroup.name}</strong>
              </span>
            )}
            {(team.personsMin != null || team.personsMax != null) && (
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4 text-gray-400" />
                {team.personsMin ?? '?'}–{team.personsMax ?? '?'} {t('trainings.players')}
              </span>
            )}
            {team.defaultTrainingDuration != null && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-gray-400" />
                {team.defaultTrainingDuration} min
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => navigate(`/testing/team/${team.id}`)}>
          <ClipboardCheck className="h-4 w-4" />
          {t('testing.teamMatrix')}
        </Button>
        <Button size="sm" variant="outline" onClick={() => navigate(`/teams/${team.id}/lineups`)}>
          <LayoutGrid className="h-4 w-4" />
          {t('lineups.title')}
        </Button>
      </div>

      {/* Coaches */}
      {coaches.length > 0 && (
        <Card className="mb-4">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-gray-700 mb-3">
              {t('teams.tabCoaches')} ({coaches.length})
            </p>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left">{t('members.formLastName')}</th>
                    <th className="px-3 py-2 text-left">{t('members.formFirstName')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {coaches.map((tm) => (
                    <tr key={tm.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-900">{tm.member?.lastName}</td>
                      <td className="px-3 py-2 text-gray-600">{tm.member?.firstName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Players */}
      <Card>
        <CardContent className="py-4">
          <p className="text-sm font-medium text-gray-700 mb-3">
            {t('teams.tabMembers')} ({players.length})
          </p>
          {players.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">{t('teams.noMembers')}</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left">{t('members.formLastName')}</th>
                    <th className="px-3 py-2 text-left">{t('members.formFirstName')}</th>
                    <th className="px-3 py-2 text-left">{t('members.formBirthDate')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {players.map((tm) => (
                    <tr key={tm.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-900">{tm.member?.lastName}</td>
                      <td className="px-3 py-2 text-gray-600">{tm.member?.firstName}</td>
                      <td className="px-3 py-2 text-gray-500">{tm.member?.birthYear || '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="mt-4">
        <h2 className="mb-2 text-base font-semibold text-gray-800">{t('stats.teamStats')}</h2>
        <TeamSeasonStatsCard teamId={team.id} />
      </div>

      {/* Attendance report */}
      <div className="mt-6">
        <h2 className="mb-3 text-base font-semibold text-gray-800">
          {t('attendance.teamAttendance')}
        </h2>
        <TeamAttendanceTab teamId={team.id} />
      </div>

      {/* Calendar sharing — HeadCoach+ only */}
      {isHeadCoachPlus && (
        <div className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-800">
            <Share2 className="h-4 w-4" />
            {t('teams.publicCalendar')}
          </h2>
          <Card>
            <CardContent className="py-4 space-y-4">
              {shareUrl ? (
                <>
                  {/* QR code */}
                  <div className="flex justify-center">
                    <QRCodeSVG value={shareUrl} size={120} />
                  </div>

                  {/* Share URL */}
                  <div>
                    <p className="mb-1 text-xs font-medium text-gray-500">
                      {t('lineups.publicLink')}
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={shareUrl}
                        className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-700 font-mono"
                      />
                      <Button size="sm" variant="outline" onClick={() => handleCopy(shareUrl)}>
                        <Copy className="h-3.5 w-3.5" />
                        {copied ? t('common.copied') : t('common.copy')}
                      </Button>
                    </div>
                  </div>

                  {/* iCal URL */}
                  {icalUrl && (
                    <div>
                      <p className="mb-1 text-xs font-medium text-gray-500">iCal URL</p>
                      <div className="flex items-center gap-2">
                        <input
                          readOnly
                          value={icalUrl}
                          className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-700 font-mono"
                        />
                        <Button size="sm" variant="outline" onClick={() => handleCopy(icalUrl)}>
                          <Copy className="h-3.5 w-3.5" />
                          {t('common.copy')}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => generateTokenMutation.mutate()}
                      disabled={generateTokenMutation.isPending}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      {t('common.generate')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => revokeTokenMutation.mutate()}
                      disabled={revokeTokenMutation.isPending}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <X className="h-3.5 w-3.5" />
                      {t('common.revoke')}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-2">
                  <p className="mb-3 text-sm text-gray-500">{t('teams.calendarNotActive')}</p>
                  <Button
                    size="sm"
                    onClick={() => generateTokenMutation.mutate()}
                    disabled={generateTokenMutation.isPending}
                  >
                    <Share2 className="h-4 w-4" />
                    {t('common.share')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
