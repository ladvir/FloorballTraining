import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { dfLocale } from '../../utils/dateLocale'
import { useTranslation } from 'react-i18next'
import { Check, X, MinusCircle, HelpCircle } from 'lucide-react'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { MemberLink } from '../../components/shared/MemberLink'
import { SortableTh } from '../../components/shared/SortableTh'
import { attendanceApi } from '../../api/attendance.api'
import { formatFullName } from '../../utils/name'
import { useTableSort } from '../../utils/tableSort'
import type { AttendanceStatus } from '../../types/domain.types'

const STATUS_CELL: Record<AttendanceStatus, { icon: React.ReactNode; cls: string }> = {
  1: { icon: <Check className="h-3 w-3" />, cls: 'bg-green-100 text-green-700' },
  2: { icon: <X className="h-3 w-3" />, cls: 'bg-red-100 text-red-700' },
  3: { icon: <MinusCircle className="h-3 w-3" />, cls: 'bg-amber-100 text-amber-700' },
  0: { icon: <HelpCircle className="h-3 w-3" />, cls: 'bg-gray-50 text-gray-400' },
}

const APPOINTMENT_TYPE_KEYS = [
  'typeTraining',
  'typeCamp',
  'typePromotion',
  'typeMatch',
  'typeOther',
  'typeWorkshop',
  'typeOrganizing',
  'typePreperation',
  'typeTesting',
]
const ALL = 'all'
const selectCls =
  'h-8 rounded-lg border border-gray-300 bg-white px-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20'

