import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Check, Calendar } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { appointmentsApi, teamsApi } from '../../api/index'
import type { ICalImportResult } from '../../api/index'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function ICalImportModal({ isOpen, onClose }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [url, setUrl] = useState('')
  const [teamId, setTeamId] = useState(0)
  const [importResult, setImportResult] = useState<ICalImportResult | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  const { data: teams } = useQuery({ queryKey: ['teams'], queryFn: teamsApi.getAll })

  const mutation = useMutation({
    mutationFn: () => appointmentsApi.importICal(url, teamId),
    onSuccess: (data) => {
      setImportResult(data)
      setImportError(null)
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: { message?: string } } })?.response?.data
      setImportError(data?.message ?? t('appointments.saveFailed'))
      setImportResult(null)
    },
  })

  const handleClose = () => {
    setUrl('')
    setTeamId(0)
    setImportResult(null)
    setImportError(null)
    onClose()
  }

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  if (!isOpen) return null

  const canImport = url.trim().length > 0 && teamId > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-sky-600" />
          <h3 className="text-lg font-semibold text-gray-900">{t('appointments.importTitle')}</h3>
        </div>

        <div className="space-y-4">
          <Input
            label={t('appointments.icalUrlLabel')}
            placeholder="https://example.com/calendar.ics"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('common.team')}
            </label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value={0}>{t('appointments.selectTeamPlaceholder')}</option>
              {teams?.map((tm) => (
                <option key={tm.id} value={tm.id}>
                  {tm.name}
                </option>
              ))}
            </select>
          </div>

          {importResult && (
            <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                {t('appointments.importResultMsg', {
                  imported: importResult.imported,
                  updated: importResult.updated,
                  skipped: importResult.skipped,
                })}
                {importResult.errors.length > 0 && (
                  <span className="block text-orange-600 mt-1">
                    {importResult.errors.join('; ')}
                  </span>
                )}
              </span>
            </div>
          )}

          {importError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{importError}</span>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={handleClose}>
            {t('common.close')}
          </Button>
          <Button
            size="sm"
            disabled={!canImport}
            loading={mutation.isPending}
            onClick={() => {
              setImportResult(null)
              setImportError(null)
              mutation.mutate()
            }}
          >
            {t('common.import')}
          </Button>
        </div>
      </div>
    </div>
  )
}
