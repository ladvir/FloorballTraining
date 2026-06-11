import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { cs } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { LoadingSpinner } from '../../components/shared/LoadingSpinner'
import { EmptyState } from '../../components/shared/EmptyState'
import { auditLogsApi } from '../../api/index'

const PAGE_SIZE = 50

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'violet'

const ACTION_META: Record<string, { label: string; variant: Variant }> = {
  'Login.Success': { label: 'Přihlášení', variant: 'success' },
  'Login.Failed': { label: 'Neúspěšné přihlášení', variant: 'danger' },
  Logout: { label: 'Odhlášení', variant: 'info' },
  'Password.Changed': { label: 'Změna hesla', variant: 'warning' },
  'Password.Reset': { label: 'Reset hesla', variant: 'warning' },
  'Email.Changed': { label: 'Změna emailu', variant: 'warning' },
  'Role.Changed': { label: 'Změna role', variant: 'violet' },
  'User.Created': { label: 'Vytvoření uživatele', variant: 'info' },
  'User.Deleted': { label: 'Smazání uživatele', variant: 'danger' },
  'User.ClubMembershipRemoved': { label: 'Odebrání z klubu', variant: 'warning' },
  'Activity.Created': { label: 'Vytvoření aktivity', variant: 'info' },
  'Activity.Updated': { label: 'Úprava aktivity', variant: 'warning' },
  'Activity.Deleted': { label: 'Smazání aktivity', variant: 'danger' },
  'Training.Created': { label: 'Vytvoření tréninku', variant: 'info' },
  'Training.Updated': { label: 'Úprava tréninku', variant: 'warning' },
  'Training.Deleted': { label: 'Smazání tréninku', variant: 'danger' },
  'Appointment.Created': { label: 'Vytvoření události', variant: 'info' },
  'Appointment.Updated': { label: 'Úprava události', variant: 'warning' },
  'Appointment.Deleted': { label: 'Smazání události', variant: 'danger' },
  'Member.Deleted': { label: 'Smazání člena', variant: 'danger' },
  'Club.Deleted': { label: 'Smazání klubu', variant: 'danger' },
}

const ACTION_OPTIONS = Object.keys(ACTION_META)
const ENTITY_OPTIONS = ['User', 'Training', 'Activity', 'Appointment', 'Member', 'Club']

const selectClass =
  'h-9 w-full rounded-md border border-gray-300 bg-white px-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500'

export function AuditLogsPage() {
  const [userEmail, setUserEmail] = useState('')
  const [action, setAction] = useState('')
  const [entityType, setEntityType] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)

  // Applied filters (only change on submit / page change) so typing doesn't refetch.
  const [filters, setFilters] = useState({
    userEmail: '',
    action: '',
    entityType: '',
    from: '',
    to: '',
  })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit-logs', filters, page],
    queryFn: () =>
      auditLogsApi.get({
        userEmail: filters.userEmail || undefined,
        action: filters.action || undefined,
        entityType: filters.entityType || undefined,
        from: filters.from ? `${filters.from}T00:00:00` : undefined,
        to: filters.to ? `${filters.to}T23:59:59` : undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
    placeholderData: keepPreviousData,
  })

  const applyFilters = () => {
    setPage(1)
    setFilters({ userEmail, action, entityType, from, to })
  }

  const resetFilters = () => {
    setUserEmail('')
    setAction('')
    setEntityType('')
    setFrom('')
    setTo('')
    setPage(1)
    setFilters({ userEmail: '', action: '', entityType: '', from: '', to: '' })
  }

  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const items = data?.items ?? []

  return (
    <div>
      <PageHeader
        title="Audit log"
        description="Citlivé akce — přihlášení, změny rolí, mazání. Pouze pro administrátory."
      />

      {/* Filters */}
      <div className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6">
        <Input
          placeholder="Email uživatele"
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
        />
        <select className={selectClass} value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="">Všechny akce</option>
          {ACTION_OPTIONS.map((a) => (
            <option key={a} value={a}>
              {ACTION_META[a].label}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
        >
          <option value="">Všechny entity</option>
          {ENTITY_OPTIONS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <div className="flex gap-2">
          <Button onClick={applyFilters} className="flex-1">
            Filtrovat
          </Button>
          <Button variant="outline" onClick={resetFilters}>
            Zrušit
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : isError ? (
        <EmptyState title="Chyba" description="Audit log se nepodařilo načíst." />
      ) : items.length === 0 ? (
        <EmptyState title="Žádné záznamy" description="Pro zvolené filtry nejsou žádné záznamy." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-2">Čas</th>
                  <th className="px-3 py-2">Akce</th>
                  <th className="px-3 py-2">Uživatel</th>
                  <th className="px-3 py-2">Entita</th>
                  <th className="px-3 py-2">Detaily</th>
                  <th className="px-3 py-2">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((log) => {
                  const meta = ACTION_META[log.action] ?? {
                    label: log.action,
                    variant: 'default' as const,
                  }
                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-3 py-2 text-gray-600">
                        {format(parseISO(log.occurredAt), 'd.M.yyyy HH:mm:ss', { locale: cs })}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </td>
                      <td className="px-3 py-2 text-gray-700">{log.userEmail ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-600">
                        {log.entityType
                          ? `${log.entityType}${log.entityId ? ` #${log.entityId}` : ''}`
                          : '—'}
                      </td>
                      <td
                        className="max-w-xs truncate px-3 py-2 text-gray-500"
                        title={log.details ?? ''}
                      >
                        {log.details ?? '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-gray-400">
                        {log.ipAddress ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
            <span>
              Strana {page} z {totalPages} (celkem {total})
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
