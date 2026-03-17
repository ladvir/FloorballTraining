import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { cs } from 'date-fns/locale'
import { Download, FileSpreadsheet } from 'lucide-react'
import { Modal } from '../../components/shared/Modal'
import { Button } from '../../components/ui/Button'
import { seasonsApi } from '../../api/index'
import { usersApi } from '../../api/users.api'
import { apiClient } from '../../api/axios'
import { useAuthStore } from '../../store/authStore'

interface Props {
  isOpen: boolean
  onClose: () => void
}

/** Generate array of {year, month} within a season's date range */
function getSeasonMonths(startDate: string, endDate: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const months: { year: number; month: number; label: string }[] = []
  const current = new Date(start.getFullYear(), start.getMonth(), 1)

  while (current <= end) {
    months.push({
      year: current.getFullYear(),
      month: current.getMonth() + 1,
      label: format(current, 'LLLL yyyy', { locale: cs }),
    })
    current.setMonth(current.getMonth() + 1)
  }

  return months
}

/** Find the season whose date range contains today */
function findCurrentSeason(seasons: { id: number; startDate: string; endDate: string }[]) {
  const now = new Date()
  return seasons.find((s) => {
    const start = new Date(s.startDate)
    const end = new Date(s.endDate)
    return now >= start && now <= end
  })
}

export function ExportWorkTimeModal({ isOpen, onClose }: Props) {
  const { isAdmin } = useAuthStore()
  const [selectedSeasonId, setSelectedSeasonId] = useState<number>(0)
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: seasons } = useQuery({ queryKey: ['seasons'], queryFn: seasonsApi.getAll })
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAll,
    enabled: isAdmin,
  })

  // Auto-select current season
  const currentSeason = useMemo(() => {
    if (!seasons?.length) return undefined
    if (selectedSeasonId) return seasons.find((s) => s.id === selectedSeasonId)
    const auto = findCurrentSeason(seasons)
    return auto
  }, [seasons, selectedSeasonId])

  // Months in selected season
  const months = useMemo(() => {
    if (!currentSeason) return []
    return getSeasonMonths(currentSeason.startDate, currentSeason.endDate)
  }, [currentSeason])

  // Auto-select current month
  const effectiveMonth = useMemo(() => {
    if (selectedMonth) return selectedMonth
    if (!months.length) return ''
    const now = new Date()
    const current = months.find((m) => m.year === now.getFullYear() && m.month === now.getMonth() + 1)
    return current ? `${current.year}-${current.month}` : `${months[0].year}-${months[0].month}`
  }, [selectedMonth, months])

  const handleDownload = async () => {
    if (!effectiveMonth) return
    const [year, month] = effectiveMonth.split('-').map(Number)
    setDownloading(true)
    setError(null)

    try {
      const params: Record<string, string | number> = { year, month }
      if (isAdmin && selectedUserId) {
        params.userId = selectedUserId
      }

      const response = await apiClient.get('/appointments/export', {
        params,
        responseType: 'blob',
      })

      // Extract filename from Content-Disposition header or use fallback
      const disposition = response.headers['content-disposition'] as string | undefined
      const filenameMatch = disposition?.match(/filename\*?=(?:UTF-8''|"?)([^";]+)/i)
      const serverFilename = filenameMatch?.[1] ? decodeURIComponent(filenameMatch[1]) : null
      const fallbackFilename = `vykaz-prace-${year}-${String(month).padStart(2, '0')}.xlsx`

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = serverFilename || fallbackFilename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      onClose()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } }
      if (axiosErr?.response?.status === 404) {
        setError('Žádné události pro export v tomto měsíci.')
      } else {
        setError('Export se nezdařil.')
      }
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export výkazu práce" maxWidth="sm">
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-lg bg-sky-50 p-3">
          <FileSpreadsheet className="h-8 w-8 text-sky-600" />
          <div>
            <p className="text-sm font-medium text-gray-900">Výkaz práce do Excelu</p>
            <p className="text-xs text-gray-500">Vyberte měsíc a stáhne se soubor s přehledem událostí.</p>
          </div>
        </div>

        {/* Season selector */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Sezóna</label>
          <select
            value={selectedSeasonId || currentSeason?.id || 0}
            onChange={(e) => {
              setSelectedSeasonId(Number(e.target.value))
              setSelectedMonth('')
            }}
            className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            {seasons?.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Month selector */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Měsíc</label>
          {months.length > 0 ? (
            <select
              value={effectiveMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              {months.map((m) => (
                <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                  {m.label}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-gray-400">Vyberte sezónu</p>
          )}
        </div>

        {/* User selector (admin only) */}
        {isAdmin && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Uživatel</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="">-- já (aktuální uživatel) --</option>
              {users?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName ? `${u.firstName} ${u.lastName}` : u.email}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Zrušit</Button>
          <Button
            onClick={handleDownload}
            loading={downloading}
            disabled={!effectiveMonth}
          >
            <Download className="h-4 w-4" />
            Stáhnout Excel
          </Button>
        </div>
      </div>
    </Modal>
  )
}
