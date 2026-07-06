import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { trainingsApi } from '../../api/trainings.api'
import { Search } from 'lucide-react'

interface TrainingOption {
  id: number
  name: string
  description?: string
}

interface Props {
  onSelect: (t: TrainingOption) => void
}

export function TrainingPicker({ onSelect }: Props) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const { data: trainings = [], isLoading } = useQuery({
    queryKey: ['trainings', 'individual'],
    queryFn: trainingsApi.getIndividual,
  })

  const filtered = useMemo(() => {
    if (!search) return trainings
    const q = search.toLowerCase()
    return trainings.filter(
      (t) => t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
    )
  }, [trainings, search])

  const handleSelect = (t: TrainingOption) => {
    onSelect(t)
    setSearch('')
    setOpen(false)
  }

  const isEmpty = !isLoading && trainings.length === 0

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Vybrat z připravených cvičení
        <span className="ml-1 text-xs font-normal text-gray-400">(volitelné)</span>
      </label>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          disabled={isEmpty}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setSearch(e.target.value)
            setOpen(true)
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={
            isLoading
              ? 'Načítám...'
              : isEmpty
                ? 'Žádné připravené tréninky — označte trénink jako individuální'
                : 'Hledat v individuálních trénincích...'
          }
          className="w-full rounded-lg border border-gray-300 pl-8 pr-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
        />
      </div>

      {open && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onMouseDown={() => handleSelect(t)}
                className="w-full text-left px-3 py-2 hover:bg-sky-50 text-sm"
              >
                <span className="font-medium text-gray-900">{t.name}</span>
                {t.description && (
                  <span className="block text-xs text-gray-400 truncate">{t.description}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && search && filtered.length === 0 && !isEmpty && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg px-3 py-2 text-sm text-gray-400">
          Žádný výsledek
        </div>
      )}
    </div>
  )
}
