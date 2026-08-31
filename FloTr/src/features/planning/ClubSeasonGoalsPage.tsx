import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Target } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { clubsApi, seasonsApi, seasonGoalsApi } from '../../api/index'
import type { SeasonDto } from '../../types/domain.types'
import { verdictMeta } from './seasonGoalMeta'

const findCurrentSeason = (seasons: SeasonDto[]) => {
  const now = new Date()
  return seasons.find((s) => now >= new Date(s.startDate) && now <= new Date(s.endDate))
}

export function ClubSeasonGoalsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { clubId: clubIdParam } = useParams<{ clubId: string }>()
  const clubId = Number(clubIdParam)

  const { data: club } = useQuery({
    queryKey: ['club', clubId],
    queryFn: () => clubsApi.getById(clubId),
    enabled: clubId > 0,
  })
  const { data: seasons } = useQuery({
    queryKey: ['seasons', clubId],
    queryFn: () => seasonsApi.getAll(clubId),
    enabled: clubId > 0,
  })

  // No effect needed: fall back to the running season (then the newest) until the user picks one.
  const [pickedSeasonId, setPickedSeasonId] = useState<number>(0)
  const seasonId = pickedSeasonId || findCurrentSeason(seasons ?? [])?.id || seasons?.[0]?.id || 0

  const { data: rows, isLoading } = useQuery({
    queryKey: ['clubSeasonGoals', clubId, seasonId],
    queryFn: () => seasonGoalsApi.getClubRollup(clubId, seasonId),
    enabled: clubId > 0 && seasonId > 0,
  })

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/clubs')}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{t('seasonGoals.clubTitle')}</h1>
          {club?.name && <p className="mt-0.5 text-sm text-gray-500">{club.name}</p>}
        </div>
      </div>

      <div className="mb-4">
        <select
          value={seasonId || ''}
          onChange={(e) => setPickedSeasonId(Number(e.target.value))}
          className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-sky-500 focus:outline-none"
        >
          <option value="">{t('seasonGoals.selectSeason')}</option>
          {(seasons ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : !rows || rows.length === 0 ? (
        <EmptyState
          title={t('seasonGoals.clubEmpty')}
          description={t('seasonGoals.clubEmptyHint')}
        />
      ) : (
        <Card>
          <CardContent className="py-2">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 text-left text-xs font-medium text-gray-500">
                  <tr>
                    <th className="px-3 py-2">{t('teams.formName')}</th>
                    <th className="px-3 py-2 text-right">{t('seasonGoals.colProgress')}</th>
                    <th className="px-3 py-2 text-right">{t('seasonGoals.verdictLabel')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((r) => {
                    const meta = verdictMeta(r.verdict)
                    return (
                      <tr
                        key={r.teamId}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => navigate(`/teams/${r.teamId}`)}
                      >
                        <td className="px-3 py-2 font-medium text-gray-800">
                          <Target className="mr-1.5 inline h-3.5 w-3.5 text-sky-400" />
                          {r.teamName}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-gray-600">
                          {r.totalCount === 0
                            ? t('seasonGoals.noGoalsShort')
                            : `${r.achievedCount} / ${r.totalCount}`}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.cls}`}
                          >
                            {t(`seasonGoals.verdict${meta.key}`)}
                            {r.verdictOverridden && ' ·'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
