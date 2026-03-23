import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Pencil, UserX, UserCheck } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { Modal } from '../../components/shared/Modal'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { membersApi, clubsApi } from '../../api/index'
import { useAuthStore } from '../../store/authStore'
import type { MemberDto } from '../../types/domain.types'

export function MemberDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAdmin, isHeadCoach } = useAuthStore()
  const canManage = isAdmin || isHeadCoach

  const { data: member, isLoading } = useQuery({
    queryKey: ['member', id],
    queryFn: () => membersApi.getById(Number(id)),
    enabled: !!id,
  })

  const { data: clubs } = useQuery({ queryKey: ['clubs'], queryFn: clubsApi.getAll })

  const [deactivateConfirm, setDeactivateConfirm] = useState(false)

  const toggleActiveMutation = useMutation({
    mutationFn: (m: MemberDto) => membersApi.update({ ...m, isActive: !m.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member', id] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
      setDeactivateConfirm(false)
    },
  })

  if (isLoading) return <LoadingSpinner />

  if (!member) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Člen nebyl nalezen.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/members')}>
          Zpět na seznam
        </Button>
      </div>
    )
  }

  const club = clubs?.find((c) => c.id === member.clubId)
  const roles = [
    member.hasClubRoleManager && 'Manažer',
    member.hasClubRoleSecretary && 'Sekretář',
    member.hasClubRoleMainCoach && 'Hlavní trenér',
    member.hasClubRoleCoach && !member.hasClubRoleMainCoach && 'Trenér',
  ].filter(Boolean)

  return (
    <div className="mx-auto max-w-lg">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/members')}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-900">
            {member.firstName} {member.lastName}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            {member.isActive ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />Aktivní
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />Neaktivní
              </span>
            )}
          </div>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/members', { state: { editMemberId: member.id } })}>
              <Pencil className="h-4 w-4" />Upravit
            </Button>
            <Button
              variant={member.isActive ? 'danger' : 'primary'}
              size="sm"
              onClick={() => setDeactivateConfirm(true)}
            >
              {member.isActive ? (
                <><UserX className="h-4 w-4" />Deaktivovat</>
              ) : (
                <><UserCheck className="h-4 w-4" />Aktivovat</>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Info */}
      <Card>
        <CardContent className="py-4">
          <dl className="space-y-3">
            <InfoRow label="Jméno" value={member.firstName} />
            <InfoRow label="Příjmení" value={member.lastName} />
            <InfoRow label="Ročník" value={member.birthYear ? String(member.birthYear) : '–'} />
            <InfoRow label="Email" value={member.email || '–'} />
            <InfoRow label="Klub" value={club?.name || '–'} />
            <InfoRow label="Klubové role" value={roles.length ? roles.join(', ') : '–'} />
          </dl>
        </CardContent>
      </Card>

      {/* Deactivate/Activate confirm modal */}
      <Modal
        isOpen={deactivateConfirm}
        onClose={() => setDeactivateConfirm(false)}
        title={member.isActive ? 'Deaktivovat člena' : 'Aktivovat člena'}
        maxWidth="sm"
      >
        <p className="text-sm text-gray-600 mb-4">
          {member.isActive
            ? <>Opravdu chcete deaktivovat člena <strong>{member.firstName} {member.lastName}</strong>? Člen nebude smazán, pouze označen jako neaktivní.</>
            : <>Chcete znovu aktivovat člena <strong>{member.firstName} {member.lastName}</strong>?</>
          }
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setDeactivateConfirm(false)}>Zrušit</Button>
          <Button
            variant={member.isActive ? 'danger' : 'primary'}
            size="sm"
            onClick={() => toggleActiveMutation.mutate(member)}
            disabled={toggleActiveMutation.isPending}
          >
            {member.isActive ? 'Deaktivovat' : 'Aktivovat'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{value}</dd>
    </div>
  )
}
