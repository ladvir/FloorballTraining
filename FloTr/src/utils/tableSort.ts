import { useState } from 'react'

export type SortDir = 'asc' | 'desc'
export type SortValue = string | number | null | undefined

function compare(a: SortValue, b: SortValue): number {
  if (a == null && b == null) return 0
  if (a == null) return 1 // nulls / blanks last
  if (b == null) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), 'cs', { sensitivity: 'base', numeric: true })
}

/**
 * Generic client-side table sort. `accessors` maps a column key to a value getter for a row.
 * Returns the sorted rows plus the active key/direction and a `toggle(key)` for column headers.
 * Small tables — sorts on every render (no memo needed).
 */
export function useTableSort<T>(
  rows: T[],
  accessors: Record<string, (r: T) => SortValue>,
  initialKey: string,
  initialDir: SortDir = 'asc'
) {
  const [sortKey, setSortKey] = useState(initialKey)
  const [dir, setDir] = useState<SortDir>(initialDir)

  const toggle = (key: string) => {
    if (key === sortKey) {
      setDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setDir('asc')
    }
  }

  const acc = accessors[sortKey]
  const sorted = acc
    ? [...rows].sort((a, b) => compare(acc(a), acc(b)) * (dir === 'asc' ? 1 : -1))
    : rows

  return { sorted, sortKey, dir, toggle }
}
