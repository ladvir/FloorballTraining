import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, X, MinusCircle, HelpCircle, Users } from 'lucide-react'
import { Modal } from '../../components/shared/Modal'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { attendanceApi } from '../../api/attendance.api'
import { teamsApi } from '../../api/index'
import type {
  AttendanceStatus,
  AttendanceUpsertDto,
  AppointmentAttendanceDto,
} from '../../types/domain.types'

const STATUS_ICONS: Record<AttendanceStatus, React.ReactNode> = {
  1: <Check className="h-4 w-4" />,
  2: <X className="h-4 w-4" />,
  3: <MinusCircle className="h-4 w-4" />,
  0: <HelpCircle className="h-4 w-4" />,
}

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  1: 'Přítomen',
  2: 'Nepřítomen',
  3: 'Omluven',
  0: 'Neznámý',
}

const STATUS_ACTIVE_CLASS: Record<AttendanceStatus, string> = {
  1: 'bg-green-100 text-green-700 ring-2 ring-green-400',
  2: 'bg-red-100 text-red-700 ring-2 ring-red-400',
  3: 'bg-amber-100 text-amber-700 ring-2 ring-amber-400',
  0: 'bg-gray-100 text-gray-600 ring-2 ring-gray-400',
}

const STATUS_IDLE_CLASS = 'bg-gray-50 text-gray-400 hover:bg-gray-100'

interface MemberRow {
  memberId: number
  memberFirstName: string
  memberLastName: string
  status: AttendanceStatus
  note: string
}

type Overrides = Record<number, { status: AttendanceStatus; note: string }>

function buildBaseRows(
  records: AppointmentAttendanceDto[],
  teamMemberIds: { memberId: number; firstName: string; lastName: string }[]
): MemberRow[] {
  const fromRecords: MemberRow[] = records.map((r) => ({
    memberId: r.memberId,
    memberFirstName: r.memberFirstName ?? '',
    memberLastName: r.memberLastName ?? '',
    status: r.status,
    note: r.note ?? '',
  }))

  const existingIds = new Set(fromRecords.map((r) => r.memberId))

  const fromTeam: MemberRow[] = teamMemberIds
    .filter((m) => !existingIds.has(m.memberId))
    .map((m) => ({
      memberId: m.memberId,
      memberFirstName: m.firstName,
      memberLastName: m.lastName,
      status: 0 as AttendanceStatus,
      note: '',
    }))

  return [...fromRecords, ...fromTeam].sort((a, b) =>
    a.memberLastName.localeCompare(b.memberLastName, 'cs')
  )
}

export function AttendanceModal({
  appointmentId,
  teamId,
  onClose,
}: {
  appointmentId: number
  teamId?: number | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()

  const { data: existing, isLoading: loadingAttendance } = useQuery({
    queryKey: ['attendance', 'appointment', appointmentId],
    queryFn: () => attendanceApi.getByAppointment(appointmentId),
  })

  const { data: team, isLoading: loadingTeam } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => teamsApi.getById(teamId!),
    enabled: !!teamId,
    staleTime: 60_000,
  })

  const teamMembers = useMemo(
    () =>
      team?.teamMembers
        ?.filter((tm) => tm.member)
        .map((tm) => ({
          memberId: tm.memberId,
          firstName: tm.member!.firstName ?? '',
          lastName: tm.member!.lastName ?? '',
        })) ?? [],
    [team]
  )

  // Base rows derived from fetched data — null while still loading
  const baseRows = useMemo<MemberRow[] | null>(() => {
    if (existing === undefined) return null
    if (teamId && team === undefined) return null
    return buildBaseRows(existing, teamMembers)
  }, [existing, team, teamId, teamMembers])

  // User edits stored as overrides on top of baseRows
  const [overrides, setOverrides] = useState<Overrides>({})

  // Final rows = baseRows merged with overrides
  const rows = useMemo<MemberRow[]>(() => {
    if (!baseRows) return []
    return baseRows.map((r) => {
      const ov = overrides[r.memberId]
      return ov ? { ...r, ...ov } : r
    })
  }, [baseRows, overrides])

  const saveMutation = useMutation({
    mutationFn: (records: AttendanceUpsertDto[]) => attendanceApi.upsert(appointmentId, records),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', 'appointment', appointmentId] })
      queryClient.invalidateQueries({
        queryKey: ['attendance', 'appointment-summary', appointmentId],
      })
      onClose()
    },
  })

  const setStatus = (memberId: number, status: AttendanceStatus) => {
    setOverrides((prev) => ({
      ...prev,
      [memberId]: { note: prev[memberId]?.note ?? '', status },
    }))
  }

  const markAll = (status: AttendanceStatus) => {
    if (!baseRows) return
    const next: Overrides = {}
    baseRows.forEach((r) => {
      next[r.memberId] = { status, note: overrides[r.memberId]?.note ?? r.note }
    })
    setOverrides(next)
  }

  const resetAll = () => setOverrides({})

  const handleSave = () => {
    saveMutation.mutate(
      rows.map((r) => ({ memberId: r.memberId, status: r.status, note: r.note || null }))
    )
  }

  const isLoading = loadingAttendance || (!!teamId && loadingTeam)

  return (
    <Modal isOpen={true} onClose={onClose} title="Docházka" maxWidth="md">
      {isLoading || baseRows === null ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Bulk actions */}
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <span className="text-xs text-gray-500 mr-1">Označit vše:</span>
            <button
              onClick={() => markAll(1)}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100"
            >
              <Check className="h-3 w-3" />
              Přítomni
            </button>
            <button
              onClick={() => markAll(2)}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100"
            >
              <X className="h-3 w-3" />
              Nepřítomni
            </button>
            <button
              onClick={resetAll}
              className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium bg-gray-50 text-gray-500 hover:bg-gray-100"
            >
              Resetovat
            </button>
          </div>

          {rows.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Žádní členové. Přidejte členy do týmu.</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {rows.map((row) => (
                <div
                  key={row.memberId}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50"
                >
                  <span className="flex-1 text-sm text-gray-800">
                    {row.memberLastName} {row.memberFirstName}
                  </span>
                  <div className="flex gap-1">
                    {([1, 2, 3, 0] as AttendanceStatus[]).map((s) => (
                      <button
                        key={s}
                        title={STATUS_LABELS[s]}
                        onClick={() => setStatus(row.memberId, s)}
                        className={`flex items-center justify-center h-7 w-7 rounded-md text-xs transition-all ${
                          row.status === s ? STATUS_ACTIVE_CLASS[s] : STATUS_IDLE_CLASS
                        }`}
                      >
                        {STATUS_ICONS[s]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {saveMutation.isError && (
            <p className="mt-2 text-xs text-red-500">Chyba při ukládání docházky.</p>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Zrušit
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              loading={saveMutation.isPending}
              disabled={rows.length === 0}
            >
              Uložit docházku
            </Button>
          </div>
        </>
      )}
    </Modal>
  )
}
