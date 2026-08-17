import type { AwardType, XpAwardDto } from '../../types/domain.types'

export type AttendanceStatus = 0 | 1 | 2 | 3
// 0 = Unknown, 1 = Present, 2 = Absent, 3 = Excused

/** Intent of one coach bonus tap (#101). `pot` = player-of-training (single-select, 1/event). */
export type AwardAction =
  | { kind: 'toggle'; memberId: number; type: AwardType }
  | { kind: 'pot'; memberId: number }

const tempAward = (memberId: number, type: AwardType, appointmentId: number): XpAwardDto => ({
  id: -Date.now(),
  appointmentId,
  memberId,
  type,
  awardedByUserId: '',
  awardedAt: '',
})

/** Pure next-state for the awards list — drives optimistic UI, mirrored by the network calls. */
export function reduceAwards(
  list: XpAwardDto[],
  action: AwardAction,
  appointmentId: number
): XpAwardDto[] {
  if (action.kind === 'toggle') {
    const ex = list.find((a) => a.memberId === action.memberId && a.type === action.type)
    return ex
      ? list.filter((a) => a !== ex)
      : [...list, tempAward(action.memberId, action.type, appointmentId)]
  }
  // Player of training: single-select across the roster (tap again = clear).
  const mine = list.find((a) => a.memberId === action.memberId && a.type === 'PlayerOfTraining')
  if (mine) return list.filter((a) => a !== mine)
  return [
    ...list.filter((a) => a.type !== 'PlayerOfTraining'),
    tempAward(action.memberId, 'PlayerOfTraining', appointmentId),
  ]
}

export interface AttendanceRecord {
  memberId: number
  status: AttendanceStatus
  note?: string | null
}

export interface AttendanceSummary {
  present: number
  absent: number
  excused: number
  unknown: number
  total: number
}

export function calculateAttendanceRate(attended: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((attended / total) * 100)
}

export function getDefaultStatus(): AttendanceStatus {
  return 0
}

export function summarizeAttendance(records: AttendanceRecord[]): AttendanceSummary {
  const summary: AttendanceSummary = {
    present: 0,
    absent: 0,
    excused: 0,
    unknown: 0,
    total: records.length,
  }
  for (const r of records) {
    if (r.status === 1) summary.present++
    else if (r.status === 2) summary.absent++
    else if (r.status === 3) summary.excused++
    else summary.unknown++
  }
  return summary
}
