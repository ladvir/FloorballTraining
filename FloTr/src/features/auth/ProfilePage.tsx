import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { CheckCircle, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/shared/PageHeader'
import { clubsApi, teamsApi, authApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'

export function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const [selectedClubId, setSelectedClubId] = useState<number | null>(user?.defaultClubId ?? null)
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(user?.defaultTeamId ?? null)
  const [success, setSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const { data: clubs } = useQuery({ queryKey: ['clubs'], queryFn: clubsApi.getAll })
  const { data: teams } = useQuery({ queryKey: ['teams'], queryFn: teamsApi.getAll })

  const filteredTeams = selectedClubId
    ? (teams ?? []).filter((t) => t.clubId === selectedClubId)
    : (teams ?? [])

  const mutation = useMutation({
    mutationFn: () => authApi.updatePreferences({
      defaultClubId: selectedClubId,
      defaultTeamId: selectedTeamId,
    }),
    onSuccess: (data) => {
      setUser(data)
      setSuccess(true)
      setSaveError(null)
      setTimeout(() => setSuccess(false), 3000)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Uložení selhalo.'
      setSaveError(msg)
    },
  })

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Profil a nastavení" />

      {/* Profile info */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-xl font-semibold text-sky-600">
              {(user?.firstName ?? user?.email ?? '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email}
              </p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Role</p>
            <div className="mt-1 flex gap-2">
              {user?.roles.map((role) => (
                <Badge key={role} variant={role === 'Admin' ? 'info' : 'default'}>
                  {role}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
        Nastavení
      </h2>
      <Card>
        <CardContent className="space-y-4 py-4">
          <p className="text-sm font-medium text-gray-700">Výchozí klub a tým</p>
          <p className="text-xs text-gray-500">
            Slouží k předvyplnění hodnot při vytváření nového tréninku.
          </p>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Klub</label>
            <select
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={selectedClubId ?? 0}
              onChange={(e) => {
                const val = Number(e.target.value)
                const newClubId = val === 0 ? null : val
                setSelectedClubId(newClubId)
                if (selectedTeamId) {
                  const team = teams?.find((t) => t.id === selectedTeamId)
                  if (!team || (newClubId && team.clubId !== newClubId)) setSelectedTeamId(null)
                }
              }}
            >
              <option value={0}>— žádný —</option>
              {clubs?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tým</label>
            <select
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={selectedTeamId ?? 0}
              onChange={(e) => {
                const val = Number(e.target.value)
                setSelectedTeamId(val === 0 ? null : val)
              }}
            >
              <option value={0}>— žádný —</option>
              {filteredTeams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {selectedClubId && filteredTeams.length === 0 && (
              <p className="mt-1 text-xs text-gray-400">Žádné týmy pro vybraný klub.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {success && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          Nastavení uloženo.
        </div>
      )}
      {saveError && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {saveError}
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>
          Uložit nastavení
        </Button>
      </div>
    </div>
  )
}
