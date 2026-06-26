import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { cs } from 'date-fns/locale'
import { Check, X, MinusCircle, HelpCircle } from 'lucide-react'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { attendanceApi } from '../../api/attendance.api'
import type { AttendanceStatus } from '../../types/domain.types'

const STATUS_CELL: Record<AttendanceStatus, { icon: React.ReactNode; cls: string }> = {
  1: { icon: <Check className="h-3 w-3" />, cls: 'bg-green-100 text-green-700' },
  2: { icon: <X className="h-3 w-3" />, cls: 'bg-red-100 text-red-700' },
  3: { icon: <MinusCircle className="h-3 w-3" />, cls: 'bg-amber-100 text-amber-700' },
  0: { icon: <HelpCircle className="h-3 w-3" />, cls: 'bg-gray-50 text-gray-400' },
}

export function TeamAttendanceTab({ teamId }: { teamId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['attendance', 'team', teamId],
    queryFn: () => attendanceApi.getByTeam(teamId),
    staleTime: 60_000,
  })

  if (isLoading) return <LoadingSpinner />

  if (!data || data.events.length === 0) {
    return (
      <div data-testid="team-attendance-tab" className="text-center py-12 text-gray-400 text-sm">
        Žádná zaznamenaná docházka. Docházku zadejte přes detail týmové události.
      </div>
    )
  }

  const { events, members } = data

  return (
    <div data-testid="team-attendance-tab" className="space-y-6">
      {/* Per-member summary */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700">Přehled členů</h3>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="px-3 py-2 font-medium">Člen</th>
              <th className="px-3 py-2 font-medium text-green-600">✓</th>
              <th className="px-3 py-2 font-medium text-red-600">✗</th>
              <th className="px-3 py-2 font-medium text-amber-600">~</th>
              <th className="px-3 py-2 font-medium text-gray-600">%</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.memberId} className="border-b border-gray-50 last:border-0">
                <td className="px-3 py-1.5 text-gray-800">
                  {m.memberLastName} {m.memberFirstName}
                </td>
                <td className="px-3 py-1.5 text-green-700 font-medium">{m.present}</td>
                <td className="px-3 py-1.5 text-red-700 font-medium">{m.absent}</td>
                <td className="px-3 py-1.5 text-amber-700 font-medium">{m.excused}</td>
                <td className="px-3 py-1.5 text-gray-700 font-medium">{m.attendanceRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Event matrix */}
      {events.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700">Matice akcí</h3>
          </div>
          <table className="text-xs min-w-full">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="px-3 py-2 font-medium sticky left-0 bg-white">Člen</th>
                {events.map((e) => (
                  <th
                    key={e.appointmentId}
                    className="px-2 py-2 font-medium text-center whitespace-nowrap max-w-24"
                    title={e.appointmentName ?? undefined}
                  >
                    {format(parseISO(e.appointmentStart), 'd/M', { locale: cs })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.memberId} className="border-b border-gray-50 last:border-0">
                  <td className="px-3 py-1.5 text-gray-800 sticky left-0 bg-white whitespace-nowrap">
                    {m.memberLastName} {m.memberFirstName}
                  </td>
                  {events.map((e) => {
                    const record = e.memberAttendances.find((a) => a.memberId === m.memberId)
                    const status: AttendanceStatus = record ? record.status : 0
                    const cell = STATUS_CELL[status]
                    return (
                      <td key={e.appointmentId} className="px-2 py-1.5 text-center">
                        <span
                          className={`inline-flex items-center justify-center h-5 w-5 rounded ${cell.cls}`}
                        >
                          {cell.icon}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
