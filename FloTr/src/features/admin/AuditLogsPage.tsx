import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { dfLocale } from '../../utils/dateLocale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
  'Login.External': { label: 'Přihlášení přes poskytovatele', variant: 'success' },
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
  'CalendarToken.Generated': { label: 'Sdílení kalendáře zapnuto', variant: 'info' },
  'CalendarToken.Revoked': { label: 'Sdílení kalendáře zrušeno', variant: 'warning' },
}

const ACTION_OPTIONS = Object.keys(ACTION_META)
const ENTITY_OPTIONS = ['User', 'Training', 'Activity', 'Appointment', 'Member', 'Club']

const selectClass =
  'h-9 w-full rounded-md border border-gray-300 bg-white px-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500'

export function AuditLogsPage() {
  const { t } = useTranslation()
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
      <PageHeader title={t('admin.auditTitle')} description={t('admin.auditDescription')} />

      {/* Filters */}
      <div className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6">
        <Input
          placeholder={t('admin.userEmail')}
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
        />
        <select className={selectClass} value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="">{t('admin.auditAction')}</option>
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
          <option value="">{t('admin.auditEntity')}</option>
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
            {t('common.filter')}
          </Button>
          <Button variant="outline" onClick={resetFilters}>
            {t('common.cancel')}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : isError ? (
        <EmptyState title={t('common.error')} description={t('admin.auditNoLogs')} />
      ) : items.length === 0 ? (
        <EmptyState title={t('admin.auditNoLogs')} description={t('common.noResults')} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-2">{t('admin.auditDate')}</th>
                  <th className="px-3 py-2">{t('admin.auditAction')}</th>
                  <th className="px-3 py-2">{t('admin.auditUser')}</th>
                  <th className="px-3 py-2">{t('admin.auditEntity')}</th>
                  <th className="px-3 py-2">{t('admin.auditChanges')}</th>
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
                        {format(parseISO(log.occurredAt), 'd.M.yyyy HH:mm:ss', {
                          locale: dfLocale(),
                        })}
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
              {t('common.page')} {page} {t('common.of')} {totalPages} ({t('common.total')}: {total})
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
