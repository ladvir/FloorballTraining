import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { lineupsApi } from '../../api/index'
import { xpApi } from '../../api/xp.api'
import { useAuthStore } from '../../store/authStore'

interface Props {
  appointmentId: number
  teamId: number
}

/** Coach picks the match's best player from the match lineup (PlayerOfMatch award, max 1 per match).
 * Renders nothing for non-coaches or when the match has no lineup yet. */
export function PlayerOfMatchSelect({ appointmentId, teamId }: Props) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { effectiveRole, user } = useAuthStore()
  const canEdit =
    effectiveRole === 'Admin' ||
    effectiveRole === 'ClubAdmin' ||
    effectiveRole === 'HeadCoach' ||
    (effectiveRole === 'Coach' && (user?.coachTeamIds ?? []).includes(teamId))

  const { data: lineup } = useQuery({
    queryKey: ['appointment-lineup', appointmentId],
    queryFn: () => lineupsApi.getByAppointment(appointmentId),
    retry: false,
    enabled: canEdit,
  })
  const awardsKey = ['xp', 'awards', appointmentId]
  const { data: awards = [] } = useQuery({
    queryKey: awardsKey,
    queryFn: () => xpApi.listAwards(appointmentId),
    enabled: canEdit && !!lineup,
  })
  const best = awards.find((a) => a.type === 'PlayerOfMatch')

  const mutation = useMutation({
    mutationFn: async (memberId: number | null) => {
      if (best) await xpApi.deleteAward(best.id) // 1/event unique index → free the slot first
      if (memberId != null)
        await xpApi.createAward({ appointmentId, memberId, type: 'PlayerOfMatch' })
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: awardsKey })
      qc.invalidateQueries({ queryKey: ['xp'] })
    },
  })

  const players = (lineup?.roster ?? []).filter((r) => r.memberId != null && r.isAvailable)
  if (!canEdit || players.length === 0) return null

  return (
    <label className="mb-3 flex flex-wrap items-center gap-2 text-sm text-gray-700">
      <Star className="h-4 w-4 text-amber-500" />
      {t('lineups.bestPlayer')}
      <select
        value={best?.memberId ?? ''}
        onChange={(e) => mutation.mutate(e.target.value ? Number(e.target.value) : null)}
        disabled={mutation.isPending}
        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:border-amber-500 focus:outline-none"
      >
        <option value="">{t('lineups.bestPlayerNone')}</option>
        {players.map((r) => (
          <option key={r.memberId} value={r.memberId!}>
            {`${r.memberLastName ?? ''} ${r.memberFirstName ?? ''}`.trim()}
          </option>
        ))}
      </select>
    </label>
  )
}
