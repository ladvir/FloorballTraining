import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import type { MemberDto } from '../../../types/domain.types'

interface Props {
  open: boolean
  onClose: () => void
  members: MemberDto[]
  excludeMemberIds: Set<number>
  onConfirm: (member: MemberDto) => void
}

export function AddClubMemberModal({ open, onClose, members, excludeMemberIds, onConfirm }: Props) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return members
      .filter((m) => !excludeMemberIds.has(m.id))
      .filter((m) => {
        if (!q) return true
        return (
          m.firstName.toLowerCase().includes(q) ||
          m.lastName.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => a.lastName.localeCompare(b.lastName))
  }, [members, query, excludeMemberIds])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[80vh] w-full max-w-md flex-col rounded-xl bg-white shadow-xl">
        <div className="border-b border-gray-100 px-4 py-3">
          <h3 className="text-lg font-semibold text-gray-900">Přidat z klubu</h3>
        </div>
        <div className="border-b border-gray-100 px-4 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Hledat jméno…"
              className="h-9 w-full rounded-lg border border-gray-300 pl-8 pr-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-400">Žádný člen.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtered.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => { onConfirm(m); setQuery('') }}
                    className="flex w-full items-center justify-between px-4 py-2 text-left hover:bg-gray-50"
                  >
                    <span className="text-sm text-gray-900">
                      <strong>{m.lastName}</strong> {m.firstName}
                    </span>
                    <span className="text-xs text-gray-400">{m.birthYear || '—'}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex justify-end border-t border-gray-100 px-4 py-3">
          <Button variant="outline" size="sm" onClick={() => { setQuery(''); onClose() }}>Zavřít</Button>
        </div>
      </div>
    </div>
  )
}
