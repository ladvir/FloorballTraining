import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, LayoutGrid, Users } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { teamsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'

export function LineupsHubPage() {
  const navigate = useNavigate()
  const { effectiveRole, user } = useAuthStore()
  const coachTeamIds = user?.coachTeamIds ?? []

  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: teamsApi.getAll,
  })

  if (isLoading) return <LoadingSpinner />

  const visibleTeams = (teams ?? []).filter((t) => {
    if (effectiveRole === 'Admin' || effectiveRole === 'ClubAdmin' || effectiveRole === 'HeadCoach') return true
    if (effectiveRole === 'Coach') return coachTeamIds.includes(t.id)
    return false
  })

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Sestavy" />
      {visibleTeams.length === 0 ? (
        <EmptyState
          title="Žádné týmy"
          description="Sestavy se tvoří pro konkrétní tým. Nejdřív vytvoř nebo se zařaď do týmu."
        />
      ) : (
        <>
          <p className="mb-3 text-sm text-gray-500">Vyber tým, jehož sestavy chceš spravovat:</p>
          <div className="space-y-2">
            {visibleTeams.map((t) => (
              <Card key={t.id}>
                <CardContent className="py-0">
                  <button
                    type="button"
                    onClick={() => navigate(`/teams/${t.id}/lineups`)}
                    className="flex w-full items-center gap-3 px-1 py-3 text-left"
                  >
                    <LayoutGrid className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{t.name}</p>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-gray-400">
                        {t.ageGroup && <span>{t.ageGroup.name}</span>}
                        {t.teamMembers && t.teamMembers.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {t.teamMembers.length} členů
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
