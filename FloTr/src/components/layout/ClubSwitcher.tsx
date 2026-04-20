import { useState, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Building2, ChevronDown, Check } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useAuthStore } from '../../store/authStore'
import type { EffectiveRole } from '../../types/domain.types'

const roleBadgeColors: Record<EffectiveRole, string> = {
  Admin: 'bg-red-100 text-red-700',
  ClubAdmin: 'bg-orange-100 text-orange-700',
  HeadCoach: 'bg-purple-100 text-purple-700',
  Coach: 'bg-blue-100 text-blue-700',
  User: 'bg-gray-100 text-gray-600',
}

const roleLabels: Record<EffectiveRole, string> = {
  Admin: 'Admin',
  ClubAdmin: 'Kl. admin',
  HeadCoach: 'Hl. trenér',
  Coach: 'Trenér',
  User: 'Uživatel',
}

export function ClubSwitcher() {
  const { clubMemberships, activeClubId, activeClubName, switchClub } = useAuthStore()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  if (clubMemberships.length === 0) return null

  const handleSwitch = async (clubId: number) => {
    if (clubId === activeClubId || switching) return
    setSwitching(true)
    setOpen(false)
    try {
      await switchClub(clubId)
      queryClient.invalidateQueries()
    } finally {
      setSwitching(false)
    }
  }

  // Single club — static label
  if (clubMemberships.length === 1) {
    return (
      <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-gray-600">
        <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <span className="hidden sm:block max-w-40 truncate font-medium">{clubMemberships[0].clubName}</span>
      </div>
    )
  }

  // Multiple clubs — dropdown
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={switching}
        className={cn(
          'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors',
          open ? 'bg-sky-50 text-sky-700' : 'text-gray-700 hover:bg-gray-100',
          switching && 'opacity-50',
        )}
      >
        <Building2 className="h-4 w-4 flex-shrink-0" />
        <span className="hidden sm:block max-w-40 truncate">
          {switching ? 'Přepínám...' : (activeClubName ?? 'Zvolte klub')}
        </span>
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-56 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Přepnout klub</p>
          </div>
          {clubMemberships.map((m) => (
            <button
              key={m.clubId}
              onClick={() => handleSwitch(m.clubId)}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2.5 text-sm transition-colors last:rounded-b-lg',
                m.clubId === activeClubId
                  ? 'bg-sky-50 text-sky-700'
                  : 'text-gray-700 hover:bg-gray-50',
              )}
            >
              <span className="flex-1 truncate text-left font-medium">{m.clubName}</span>
              <span className={cn('rounded px-1.5 py-0.5 text-xs font-medium', roleBadgeColors[m.effectiveRole])}>
                {roleLabels[m.effectiveRole]}
              </span>
              {m.clubId === activeClubId && (
                <Check className="h-4 w-4 text-sky-600 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
