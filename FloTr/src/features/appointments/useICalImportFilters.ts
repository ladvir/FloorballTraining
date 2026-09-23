import { useState } from 'react'
import type { ICalImportFilters } from '../../api/index'

export const ICAL_TYPE_OPTIONS = [
  { value: 0, labelKey: 'appointments.typeTraining' },
  { value: 1, labelKey: 'appointments.typeCamp' },
  { value: 3, labelKey: 'appointments.typeMatch' },
  { value: 4, labelKey: 'appointments.typeOther' },
] as const

/** Shared "from/to + event types" state for the two iCal import flows (manual URL modal, team quick-import). */
export function useICalImportFilters() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [types, setTypes] = useState<number[]>([])

  const toggleType = (value: number) =>
    setTypes((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))

  const reset = () => {
    setFrom('')
    setTo('')
    setTypes([])
  }

  const asFilters = (): ICalImportFilters => ({
    from: from || undefined,
    to: to || undefined,
    types: types.length > 0 ? types : undefined,
  })

  return { from, to, types, setFrom, setTo, toggleType, reset, asFilters }
}
