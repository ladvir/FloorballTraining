export type AttendanceStatus = 0 | 1 | 2 | 3
// 0 = Unknown, 1 = Present, 2 = Absent, 3 = Excused

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
