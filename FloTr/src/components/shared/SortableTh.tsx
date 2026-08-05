import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import type { SortDir } from '../../utils/tableSort'

/** A sortable table header cell. Wire it to a `useTableSort` result. */
export function SortableTh({
  label,
  columnKey,
  activeKey,
  dir,
  onSort,
  className = 'px-3 py-2 text-left',
  align = 'left',
}: {
  label: React.ReactNode
  columnKey: string
  activeKey: string
  dir: SortDir
  onSort: (key: string) => void
  className?: string
  align?: 'left' | 'right' | 'center'
}) {
  const active = activeKey === columnKey
  const Icon = active ? (dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
  const justify =
    align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'
  return (
    <th className={className}>
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        className={`inline-flex w-full items-center gap-1 ${justify} transition-colors hover:text-gray-700 ${
          active ? 'text-gray-700' : ''
        }`}
      >
        {label}
        <Icon className="h-3 w-3 shrink-0" />
      </button>
    </th>
  )
}
