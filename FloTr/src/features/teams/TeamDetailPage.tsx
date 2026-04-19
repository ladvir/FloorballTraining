import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Users, Clock, ClipboardCheck } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { teamsApi } from '../../api/index'

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: () => teamsApi.getById(Number(id)),
    enabled: !!id,
  })

  if (isLoading) return <LoadingSpinner />
  if (!team) return <p className="text-center text-gray-500 mt-12">Tým nenalezen.</p>

  const teamMembers = team.teamMembers ?? []
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
            {team.ageGroup && <span>Věková skupina: <strong>{team.ageGroup.name}</strong></span>}
            {(team.personsMin != null || team.personsMax != null) && (
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4 text-gray-400" />
                {team.personsMin ?? '?'}–{team.personsMax ?? '?'} hráčů
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
      <div className="mb-4 flex gap-2">
        <Button size="sm" variant="outline" onClick={() => navigate(`/testing/team/${team.id}`)}>
          <ClipboardCheck className="h-4 w-4" />
          Testování týmu
        </Button>
      </div>

      {/* Coaches */}
      {coaches.length > 0 && (
        <Card className="mb-4">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Trenéři ({coaches.length})</p>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Příjmení</th>
                    <th className="px-3 py-2 text-left">Jméno</th>
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
          <p className="text-sm font-medium text-gray-700 mb-3">Hráči ({players.length})</p>
          {players.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Tým zatím nemá žádné hráče.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Příjmení</th>
                    <th className="px-3 py-2 text-left">Jméno</th>
                    <th className="px-3 py-2 text-left">Ročník</th>
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
    </div>
  )
}
