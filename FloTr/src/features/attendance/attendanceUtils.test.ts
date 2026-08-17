import { describe, it, expect } from 'vitest'
import { calculateAttendanceRate, getDefaultStatus, summarizeAttendance } from './attendanceUtils'
import type { AttendanceRecord } from './attendanceUtils'

describe('calculateAttendanceRate', () => {
  it('returns 0 when total is 0', () => {
    expect(calculateAttendanceRate(0, 0)).toBe(0)
  })

  it('returns 0 when total is negative', () => {
    expect(calculateAttendanceRate(5, -1)).toBe(0)
  })

  it('returns 100 when all attended', () => {
    expect(calculateAttendanceRate(10, 10)).toBe(100)
  })

  it('returns 50 for half attendance', () => {
    expect(calculateAttendanceRate(5, 10)).toBe(50)
  })

  it('rounds to nearest integer', () => {
    expect(calculateAttendanceRate(1, 3)).toBe(33)
    expect(calculateAttendanceRate(2, 3)).toBe(67)
  })

  it('returns 0 when attended is 0', () => {
    expect(calculateAttendanceRate(0, 10)).toBe(0)
  })
})

describe('getDefaultStatus', () => {
  it('returns 0 (Unknown)', () => {
    expect(getDefaultStatus()).toBe(0)
  })
})

describe('summarizeAttendance', () => {
  it('returns all zeros for empty records', () => {
    expect(summarizeAttendance([])).toEqual({
      present: 0,
      absent: 0,
      excused: 0,
      unknown: 0,
      total: 0,
    })
  })

  it('counts each status correctly', () => {
    const records: AttendanceRecord[] = [
      { memberId: 1, status: 1 },
      { memberId: 2, status: 1 },
      { memberId: 3, status: 2 },
      { memberId: 4, status: 3 },
      { memberId: 5, status: 0 },
    ]
    expect(summarizeAttendance(records)).toEqual({
      present: 2,
      absent: 1,
      excused: 1,
      unknown: 1,
      total: 5,
    })
  })

  it('counts all as present', () => {
    const records: AttendanceRecord[] = [
      { memberId: 1, status: 1 },
      { memberId: 2, status: 1 },
    ]
    const result = summarizeAttendance(records)
    expect(result.present).toBe(2)
    expect(result.absent).toBe(0)
    expect(result.excused).toBe(0)
    expect(result.unknown).toBe(0)
    expect(result.total).toBe(2)
  })

  it('counts all as unknown when status is 0', () => {
    const records: AttendanceRecord[] = [
      { memberId: 1, status: 0 },
      { memberId: 2, status: 0 },
      { memberId: 3, status: 0 },
    ]
    const result = summarizeAttendance(records)
    expect(result.unknown).toBe(3)
    expect(result.total).toBe(3)
  })

  it('total equals length of input array', () => {
    const records: AttendanceRecord[] = [
      { memberId: 1, status: 1 },
      { memberId: 2, status: 2 },
      { memberId: 3, status: 3 },
    ]
    expect(summarizeAttendance(records).total).toBe(3)
  })
})
