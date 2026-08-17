import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, XCircle, HelpCircle, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { rsvpApi } from '../../api/rsvp.api'
import { useAuthStore } from '../../store/authStore'

const STATUS_COLORS: Record<number, string> = {
  0: 'text-gray-400',
  1: 'text-green-600',
  2: 'text-red-500',
  3: 'text-amber-500',
}

const STATUS_ICONS: Record<number, React.ElementType> = {
  0: Clock,
  1: CheckCircle2,
  2: XCircle,
  3: HelpCircle,
}

interface Props {
  appointmentId: number
}

export function RsvpWidget({ appointmentId }: Props) {
  const { t } = useTranslation()
  const { effectiveRole } = useAuthStore()
  const isCoachOrAbove = ['Coach', 'HeadCoach', 'ClubAdmin', 'Admin'].includes(effectiveRole)
  const queryClient = useQueryClient()

  const STATUS_LABELS: Record<number, string> = {
    0: t('attendance.unset'),
    1: t('attendance.present'),
    2: t('attendance.absent'),
    3: t('attendance.excused'),
  }

  const { data, isLoading } = useQuery({
    queryKey: ['rsvp', appointmentId],
    queryFn: () => rsvpApi.get(appointmentId),
  })

  const { mutate: setStatus, isPending } = useMutation({
    mutationFn: (status: number) => rsvpApi.upsert(appointmentId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rsvp', appointmentId] })
    },
  })

  if (isLoading || !data) return null

  const myStatus = data.myStatus ?? 0
  const MyIcon = STATUS_ICONS[myStatus]

  return (
    <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">{t('appointments.rsvpTitle')}</h3>

      {/* My RSVP buttons */}
      <div className="mb-3">
        <p className="mb-1.5 text-xs text-gray-500">{t('attendance.memberAttendance')}</p>
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => {
            const Icon = STATUS_ICONS[s]
            const active = myStatus === s
            return (
              <button
                key={s}
                onClick={() => setStatus(s)}
                disabled={isPending}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? s === 1
                      ? 'border-green-300 bg-green-50 text-green-700'
                      : s === 2
                        ? 'border-red-300 bg-red-50 text-red-600'
                        : 'border-amber-300 bg-amber-50 text-amber-600'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {STATUS_LABELS[s]}
              </button>
            )
          })}
        </div>
        {myStatus !== 0 && (
          <p className={`mt-1.5 flex items-center gap-1 text-xs ${STATUS_COLORS[myStatus]}`}>
            <MyIcon className="h-3 w-3" />
            {STATUS_LABELS[myStatus]}
          </p>
        )}
      </div>

      {/* Summary counts */}
      <div className="flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1 text-green-600">
          <CheckCircle2 className="h-3 w-3" />
          {data.countYes}
        </span>
        <span className="flex items-center gap-1 text-red-500">
          <XCircle className="h-3 w-3" />
          {data.countNo}
        </span>
        <span className="flex items-center gap-1 text-amber-500">
          <HelpCircle className="h-3 w-3" />
          {data.countMaybe}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {data.countPending}
        </span>
      </div>

      {/* Coach view: all responses */}
      {isCoachOrAbove && data.all.length > 0 && (
        <div className="mt-3 border-t border-gray-200 pt-3">
          <p className="mb-2 text-xs font-medium text-gray-600">{t('attendance.teamAttendance')}</p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {data.all.map((r) => {
              const Icon = STATUS_ICONS[r.status]
              return (
                <div key={r.memberId} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700">
                    {r.memberFirstName} {r.memberLastName}
                  </span>
                  <span className={`flex items-center gap-1 ${STATUS_COLORS[r.status]}`}>
                    <Icon className="h-3 w-3" />
                    {STATUS_LABELS[r.status]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
