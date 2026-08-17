import { useQuery } from '@tanstack/react-query'
import { Check, X, MinusCircle } from 'lucide-react'
import { attendanceApi } from '../../api/attendance.api'

export function AttendanceSummaryBadge({ appointmentId }: { appointmentId: number }) {
  const { data } = useQuery({
    queryKey: ['attendance', 'appointment-summary', appointmentId],
    queryFn: () => attendanceApi.getByAppointment(appointmentId),
    staleTime: 30_000,
  })

  if (!data || data.length === 0) return null

  const present = data.filter((r) => r.status === 1).length
  const absent = data.filter((r) => r.status === 2).length
  const excused = data.filter((r) => r.status === 3).length

  return (
    <div
      data-testid="attendance-summary-badge"
      className="flex items-center gap-2 text-xs rounded-full bg-gray-50 px-2.5 py-1 border border-gray-200"
    >
      {present > 0 && (
        <span className="flex items-center gap-0.5 text-green-600 font-medium">
          <Check className="h-3 w-3" />
          {present}
        </span>
      )}
      {absent > 0 && (
        <span className="flex items-center gap-0.5 text-red-600 font-medium">
          <X className="h-3 w-3" />
          {absent}
        </span>
      )}
      {excused > 0 && (
        <span className="flex items-center gap-0.5 text-amber-600 font-medium">
          <MinusCircle className="h-3 w-3" />
          {excused}
        </span>
      )}
    </div>
  )
}