export function TeamAttendanceTab({ teamId }: { teamId: number }) {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: ['attendance', 'team', teamId],
    queryFn: () => attendanceApi.getByTeam(teamId),
    staleTime: 60_000,
  })
  // null = not chosen yet → trainings only (attendance stats count trainings) and the latest month.
  const [typeSel, setTypeSel] = useState<string | null>(null)
  const [monthSel, setMonthSel] = useState<string | null>(null)

  const allEvents = useMemo(() => data?.events ?? [], [data])
  const months = useMemo(
    () => [...new Set(allEvents.map((e) => e.appointmentStart.slice(0, 7)))].sort().reverse(),
    [allEvents]
  )
  const types = useMemo(
    () => [...new Set(allEvents.map((e) => e.appointmentType))].sort((a, b) => a - b),
    [allEvents]
  )
  const type = typeSel ?? (types.includes(0) ? '0' : ALL)
  const month = monthSel ?? months[0] ?? ALL
  // Oldest → newest columns; the server sends newest first.
  const events = useMemo(
    () =>
      allEvents
        .filter(
          (e) =>
            (type === ALL || e.appointmentType === Number(type)) &&
            (month === ALL || e.appointmentStart.startsWith(month))
        )
        .reverse(),
    [allEvents, type, month]
  )
  // Per-member totals follow the filter (server totals cover everything).
  const members = useMemo(
    () =>
      (data?.members ?? []).map((m) => {
        const recs = events.flatMap((e) =>
          e.memberAttendances.filter((a) => a.memberId === m.memberId)
        )
        const present = recs.filter((a) => a.status === 1).length
        return {
          ...m,
          present,
          absent: recs.filter((a) => a.status === 2).length,
          excused: recs.filter((a) => a.status === 3).length,
          attendanceRate: recs.length ? Math.round((present / recs.length) * 100) : 0,
        }
      }),
    [data, events]
  )
  const { sorted, sortKey, dir, toggle } = useTableSort(
    members,
    {
      name: (m) => m.memberLastName,
      present: (m) => m.present,
      absent: (m) => m.absent,
      excused: (m) => m.excused,
      rate: (m) => m.attendanceRate,
    },
    'name'
  )

  if (isLoading) return <LoadingSpinner />

  if (!data || allEvents.length === 0) {
    return (
      <div data-testid="team-attendance-tab" className="text-center py-12 text-gray-400 text-sm">
        {t('attendance.noData')}
      </div>
    )
  }

  // One table: the per-member totals (✓ ✗ ~ %) and the per-event matrix share the same rows, so the
  // event columns are simply appended after the totals (user request 2026-08-05).
  // The wrapper scrolls both ways (not just x) so the date header can stay sticky while scrolling down.
  return (
    <div data-testid="team-attendance-tab" className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={month}
          onChange={(e) => setMonthSel(e.target.value)}
          className={selectCls}
          aria-label={t('attendance.filterMonth')}
        >
          <option value={ALL}>{t('attendance.allMonths')}</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {format(parseISO(`${m}-01`), 'LLLL yyyy', { locale: dfLocale() })}
            </option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => setTypeSel(e.target.value)}
          className={selectCls}
          aria-label={t('attendance.filterType')}
        >
          <option value={ALL}>{t('attendance.allTypes')}</option>
          {types.map((ty) => (
            <option key={ty} value={ty}>
              {t(`appointments.${APPOINTMENT_TYPE_KEYS[ty] ?? 'typeOther'}`)}
            </option>
          ))}
        </select>
      </div>
      {events.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">{t('attendance.noData')}</div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-auto max-h-[70vh]">
          <table className="text-xs min-w-full">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <SortableTh
                  label={t('common.member')}
                  columnKey="name"
                  activeKey={sortKey}
                  dir={dir}
                  onSort={toggle}
                  className="px-3 py-2 font-medium sticky left-0 top-0 z-30 bg-white"
                />
                <SortableTh
                  label="✓"
                  columnKey="present"
                  activeKey={sortKey}
                  dir={dir}
                  onSort={toggle}
                  align="center"
                  className="px-3 py-2 font-medium text-center text-green-600 sticky top-0 z-20 bg-white"
                />
                <SortableTh
                  label="✗"
                  columnKey="absent"
                  activeKey={sortKey}
                  dir={dir}
                  onSort={toggle}
                  align="center"
                  className="px-3 py-2 font-medium text-center text-red-600 sticky top-0 z-20 bg-white"
                />
                <SortableTh
                  label="~"
                  columnKey="excused"
                  activeKey={sortKey}
                  dir={dir}
                  onSort={toggle}
                  align="center"
                  className="px-3 py-2 font-medium text-center text-amber-600 sticky top-0 z-20 bg-white"
                />
                <SortableTh
                  label="%"
                  columnKey="rate"
                  activeKey={sortKey}
                  dir={dir}
                  onSort={toggle}
                  align="center"
                  className="px-3 py-2 font-medium text-center text-gray-600 sticky top-0 z-20 bg-white"
                />
                {events.map((e) => (
                  <th
                    key={e.appointmentId}
                    className="px-2 py-2 font-medium text-center whitespace-nowrap max-w-24 border-l border-gray-100 sticky top-0 z-20 bg-white"
                    title={e.appointmentName ?? undefined}
                  >
                    {format(parseISO(e.appointmentStart), 'd/M', { locale: dfLocale() })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((m) => (
                <tr key={m.memberId} className="border-b border-gray-50 last:border-0">
                  <td className="px-3 py-1.5 sticky left-0 z-10 bg-white whitespace-nowrap font-medium">
                    <MemberLink
                      memberId={m.memberId}
                      name={formatFullName(m.memberFirstName, m.memberLastName)}
                    />
                  </td>
                  <td className="px-3 py-1.5 text-center text-green-700 font-medium">
                    {m.present}
                  </td>
                  <td className="px-3 py-1.5 text-center text-red-700 font-medium">{m.absent}</td>
                  <td className="px-3 py-1.5 text-center text-amber-700 font-medium">
                    {m.excused}
                  </td>
                  <td className="px-3 py-1.5 text-center text-gray-700 font-medium">
                    {m.attendanceRate}%
                  </td>
                  {events.map((e) => {
                    const record = e.memberAttendances.find((a) => a.memberId === m.memberId)
                    const status: AttendanceStatus = record ? record.status : 0
                    const cell = STATUS_CELL[status]
                    return (
                      <td
                        key={e.appointmentId}
                        className="px-2 py-1.5 text-center border-l border-gray-50"
                      >
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
