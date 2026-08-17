import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { dfLocale } from '../../utils/dateLocale'
import { useTranslation } from 'react-i18next'
import { Check, X, MinusCircle, HelpCircle } from 'lucide-react'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { attendanceApi } from '../../api/attendance.api'
import type { AttendanceStatus } from '../../types/domain.types'

const STATUS_ICON: Record<AttendanceStatus, React.ReactNode> = {
  1: <Check className="h-4 w-4 text-green-600" />,
  2: <X className="h-4 w-4 text-red-600" />,
  3: <MinusCircle className="h-4 w-4 text-amber-600" />,
  0: <HelpCircle className="h-4 w-4 text-gray-400" />,
}

export function MemberAttendanceSection({ memberId }: { memberId: number }) {
  const { t } = useTranslation()

  const STATUS_LABEL: Record<AttendanceStatus, string> = {
    1: t('attendance.present'),
    2: t('attendance.absent'),
    3: t('attendance.excused'),
    0: t('common.unknown'),
  }

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', 'member', memberId],
    queryFn: () => attendanceApi.getByMember(memberId),
    staleTime: 60_000,
  })

  if (isLoading) return <LoadingSpinner />
  if (!data) return null

  const { present, absent, excused, totalEvents, attendanceRate, recentRecords } = data

  return (
    <section data-testid="member-attendance-section">
      <h2 className="text-base font-semibold text-gray-800 mb-3">{t('attendance.title')}</h2>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">{t('common.total')}</p>
          <p className="text-xl font-bold text-gray-800">{totalEvents}</p>
        </div>
        <div className="rounded-xl border border-green-100 bg-green-50 p-3 text-center">
          <p className="text-xs text-green-600 mb-1">{t('attendance.present')}</p>
          <p className="text-xl font-bold text-green-700">{present}</p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-center">
          <p className="text-xs text-red-600 mb-1">{t('attendance.absent')}</p>
          <p className="text-xl font-bold text-red-700">{absent}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-center">
          <p className="text-xs text-amber-600 mb-1">{t('attendance.excused')}</p>
          <p className="text-xl font-bold text-amber-700">{excused}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-gray-600">{t('attendance.attendanceRate')}:</span>
        <span className="text-sm font-semibold text-gray-800">{attendanceRate} %</span>
        <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${attendanceRate}%` }}
          />
        </div>
      </div>

      {recentRecords.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 bg-gray-50 border-b border-gray-100">
                <th className="px-3 py-2 font-medium">{t('nav.appointments')}</th>
                <th className="px-3 py-2 font-medium">{t('common.date')}</th>
                <th className="px-3 py-2 font-medium">{t('common.status')}</th>
              </tr>
            </thead>
            <tbody>
              {recentRecords.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-3 py-2 text-gray-800">{r.appointmentName ?? '—'}</td>
                  <td className="px-3 py-2 text-gray-500">
                    {format(parseISO(r.appointmentStart), 'd. M. yyyy', { locale: dfLocale() })}
                  </td>
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-1">
                      {STATUS_ICON[r.status as AttendanceStatus]}
                      {STATUS_LABEL[r.status as AttendanceStatus]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
